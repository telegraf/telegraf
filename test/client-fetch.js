const test = require('ava')
const http = require('http')
const { Readable } = require('stream')
const { default: ApiClient } = require('../lib/core/network/client')
const { TelegramError } = require('../lib/core/network/error')
const { Polling } = require('../lib/core/network/polling')
const Input = require('../lib/input')
const { fixtures, withResolvers } = require('./_helpers')

// Every warning issued in this file.
const warnings = []
process.emitWarning = (message, type, code) =>
  warnings.push({ message, type, code })

const TOKEN = '123456:SECRET-abc_DEF'
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const requestLine = ({ url, init }) => `${init.method} ${new URL(url).pathname}`

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
  const { calls, fetch } = fixtures.fetch.recorder(globalThis.fetch)
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
    const { fetch } = fixtures.fetch.recorder(globalThis.fetch)

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
    t.deepEqual(calls.map(requestLine), [`POST /bot${TOKEN}/sendMessage`])
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
        {
          type: 'document',
          media: Input.fromLazyStream(async () => Readable.from(['lazy'])),
        },
      ],
      reply_parameters: { message_id: 5 },
    })

    const [{ type, parts }] = requests
    t.regex(type, /^multipart\/form-data; boundary=/)
    t.is(parts.chat_id, '1')
    t.deepEqual(JSON.parse(parts.reply_parameters), { message_id: 5 })
    t.deepEqual(parts.photo, { file: 'a.png', content: 'top level' })
    const [item, lazy] = JSON.parse(parts.media)
    const referred = (reference) => parts[reference.replace('attach://', '')]
    t.deepEqual(referred(lazy.media), { file: 'media.dat', content: 'lazy' })
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

    t.deepEqual(calls.map(requestLine), [
      `POST /bot${TOKEN}/sendDocument`,
      'GET /files/a.txt',
    ])
    t.deepEqual(requests[0].parts.document, {
      file: 'a.txt',
      content: 'downloaded',
    })
  })
})

