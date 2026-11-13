const test = require('ava')
const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')
const { Readable } = require('stream')
const { default: ApiClient } = require('../lib/core/network/client')
const { TelegramError } = require('../lib/core/network/error')
const Input = require('../lib/input')
const { fixtures, withResolvers } = require('./_helpers')

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

test('should read its options on every call', async (t) => {
  await withApi(async (client, requests) => {
    await client.callApi('getMe', {})
    client.options.apiMode = 'user'
    client.options.testEnv = true
    await client.callApi('getMe', {})

    t.deepEqual(
      requests.map(({ url }) => url),
      [`/bot${TOKEN}/getMe`, `/user${TOKEN}/test/getMe`]
    )
  })
})

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

test('should upload a lazy stream in every call', async (t) => {
  await withApi(async (client, requests, origin) => {
    let opened = 0
    const payload = {
      chat_id: 1,
      document: Input.fromLazyStream(() => {
        opened++
        return fetch(`${origin}/files/a.txt`)
      }, 'a.txt'),
    }
    await client.callApi('sendDocument', payload)
    await client.callApi('sendDocument', payload)

    t.is(opened, 2)
    t.is(requests.length, 2)
    for (const { parts } of requests) {
      t.deepEqual(parts.document, { file: 'a.txt', content: 'downloaded' })
    }
  })
})

