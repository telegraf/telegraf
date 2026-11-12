const test = require('ava')
const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')
const { Readable } = require('stream')
const { default: ApiClient } = require('../lib/core/network/client')
const { TelegramError } = require('../lib/core/network/error')
const Input = require('../lib/input')

// Some tests pass plain literals, which warn once per kind.
process.emitWarning = () => {}

const TOKEN = '123456:SECRET-abc_DEF'
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

// A local stand-in for the Bot API. It answers every call and records the request. It
// also serves one file, and a 404 for another.
async function withApi(run, answer = { ok: true, result: true }, status = 200) {
  const requests = []
  const server = http.createServer((req, res) => {
    if (req.url === '/files/a.txt') return res.end('downloaded')
    if (req.url === '/files/missing') return res.writeHead(404).end('nothing')
    // A Bot API file link: its URL contains the token.
    if (req.url.startsWith('/file/')) return res.writeHead(404).end('nothing')
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
        encoding: req.headers['transfer-encoding'],
        json: multipart ? undefined : JSON.parse(body),
        parts: multipart ? parseMultipart(body, type) : undefined,
      })
      res.writeHead(status, { 'content-type': 'application/json' })
      res.end(typeof answer === 'string' ? answer : JSON.stringify(answer))
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  try {
    return await run(
      new ApiClient(TOKEN, { apiRoot: origin }),
      requests,
      origin
    )
  } finally {
    server.closeAllConnections()
    server.close()
  }
}

// Returns the file a part holds, or the one its attach:// reference points to.
const resolveFile = (parts, value) => {
  if (typeof value === 'object') return value
  const id = /^attach:\/\/(.+)$/.exec(value)
  return id === null ? undefined : parts[id[1]]
}

test('should send a call without files as JSON', async (t) => {
  await withApi(async (client, requests) => {
    const result = await client.callApi('sendMessage', {
      chat_id: 1,
      text: 'a',
      reply_markup: null,
      // A Bot API object, not a file.
      link_preview_options: { url: 'https://example.com' },
    })

    t.true(result)
    t.is(requests[0].url, `/bot${TOKEN}/sendMessage`)
    t.is(requests[0].type, 'application/json')
    t.deepEqual(requests[0].json, {
      chat_id: 1,
      text: 'a',
      link_preview_options: { url: 'https://example.com' },
    })
  })
})

test('should send a top-level file as a part named after its key', async (t) => {
  await withApi(async (client, requests) => {
    await client.callApi('sendPhoto', {
      chat_id: 1,
      photo: Input.fromBuffer(Buffer.from('PHOTO')),
      caption: null,
      // Issue 2094: an object next to a file used to be dropped.
      reply_parameters: { message_id: 5, allow_sending_without_reply: true },
    })

    const [{ type, encoding, parts }] = requests
    t.regex(type, /^multipart\/form-data; boundary=/)
    t.is(encoding, 'chunked')
    t.is(parts.chat_id, '1')
    t.false('caption' in parts)
    t.deepEqual(JSON.parse(parts.reply_parameters), {
      message_id: 5,
      allow_sending_without_reply: true,
    })
    t.deepEqual(parts.photo, { file: 'photo.jpg', content: 'PHOTO' })
  })
})

test('should support an attach:// reference to a top-level file', async (t) => {
  // The workaround for positions v4 never searched for files, e.g. a new sticker.
  await withApi(async (client, requests) => {
    await client.callApi('createNewStickerSet', {
      name: 'set',
      stickers: [{ sticker: 'attach://s0', format: 'static', emoji_list: [] }],
      s0: Input.fromBuffer(Buffer.from('STICKER')),
    })

    const [{ parts }] = requests
    t.is(JSON.parse(parts.stickers)[0].sticker, 'attach://s0')
    t.deepEqual(parts.s0, { file: 's0.dat', content: 'STICKER' })
  })
})