test('should download a { url } file when the upload reaches it', async (t) => {
  const events = []
  const files = http.createServer((req, res) => {
    events.push(`asked ${req.url}`)
    res.write('contents ')
    setTimeout(() => {
      events.push(`sent ${req.url}`)
      res.end(`of ${req.url}`)
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
    fetch: fixtures.fetch.recorder(globalThis.fetch).fetch,
  })
  const url = (name) => `http://127.0.0.1:${files.address().port}/${name}`

  await client.callApi('sendMediaGroup', {
    media: ['a', 'b'].map((name) => ({
      type: 'document',
      media: Input.fromURLStream(url(name)),
    })),
  })

  t.deepEqual(events.slice(0, 2).sort(), ['asked /a', 'request opened'])
  t.deepEqual(events.slice(2), ['sent /a', 'asked /b', 'sent /b'])
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
    t.is(requests.length, 0, 'the request was not completed')
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
  const { calls, fetch } = fixtures.fetch.recorder(globalThis.fetch)
  const client = new ApiClient(undefined, { fetch })

  await t.throwsAsync(client.callApi('getMe', {}), {
    message: '401: Bot Token is required',
  })
  t.deepEqual(calls, [])
})

test('should destroy source streams on a request error', async (t) => {
  // Port 1 is closed, so the request fails.
  const { fetch } = fixtures.fetch.recorder(globalThis.fetch)
  const client = new ApiClient(TOKEN, { apiRoot: 'http://127.0.0.1:1', fetch })
  const first = fixtures.stream.infinite()
  const second = fixtures.stream.infinite()
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
  const { fetch } = fixtures.fetch.recorder(globalThis.fetch)
  const client = new ApiClient(TOKEN, {
    apiRoot: `http://127.0.0.1:${server.address().port}`,
    fetch,
  })
  const stream = fixtures.stream.infinite()
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
  // A download that starts and never ends. The API then drops its connection.
  const closed = withResolvers()
  let started = false
  let socket
  const drop = () => {
    if (started) socket?.destroy()
  }
  const files = http.createServer((req, res) => {
    res.on('close', closed.resolve)
    res.write('start')
    started = true
    drop()
  })
  const api = http.createServer((req) => {
    req.resume()
    socket = req.socket
    drop()
  })
  await new Promise((resolve) => files.listen(0, '127.0.0.1', resolve))
  await new Promise((resolve) => api.listen(0, '127.0.0.1', resolve))
  t.teardown(() => {
    for (const server of [files, api]) {
      server.closeAllConnections()
      server.close()
    }
  })
  const url = `http://127.0.0.1:${files.address().port}/a`
  const { fetch } = fixtures.fetch.recorder(globalThis.fetch)
  const client = new ApiClient(TOKEN, {
    apiRoot: `http://127.0.0.1:${api.address().port}`,
    fetch,
  })

  await t.throwsAsync(
    client.callApi('sendDocument', { document: Input.fromURLStream(url) })
  )
  await t.notThrowsAsync(closed.promise, 'the download is closed')
})

test('should abort during a pending download', async (t) => {
  const controller = new AbortController()
  const closed = withResolvers()
  // A host that accepts the connection and never responds.
  const files = http.createServer((req, res) => {
    res.on('close', closed.resolve)
    // The download is pending once its request has arrived.
    controller.abort()
  })
  await new Promise((resolve) => files.listen(0, '127.0.0.1', resolve))
  t.teardown(() => {
    files.closeAllConnections()
    files.close()
  })
  const url = `http://127.0.0.1:${files.address().port}/a`

  await withApi(async ({ client, requests }) => {
    const call = client.callApi(
      'sendDocument',
      { document: Input.fromURLStream(url) },
      { signal: controller.signal }
    )

    await t.throwsAsync(call, { name: 'AbortError' })
    t.is(requests.length, 0, 'the request was not completed')
  })
  await t.notThrowsAsync(closed.promise, 'the download is closed')
})

// Polls with a `callApi` that rejects once with `failure`, then stops the loop.
// Returns the number of calls: failed, polled, synced.
async function pollAfter(failure) {
  let calls = 0
  const telegram = {
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

// Cuts the wait before the next try short.
const noWait = { parameters: { retry_after: 0 } }

test('polling should retry after a request error', async (t) => {
  // What a standard fetch rejects with, and Bun's `node-fetch`.
  const failure = Object.assign(new TypeError('fetch failed'), noWait)

  t.is(await pollAfter(failure), 3)
})

test('polling should retry after a rejection that is not an error', async (t) => {
  t.is(await pollAfter({ ...noWait }), 3)
})

test('polling should retry after a 429', async (t) => {
  const failure = new TelegramError({
    error_code: 429,
    description: 'Too Many Requests',
    ...noWait,
  })

  t.is(await pollAfter(failure), 3)
})

test('polling should rethrow an API error', async (t) => {
  const conflict = new TelegramError({
    error_code: 409,
    description: 'Conflict',
  })
  let calls = 0
  const telegram = {
    async callApi() {
      calls++
      throw conflict
    },
  }
  const polling = new Polling(telegram, [])

  await t.throwsAsync(
    polling.loop(async () => {}),
    { is: conflict }
  )
  t.is(calls, 1, 'the offset is not synced after a 409')
})

test('polling should end the wait before a retry on stop()', async (t) => {
  let calls = 0
  const telegram = {
    async callApi(method, payload) {
      calls++
      if (payload.timeout === undefined) return []
      setTimeout(() => polling.stop(), 50)
      // The wait before the next try is 5 s.
      throw new TypeError('fetch failed')
    },
  }
  const polling = new Polling(telegram, [])
  const started = Date.now()
  await polling.loop(async () => {})

  t.is(calls, 2, 'failed, synced')
  t.true(Date.now() - started < 2000)
})

test('polling should not wait for a retry after stop()', async (t) => {
  let calls = 0
  const telegram = {
    async callApi(method, payload) {
      calls++
      if (payload.timeout === undefined) return []
      polling.stop()
      // A custom fetch can reject with any value.
      throw undefined
    },
  }
  const polling = new Polling(telegram, [])
  const started = Date.now()
  await polling.loop(async () => {})

  t.is(calls, 2, 'failed, synced')
  t.true(Date.now() - started < 2000)
})

test('polling should rethrow an API error after stop()', async (t) => {
  const conflict = new TelegramError({
    error_code: 409,
    description: 'Conflict',
  })
  const telegram = {
    async callApi() {
      polling.stop()
      throw conflict
    },
  }
  const polling = new Polling(telegram, [])

  await t.throwsAsync(
    polling.loop(async () => {}),
    { is: conflict }
  )
})

test('polling should retry after an AbortError that stop() did not cause', async (t) => {
  // e.g. a custom fetch with a request timeout aborts its own request.
  const failure = Object.assign(
    new DOMException('aborted', 'AbortError'),
    noWait
  )
  const started = Date.now()

  t.is(await pollAfter(failure), 3)
  t.true(Date.now() - started < 2000, 'after the wait in `retry_after`')
})

test('polling should stop when stop() aborts the request', async (t) => {
  let calls = 0
  const telegram = {
    async callApi(method, payload) {
      calls++
      if (payload.timeout === undefined) return []
      polling.stop()
      throw new DOMException('aborted', 'AbortError')
    },
  }
  const polling = new Polling(telegram, [])
  const started = Date.now()
  await polling.loop(async () => {})

  t.is(calls, 2, 'polled, synced')
  t.true(Date.now() - started < 2000, 'without the wait of a retry')
})
