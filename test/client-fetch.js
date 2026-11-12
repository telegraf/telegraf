const test = require('ava')
const http = require('http')
const { Readable } = require('stream')
const { default: ApiClient } = require('../lib/core/network/client')
const { TelegramError } = require('../lib/core/network/error')
const { Polling } = require('../lib/core/network/polling')
const Input = require('../lib/input')

// Every warning issued in this file.
const warnings = []
process.emitWarning = (message, type, code) =>
  warnings.push({ message, type, code })

const TOKEN = '123456:SECRET-abc_DEF'
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// A custom fetch that wraps the global one and logs each request.
function createFetchSpy() {
  const calls = []
  const fetch = (url, init) => {
    calls.push(`${init.method} ${new URL(url).pathname}`)
    return globalThis.fetch(url, init)
  }
  return { calls, fetch }
}

// Parses a multipart body into its parts by name: a string, or a file.
function parseMultipart(body, contentType) {
  const boundary = /boundary=(.+)$/.exec(contentType)[1]
  const parts = {}
  for (const raw of body.split(`--${boundary}`).slice(1, -1)) {
    const split = raw.indexOf('\r\n\r\n')
    const head = raw.slice(0, split)
    const content = raw.slice(split + 4, -2)
    const name = /name="([^"]*)"/.exec(head)[1]
    const filename = /filename="([^"]*)"/.exec(head)
    parts[name] = filename ? { file: filename[1], content } : content
  }
  return parts
}