test('should upload every file source type', async (t) => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'telegraf-'))
  t.teardown(() => fs.rmSync(folder, { recursive: true }))
  const file = path.join(folder, 'on disk.txt')
  fs.writeFileSync(file, 'from disk')

  await withApi(async (client, requests, origin) => {
    await client.callApi('sendDocument', {
      document: Input.fromLocalFile(file),
      photo: Input.fromBuffer(Buffer.from('bytes'), 'a.png'),
      video: Input.fromReadableStream(Readable.from(['a ', 'stream'])),
      audio: Input.fromURLStream(`${origin}/files/a.txt`, 'a.mp3'),
      voice: { source: Buffer.from('plain literal') },
    })

    const [{ parts }] = requests
    const sent = (name) => resolveFile(parts, parts[name])
    t.deepEqual(sent('document'), { file: 'on disk.txt', content: 'from disk' })
    t.deepEqual(sent('photo'), { file: 'a.png', content: 'bytes' })
    t.deepEqual(sent('video'), { file: 'video.mp4', content: 'a stream' })
    t.deepEqual(sent('audio'), { file: 'a.mp3', content: 'downloaded' })
    t.deepEqual(sent('voice'), { file: 'voice.ogg', content: 'plain literal' })
  })
})

test('should upload nested files', async (t) => {
  const file = (content) => Input.fromBuffer(Buffer.from(content))
  const positions = {
    'the thumbnail of a parameter': [
      { document: 'file_id', thumbnail: file('a') },
      (parts) => parts.thumbnail,
    ],
    'an item of a media group, and its thumbnail': [
      { media: [{ type: 'video', media: file('a'), thumbnail: file('b') }] },
      (parts) => JSON.parse(parts.media)[0].thumbnail,
    ],
    'the media of an edit, and its thumbnail': [
      { media: { type: 'video', media: file('a'), thumbnail: file('b') } },
      (parts) => JSON.parse(parts.media).thumbnail,
    ],
    // v4 did not reach these: the file was sent as JSON.
    'a thumbnail beside a file that is not uploaded': [
      { media: [{ type: 'video', media: 'file_id', thumbnail: file('a') }] },
      (parts) => JSON.parse(parts.media)[0].thumbnail,
    ],
    'the sticker of an input sticker': [
      { sticker: { sticker: file('a'), format: 'static', emoji_list: ['a'] } },
      (parts) => JSON.parse(parts.sticker).sticker,
    ],
    'the stickers of a new set': [
      { stickers: [{ sticker: file('a'), format: 'static', emoji_list: [] }] },
      (parts) => JSON.parse(parts.stickers)[0].sticker,
    ],
    'any depth': [
      { message: { blocks: [{ animation: { thumbnail: file('a') } }] } },
      (parts) => JSON.parse(parts.message).blocks[0].animation.thumbnail,
    ],
  }
  await withApi(async (client, requests) => {
    for (const [position, [payload, reference]] of Object.entries(positions)) {
      requests.length = 0
      await client.callApi('sendDocument', payload)
      const [{ parts }] = requests

      t.truthy(parts, position)
      t.is(
        typeof resolveFile(parts, reference(parts))?.content,
        'string',
        position
      )
    }
  })
})

test('should download a { url } file with attachmentAgent', async (t) => {
  const asked = []
  await withApi(async (client, requests, origin) => {
    client.options.attachmentAgent = (url) => {
      asked.push(url.href)
      return new http.Agent()
    }
    await client.callApi('sendDocument', {
      document: Input.fromURLStream(`${origin}/files/a.txt`),
    })

    t.deepEqual(asked, [`${origin}/files/a.txt`])
    t.is(
      resolveFile(requests[0].parts, requests[0].parts.document).content,
      'downloaded'
    )
  })
})