test('should upload a stream that is already flowing', async (t) => {
  await withApi(async (client, requests, origin) => {
    // The request waits for the download; a flowing stream doesn't wait.
    const stream = Readable.from(['flow', 'ing'])
    stream.on('data', () => {})
    await client.callApi('sendMediaGroup', {
      chat_id: 1,
      media: [
        {
          type: 'document',
          media: Input.fromURLStream(`${origin}/files/a.txt`),
        },
        { type: 'document', media: Input.fromReadableStream(stream) },
      ],
    })

    const [{ parts }] = requests
    const [first, second] = JSON.parse(parts.media)
    t.is(resolveFile(parts, first.media).content, 'downloaded')
    t.is(resolveFile(parts, second.media).content, 'flowing')
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

test('should upload a { url } literal under a legacy sticker key', async (t) => {
  // The Bot API server still reads the sticker keys of before Bot API 6.6.
  await withApi(async (client, requests, origin) => {
    await client.callApi('createNewStickerSet', {
      user_id: 1,
      name: 'set',
      title: 'title',
      png_sticker: { url: `${origin}/files/a.txt` },
      emojis: 'a',
    })

    const [{ parts }] = requests
    t.deepEqual(parts.png_sticker, {
      file: 'png_sticker.dat',
      content: 'downloaded',
    })
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
    t.is(requests.length, 0, 'the request was not completed')
  })
})

test('should reject a payload that contains itself', async (t) => {
  await withApi(async (client, requests) => {
    const message = { chat_id: 1, text: 'a' }
    message.self = message
    const expected = t.throws(() => JSON.stringify(message))
    const error = await t.throwsAsync(client.callApi('sendMessage', message))
    t.is(error.message, expected.message, 'what JSON.stringify throws')

    // 4.16.3 dropped `reply_parameters` beside a file, so it sent this one.
    const stream = fixtures.stream.infinite()
    const upload = {
      chat_id: 1,
      document: Input.fromReadableStream(stream),
      reply_parameters: { message_id: 5 },
    }
    upload.reply_parameters.self = upload.reply_parameters
    await t.throwsAsync(client.callApi('sendDocument', upload), {
      instanceOf: TypeError,
      message: /circular/,
    })
    t.true(stream.destroyed)
    t.is(requests.length, 0, 'no request was opened')
  })
})

test('should reject a { url } file that is not an HTTP URL', async (t) => {
  await withApi(async (client, requests) => {
    // A Bot API file link without its scheme holds the token.
    const url = `api.telegram.org/file/bot${TOKEN}/a.jpg`
    const stream = fixtures.stream.infinite()
    const call = client.callApi('sendDocument', {
      document: Input.fromReadableStream(stream),
      thumbnail: Input.fromURLStream(url),
    })

    const error = await t.throwsAsync(call, { instanceOf: TypeError })
    t.regex(error.message, /only http: and https: URLs are supported/)
    t.false(`${error.message}\n${error.stack}`.includes('SECRET'))
    t.true(stream.destroyed)
    t.is(requests.length, 0, 'the request was not opened')
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

test('should download a { url } file when the upload reaches it', async (t) => {
  // A download that waits for its turn can be dropped by its host.
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

  await withApi(async (client, requests) => {
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

test('should not destroy a source stream that was read to its end', async (t) => {
  await withApi(async (client) => {
    const sent = fixtures.stream.duplex()
    await client.callApi('sendDocument', {
      document: Input.fromReadableStream(sent.stream),
    })
    t.false(sent.stream.destroyed, 'after a call that succeeded')
    sent.stream.write('receipt')
    t.deepEqual(sent.written, ['receipt'])

    const read = fixtures.stream.duplex()
    const failure = new Error('disk gone')
    const failing = new Readable({
      read() {
        this.destroy(failure)
      },
    })
    const call = client.callApi('sendMediaGroup', {
      media: [
        { type: 'document', media: Input.fromReadableStream(read.stream) },
        { type: 'document', media: Input.fromReadableStream(failing) },
      ],
    })
    await t.throwsAsync(call, { is: failure })
    t.false(read.stream.destroyed, 'after a later file of the call failed')
  })
})

test('should destroy source streams on a request error', async (t) => {
  // Port 1 is closed, so the second stream is never reached.
  const client = new ApiClient(TOKEN, { apiRoot: 'http://127.0.0.1:1' })
  const first = fixtures.stream.infinite()
  const second = fixtures.stream.infinite()
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
  const first = fixtures.stream.infinite()
  const second = fixtures.stream.infinite()
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

  const client = new ApiClient(TOKEN, {
    apiRoot: `http://127.0.0.1:${api.address().port}`,
  })
  const call = client.callApi('sendDocument', {
    document: Input.fromURLStream(url),
  })

  await t.throwsAsync(call, { name: 'FetchError' })
  await t.notThrowsAsync(closed.promise, 'the download is closed')
})

test('should reject with a source error during an early response', async (t) => {
  const failure = new Error('disk gone')
  const stream = fixtures.stream.infinite()
  // The answer begins before the upload has ended and is never completed, so only the
  // failure of the source can end the call.
  const api = http.createServer((req, res) => {
    req.resume()
    res.writeHead(413, { 'content-type': 'application/json' })
    res.write('{"ok":false,')
    setTimeout(() => stream.destroy(failure), 100)
  })
  await new Promise((resolve) => api.listen(0, '127.0.0.1', resolve))
  t.teardown(() => {
    api.closeAllConnections()
    api.close()
  })
  const client = new ApiClient(TOKEN, {
    apiRoot: `http://127.0.0.1:${api.address().port}`,
  })

  const call = client.callApi('sendDocument', {
    document: Input.fromReadableStream(stream),
  })
  await t.throwsAsync(call, { is: failure })
})

test('should release files on an early response', async (t) => {
  const begun = withResolvers()
  const closed = withResolvers()
  // Like a server rejecting a file: it responds without reading the rest of the body.
  const api = http.createServer(async (req, res) => {
    req.resume()
    // A download can only be released once it has begun.
    if (req.url.endsWith('/sendDocument')) await begun.promise
    res.writeHead(413, { 'content-type': 'application/json' })
    res.end('{"ok":false,"error_code":413,"description":"Too Large"}')
  })
  const files = http.createServer((req, res) => {
    res.on('close', closed.resolve)
    res.write('start')
    begun.resolve()
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

  const first = fixtures.stream.infinite()
  const second = fixtures.stream.infinite()
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
  await t.notThrowsAsync(closed.promise, 'the download that had begun')
})

test('should remove its abort listener', async (t) => {
  // Polling passes the same signal to every call for as long as the bot runs.
  const { signal, listeners } = fixtures.signal.recorder()
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
  const { controller, signal, listeners } = fixtures.signal.recorder()
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