// A local stand-in for the Bot API, called through a custom fetch. It answers every call
// and records the request. It also serves one file, and a 404 for another.
async function withApi(run, answer = { ok: true, result: true }, status = 200) {
  const requests = []
  const server = http.createServer((req, res) => {
    if (req.url === '/files/a.txt') return res.end('downloaded')
    if (req.url === '/files/missing') return res.writeHead(404).end('nothing')
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('error', () => {})
    req.on('end', () => {
      const type = req.headers['content-type']
      const body = Buffer.concat(chunks).toString()
      const multipart = type.startsWith('multipart/form-data')
      requests.push({
        url: req.url,
        type,
        json: multipart ? undefined : JSON.parse(body),
        parts: multipart ? parseMultipart(body, type) : undefined,
      })
      res.writeHead(status, { 'content-type': 'application/json' })
      res.end(typeof answer === 'string' ? answer : JSON.stringify(answer))
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  const { calls, fetch } = createFetchSpy()
  const client = new ApiClient(TOKEN, { apiRoot: origin, fetch })
  try {
    return await run({ client, requests, origin, calls })
  } finally {
    server.closeAllConnections()
    server.close()
  }
}

test.serial(
  'should warn about a custom agent, not the default agent',
  async (t) => {
    const agents = () =>
      warnings.filter((warning) => warning.code === 'TELEGRAF_AGENT')
    // Port 1 is closed, so the request fails. An https `apiRoot` gets the default agent.
    const apiRoot = 'https://127.0.0.1:1'
    const { fetch } = createFetchSpy()

    const plain = new ApiClient(TOKEN, { apiRoot, fetch })
    t.truthy(plain.options.agent, 'there is an agent by default')
    await t.throwsAsync(plain.callApi('getMe', {}))
    t.deepEqual(agents(), [])

    const agent = new http.Agent()
    const set = new ApiClient(TOKEN, { apiRoot, fetch, agent })
    await t.throwsAsync(set.callApi('getMe', {}))
    t.is(agents().length, 1)
    t.regex(agents()[0].message, /`agent` and `attachmentAgent` are ignored/)
  }
)

test('should send a call through the custom fetch', async (t) => {
  await withApi(async ({ client, requests, calls }) => {
    const result = await client.callApi('sendMessage', {
      chat_id: 1,
      text: 'a',
      reply_markup: null,
    })

    t.true(result)
    t.deepEqual(calls, [`POST /bot${TOKEN}/sendMessage`])
    t.is(requests[0].type, 'application/json')
    t.deepEqual(requests[0].json, { chat_id: 1, text: 'a' })
  })
})

test('should upload files like the default transport', async (t) => {
  await withApi(async ({ client, requests }) => {
    await client.callApi('sendMediaGroup', {
      chat_id: 1,
      photo: Input.fromBuffer(Buffer.from('top level'), 'a.png'),
      media: [
        {
          type: 'document',
          media: Input.fromReadableStream(Readable.from(['a ', 'stream'])),
          thumbnail: { source: Buffer.from('plain literal') },
        },
      ],
      reply_parameters: { message_id: 5 },
    })

    const [{ type, parts }] = requests
    t.regex(type, /^multipart\/form-data; boundary=/)
    t.is(parts.chat_id, '1')
    t.deepEqual(JSON.parse(parts.reply_parameters), { message_id: 5 })
    t.deepEqual(parts.photo, { file: 'a.png', content: 'top level' })
    const [item] = JSON.parse(parts.media)
    const referred = (reference) => parts[reference.replace('attach://', '')]
    t.deepEqual(referred(item.media), {
      file: 'media.dat',
      content: 'a stream',
    })
    t.deepEqual(referred(item.thumbnail), {
      file: 'media.dat',
      content: 'plain literal',
    })
  })
})

test('should download a { url } file with the custom fetch', async (t) => {
  await withApi(async ({ client, requests, origin, calls }) => {
    await client.callApi('sendDocument', {
      document: Input.fromURLStream(`${origin}/files/a.txt`, 'a.txt'),
    })

    t.deepEqual(calls, ['GET /files/a.txt', `POST /bot${TOKEN}/sendDocument`])
    t.deepEqual(requests[0].parts.document, {
      file: 'a.txt',
      content: 'downloaded',
    })
  })
})

test('should start the request after all { url } downloads respond', async (t) => {
  const events = []
  const files = http.createServer((req, res) => {
    events.push(`asked ${req.url}`)
    setTimeout(() => {
      events.push(`answered ${req.url}`)
      res.end(`contents of ${req.url}`)
    }, 150)
  })
  const api = http.createServer((req, res) => {
    events.push('request opened')
    req.resume()
    req.on('end', () => {
      res.setHeader('content-type', 'application/json')
      res.end('{"ok":true,"result":true}')
    })
  })
  await new Promise((resolve) => files.listen(0, '127.0.0.1', resolve))
  await new Promise((resolve) => api.listen(0, '127.0.0.1', resolve))
  t.teardown(() => {
    for (const server of [files, api]) {
      server.closeAllConnections()
      server.close()
    }
  })
  const client = new ApiClient(TOKEN, {
    apiRoot: `http://127.0.0.1:${api.address().port}`,
    fetch: createFetchSpy().fetch,
  })
  const url = (name) => `http://127.0.0.1:${files.address().port}/${name}`

  await client.callApi('sendMediaGroup', {
    media: ['a', 'b', 'c'].map((name) => ({
      type: 'document',
      media: Input.fromURLStream(url(name)),
    })),
  })

  t.deepEqual(
    events.slice(0, 3).sort(),
    ['asked /a', 'asked /b', 'asked /c'],
    'all are asked for before any has answered'
  )
  t.is(events[6], 'request opened', 'after the last has answered')
  t.is(events.length, 7)
})

test('should reject on a { url } download error status', async (t) => {
  await withApi(async ({ client, requests, origin }) => {
    const url = `${origin}/files/missing`
    const call = client.callApi('sendDocument', {
      document: Input.fromURLStream(url),
    })

    await t.throwsAsync(call, {
      message: `Unable to download '${url}': 404 Not Found`,
    })
    t.is(requests.length, 0, 'the request was never opened')
  })
})

test('should throw a TelegramError for an API error', async (t) => {
  const refusal = { ok: false, error_code: 400, description: 'Bad Request' }
  await withApi(
    async ({ client }) => {
      const error = await t.throwsAsync(client.callApi('getMe', {}), {
        instanceOf: TelegramError,
        message: '400: Bad Request',
      })
      t.deepEqual(error.on, { method: 'getMe', payload: {} })
    },
    refusal,
    400
  )
})

test('should throw a TelegramError for a non-API error response', async (t) => {
  await withApi(
    async ({ client }) => {
      await t.throwsAsync(client.callApi('getMe', {}), {
        instanceOf: TelegramError,
        message: '502: Bad Gateway',
      })
    },
    '<html>',
    502
  )
})

test('should throw 401 for a missing token', async (t) => {
  const { calls, fetch } = createFetchSpy()
  const client = new ApiClient(undefined, { fetch })

  await t.throwsAsync(client.callApi('getMe', {}), {
    message: '401: Bot Token is required',
  })
  t.deepEqual(calls, [])
})

// A stream that never ends on its own.
const createEndlessStream = () => {
  let sent = false
  return new Readable({
    read() {
      if (!sent) this.push('start')
      sent = true
    },
  })
}

test('should destroy source streams on a request error', async (t) => {
  // Port 1 is closed, so the request fails.
  const { fetch } = createFetchSpy()
  const client = new ApiClient(TOKEN, { apiRoot: 'http://127.0.0.1:1', fetch })
  const first = createEndlessStream()
  const second = createEndlessStream()
  const error = await t.throwsAsync(
    client.callApi('sendMediaGroup', {
      media: [
        { type: 'photo', media: Input.fromReadableStream(first) },
        { type: 'photo', media: Input.fromReadableStream(second) },
      ],
    })
  )

  const text = [error.message, error.stack, String(error.cause?.message)]
  t.false(text.join('\n').includes('SECRET'))
  await delay(50)
  t.true(first.destroyed)
  t.true(second.destroyed)
})

test('should abort a pending call', async (t) => {
  const server = http.createServer((req) => req.resume())
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.teardown(() => {
    server.closeAllConnections()
    server.close()
  })
  const controller = new AbortController()
  const { signal } = controller
  const listeners = new Set()
  const { addEventListener, removeEventListener } = signal
  signal.addEventListener = (type, listener, options) => {
    listeners.add(listener)
    addEventListener.call(signal, type, listener, options)
  }
  signal.removeEventListener = (type, listener) => {
    listeners.delete(listener)
    removeEventListener.call(signal, type, listener)
  }
  const { fetch } = createFetchSpy()
  const client = new ApiClient(TOKEN, {
    apiRoot: `http://127.0.0.1:${server.address().port}`,
    fetch,
  })
  const stream = createEndlessStream()
  const call = client.callApi(
    'sendDocument',
    { document: Input.fromReadableStream(stream) },
    { signal }
  )
  setTimeout(() => controller.abort(), 100)

  await t.throwsAsync(call, { name: 'AbortError' })
  await delay(50)
  t.true(stream.destroyed)
  t.is(listeners.size, 0)
})

test('should abort a download on a request error', async (t) => {
  // A file that starts, and does not end.
  let closed = false
  const files = http.createServer((req, res) => {
    res.on('close', () => (closed = true))
    res.write('start')
  })
  await new Promise((resolve) => files.listen(0, '127.0.0.1', resolve))
  t.teardown(() => {
    files.closeAllConnections()
    files.close()
  })
  const url = `http://127.0.0.1:${files.address().port}/a`
  // Port 1 is closed, so the request fails.
  const { fetch } = createFetchSpy()
  const client = new ApiClient(TOKEN, { apiRoot: 'http://127.0.0.1:1', fetch })

  await t.throwsAsync(
    client.callApi('sendDocument', { document: Input.fromURLStream(url) })
  )
  await delay(200)
  t.true(closed)
})

test('should abort during a pending download', async (t) => {
  // A host that accepts the connection and never responds.
  let closed = false
  const files = http.createServer((req, res) => {
    res.on('close', () => (closed = true))
  })
  await new Promise((resolve) => files.listen(0, '127.0.0.1', resolve))
  t.teardown(() => {
    files.closeAllConnections()
    files.close()
  })
  const url = `http://127.0.0.1:${files.address().port}/a`
  const controller = new AbortController()

  await withApi(async ({ client, requests }) => {
    const call = client.callApi(
      'sendDocument',
      { document: Input.fromURLStream(url) },
      { signal: controller.signal }
    )
    setTimeout(() => controller.abort(), 100)

    await t.throwsAsync(call, { name: 'AbortError' })
    t.is(requests.length, 0, 'the request was never opened')
  })
  await delay(100)
  t.true(closed, 'the download is closed')
})

test('polling should retry after a custom fetch error', async (t) => {
  // What a standard fetch rejects with. The wait before the next try is cut short.
  const failure = Object.assign(new TypeError('fetch failed'), {
    parameters: { retry_after: 0 },
  })
  const poll = async (options) => {
    let calls = 0
    const telegram = {
      options,
      async callApi(method, payload) {
        if (++calls === 1) throw failure
        if (payload.timeout !== undefined) polling.stop()
        return []
      },
    }
    const polling = new Polling(telegram, [])
    await polling.loop(async () => {})
    return calls
  }

  t.is(await poll({ fetch: globalThis.fetch }), 3, 'failed, polled, synced')
  await t.throwsAsync(poll({}), { is: failure }, 'not with node-fetch')
})