test('should reject on a { url } download error status', async (t) => {
  await withApi(async (client, requests, origin) => {
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

test('should redact the token from a download error', async (t) => {
  // A Bot API file link contains the token.
  await withApi(async (client, requests, origin) => {
    const call = client.callApi('sendDocument', {
      document: Input.fromURLStream(`${origin}/file/bot${TOKEN}/a.jpg`),
    })

    await t.throwsAsync(call, {
      message: `Unable to download '${origin}/file/bot[REDACTED]/a.jpg': 404 Not Found`,
    })
  })
})

test('should start the request after all { url } downloads respond', async (t) => {
  // All downloads start up front, concurrently, so a slow file host cannot stall the
  // upload half way.
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

  await withApi(async (client, requests) => {
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

test('should reject on an unreadable file path', async (t) => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'telegraf-'))
  t.teardown(() => fs.rmSync(folder, { recursive: true }))

  await withApi(async (client) => {
    const missing = client.callApi('sendDocument', {
      document: Input.fromLocalFile(path.join(folder, 'missing.txt')),
    })
    await t.throwsAsync(missing, { code: 'ENOENT' })

    const directory = client.callApi('sendDocument', {
      document: Input.fromLocalFile(folder),
    })
    await t.throwsAsync(directory, {
      instanceOf: TypeError,
      message: `Unable to upload '${folder}', not a file`,
    })
  })
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
  // Port 1 is closed, so the second stream is never reached.
  const client = new ApiClient(TOKEN, { apiRoot: 'http://127.0.0.1:1' })
  const first = createEndlessStream()
  const second = createEndlessStream()
  const call = client.callApi('sendMediaGroup', {
    media: [
      { type: 'photo', media: Input.fromReadableStream(first) },
      { type: 'photo', media: Input.fromReadableStream(second) },
    ],
  })

  const error = await t.throwsAsync(call, { code: 'ECONNREFUSED' })
  t.false(error.message.includes('SECRET'))
  await delay(50)
  t.true(first.destroyed)
  t.true(second.destroyed)
})

test('should destroy source streams on abort', async (t) => {
  const server = http.createServer((req) => req.resume())
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.teardown(() => {
    server.closeAllConnections()
    server.close()
  })
  const apiRoot = `http://127.0.0.1:${server.address().port}`
  const first = createEndlessStream()
  const second = createEndlessStream()
  const controller = new AbortController()
  const call = new ApiClient(TOKEN, { apiRoot }).callApi(
    'sendMediaGroup',
    {
      media: [
        { type: 'photo', media: Input.fromReadableStream(first) },
        { type: 'photo', media: Input.fromReadableStream(second) },
      ],
    },
    { signal: controller.signal }
  )
  setTimeout(() => controller.abort(), 100)

  await t.throwsAsync(call, { name: 'AbortError' })
  await delay(50)
  t.true(first.destroyed)
  t.true(second.destroyed)
})

test('should abort a download on a request error', async (t) => {
  // A download that starts and never ends.
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

  const client = new ApiClient(TOKEN, { apiRoot: 'http://127.0.0.1:1' })
  const call = client.callApi('sendDocument', {
    document: Input.fromURLStream(url),
  })

  await t.throwsAsync(call, { code: 'ECONNREFUSED' })
  await delay(200)
  t.true(closed)
})

test('should release files on an early response', async (t) => {
  // Like a server rejecting a file: it responds without reading the rest of the body.
  const api = http.createServer((req, res) => {
    req.resume()
    res.writeHead(413, { 'content-type': 'application/json' })
    res.end('{"ok":false,"error_code":413,"description":"Too Large"}')
  })
  let closed = false
  const files = http.createServer((req, res) => {
    res.on('close', () => (closed = true))
    res.write('start')
  })
  await new Promise((resolve) => api.listen(0, '127.0.0.1', resolve))
  await new Promise((resolve) => files.listen(0, '127.0.0.1', resolve))
  t.teardown(() => {
    for (const server of [api, files]) {
      server.closeAllConnections()
      server.close()
    }
  })
  const client = new ApiClient(TOKEN, {
    apiRoot: `http://127.0.0.1:${api.address().port}`,
  })
  const url = `http://127.0.0.1:${files.address().port}/a`

  const first = createEndlessStream()
  const second = createEndlessStream()
  const streams = client.callApi('sendMediaGroup', {
    media: [
      { type: 'photo', media: Input.fromReadableStream(first) },
      { type: 'photo', media: Input.fromReadableStream(second) },
    ],
  })
  await t.throwsAsync(streams, { message: '413: Too Large' })
  await delay(50)
  t.true(first.destroyed, 'the stream that was being read')
  t.true(second.destroyed, 'the stream that was not reached')

  const download = client.callApi('sendDocument', {
    document: Input.fromURLStream(url),
  })
  await t.throwsAsync(download, { message: '413: Too Large' })
  await delay(200)
  t.true(closed, 'the download that had begun')
})

// Creates a signal that tracks its listeners.
const createSignalSpy = () => {
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
  return { controller, signal, listeners }
}

test('should remove its abort listener', async (t) => {
  // Polling passes the same signal to every call for as long as the bot runs.
  const { signal, listeners } = createSignalSpy()
  await withApi(async (client) => {
    await client.callApi('getUpdates', {}, { signal })
    await client.callApi('getUpdates', {}, { signal })
    t.is(listeners.size, 0, 'after a call that was answered')
  })
  await withApi(
    async (client) => {
      const refused = client.callApi('getUpdates', {}, { signal })
      await t.throwsAsync(refused, { instanceOf: TelegramError })
      t.is(listeners.size, 0, 'after a call that the API refused')
    },
    { ok: false, error_code: 409, description: 'Conflict' },
    409
  )
  const client = new ApiClient(TOKEN, { apiRoot: 'http://127.0.0.1:1' })
  await t.throwsAsync(client.callApi('getUpdates', {}, { signal }))
  t.is(listeners.size, 0, 'after a request that failed')
})

test('should abort a pending call', async (t) => {
  const { controller, signal, listeners } = createSignalSpy()
  const server = http.createServer((req) => req.resume())
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.teardown(() => {
    server.closeAllConnections()
    server.close()
  })
  const apiRoot = `http://127.0.0.1:${server.address().port}`
  const call = new ApiClient(TOKEN, { apiRoot }).callApi(
    'getUpdates',
    {},
    { signal }
  )
  await delay(50)
  t.is(listeners.size, 1, 'it listens while the call is under way')

  controller.abort()
  await t.throwsAsync(call, { name: 'AbortError' })
  t.is(listeners.size, 0)

  // An already-aborted signal rejects a call before it starts.
  const late = new ApiClient(TOKEN, { apiRoot }).callApi(
    'getUpdates',
    {},
    { signal }
  )
  await t.throwsAsync(late, { name: 'AbortError' })
  t.is(listeners.size, 0)
})

test('should throw a TelegramError for an API error', async (t) => {
  const refusal = { ok: false, error_code: 400, description: 'Bad Request' }
  await withApi(
    async (client) => {
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

test('should throw a TelegramError for a 5xx response', async (t) => {
  await withApi(
    async (client) => {
      await t.throwsAsync(client.callApi('getMe', {}), {
        instanceOf: TelegramError,
        message: '502: Bad Gateway',
      })
    },
    '<html>',
    502
  )
})

test('should redact the token from a non-JSON response error', async (t) => {
  // e.g. a proxy's error page. node-fetch puts the request URL in its error.
  await withApi(
    async (client) => {
      const error = await t.throwsAsync(client.callApi('getMe', {}), {
        name: 'FetchError',
      })

      t.is(error.type, 'invalid-json')
      t.regex(error.message, /\/bot\[REDACTED\]\/getMe/)
      t.false(error.message.includes('SECRET'))
      t.false(String(error.stack).includes('SECRET'))
    },
    '<html>',
    404
  )
})
