const test = require('ava')
const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')
const { Readable } = require('stream')
const { default: ApiClient } = require('../lib/core/network/client')
const { TelegramError } = require('../lib/core/network/error')
const Input = require('../lib/input')

// Plain literals are used here as well as the helpers, and each kind warns once.
process.emitWarning = () => {}

const TOKEN = '123456:SECRET-abc_DEF'
const soon = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// The parts of a multipart body, by name: a string, or a file.
function parse(body, contentType) {
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

// A stand-in for the Bot API. It answers every call, and keeps what it was sent; it also
// serves a file, and a page that is not there.
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
        encoding: req.headers['transfer-encoding'],
        json: multipart ? undefined : JSON.parse(body),
        parts: multipart ? parse(body, type) : undefined,
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

// The file that a part is, or that it refers to.
const fileOf = (parts, value) => {
  if (typeof value === 'object') return value
  const id = /^attach:\/\/(.+)$/.exec(value)
  return id === null ? undefined : parts[id[1]]
}

test('a call without files is sent as JSON', async (t) => {
  await withApi(async (client, requests) => {
    const result = await client.callApi('sendMessage', {
      chat_id: 1,
      text: 'a',
      reply_markup: null,
      // Not a file: this is an object of the Bot API.
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

test('a file that is a parameter is the part by that name', async (t) => {
  await withApi(async (client, requests) => {
    await client.callApi('sendPhoto', {
      chat_id: 1,
      photo: Input.fromBuffer(Buffer.from('PHOTO')),
      caption: null,
      // Issue 2094: an object beside a file was dropped.
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

test('a caller can refer to a file that is a parameter by its name', async (t) => {
  // The way to upload where files were not looked for: a sticker of a new set.
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

test('every kind of file arrives with its contents and its name', async (t) => {
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
    const sent = (name) => fileOf(parts, parts[name])
    t.deepEqual(sent('document'), { file: 'on disk.txt', content: 'from disk' })
    t.deepEqual(sent('photo'), { file: 'a.png', content: 'bytes' })
    t.deepEqual(sent('video'), { file: 'video.mp4', content: 'a stream' })
    t.deepEqual(sent('audio'), { file: 'a.mp3', content: 'downloaded' })
    t.deepEqual(sent('voice'), { file: 'voice.ogg', content: 'plain literal' })
  })
})

test('a file is found wherever it is in the payload', async (t) => {
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
    // These were not reached before: the file was sent as JSON.
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
      t.is(typeof fileOf(parts, reference(parts))?.content, 'string', position)
    }
  })
})

test('the agent for attachments is used to download a URL', async (t) => {
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
      fileOf(requests[0].parts, requests[0].parts.document).content,
      'downloaded'
    )
  })
})

test('a URL that does not answer with a file fails the call', async (t) => {
  await withApi(async (client, requests, origin) => {
    const url = `${origin}/files/missing`
    const call = client.callApi('sendDocument', {
      document: Input.fromURLStream(url),
    })

    await t.throwsAsync(call, {
      message: `Unable to download '${url}': 404 Not Found`,
    })
  })
})

test('a path that cannot be read fails the call', async (t) => {
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

// A stream that does not end by itself, and says when it is released.
const endless = () => {
  let sent = false
  return new Readable({
    read() {
      if (!sent) this.push('start')
      sent = true
    },
  })
}

test('the streams that were given are released when the request fails', async (t) => {
  // Nothing listens here, so the second stream is never reached.
  const client = new ApiClient(TOKEN, { apiRoot: 'http://127.0.0.1:1' })
  const first = endless()
  const second = endless()
  const call = client.callApi('sendMediaGroup', {
    media: [
      { type: 'photo', media: Input.fromReadableStream(first) },
      { type: 'photo', media: Input.fromReadableStream(second) },
    ],
  })

  const error = await t.throwsAsync(call, { code: 'ECONNREFUSED' })
  t.false(error.message.includes('SECRET'))
  await soon(50)
  t.true(first.destroyed)
  t.true(second.destroyed)
})

test('the streams that were given are released when the call is aborted', async (t) => {
  const server = http.createServer((req) => req.resume())
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.teardown(() => {
    server.closeAllConnections()
    server.close()
  })
  const apiRoot = `http://127.0.0.1:${server.address().port}`
  const first = endless()
  const second = endless()
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
  await soon(50)
  t.true(first.destroyed)
  t.true(second.destroyed)
})

test('a download that has begun is stopped when the request fails', async (t) => {
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

  const client = new ApiClient(TOKEN, { apiRoot: 'http://127.0.0.1:1' })
  const call = client.callApi('sendDocument', {
    document: Input.fromURLStream(url),
  })

  await t.throwsAsync(call, { code: 'ECONNREFUSED' })
  await soon(200)
  t.true(closed)
})

test('files are released when the answer comes before the upload has ended', async (t) => {
  // As a server does that refuses a file: it answers, and does not wait for the rest.
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

  const first = endless()
  const second = endless()
  const streams = client.callApi('sendMediaGroup', {
    media: [
      { type: 'photo', media: Input.fromReadableStream(first) },
      { type: 'photo', media: Input.fromReadableStream(second) },
    ],
  })
  await t.throwsAsync(streams, { message: '413: Too Large' })
  await soon(50)
  t.true(first.destroyed, 'the stream that was being read')
  t.true(second.destroyed, 'the stream that was not reached')

  const download = client.callApi('sendDocument', {
    document: Input.fromURLStream(url),
  })
  await t.throwsAsync(download, { message: '413: Too Large' })
  await soon(200)
  t.true(closed, 'the download that had begun')
})

// A signal that counts the listeners it holds.
const counted = () => {
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

test('a call leaves nothing on the signal it was given', async (t) => {
  // Polling gives the same signal to every call it makes, for as long as the bot runs.
  const { signal, listeners } = counted()
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

test('a call is still aborted by the signal while it is under way', async (t) => {
  const { controller, signal, listeners } = counted()
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
  await soon(50)
  t.is(listeners.size, 1, 'it listens while the call is under way')

  controller.abort()
  await t.throwsAsync(call, { name: 'AbortError' })
  t.is(listeners.size, 0)

  // A signal that has already aborted stops a call before it begins.
  const late = new ApiClient(TOKEN, { apiRoot }).callApi(
    'getUpdates',
    {},
    { signal }
  )
  await t.throwsAsync(late, { name: 'AbortError' })
  t.is(listeners.size, 0)
})

test('an error from the API is a TelegramError', async (t) => {
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

test('a server error is a TelegramError made of its status', async (t) => {
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

test('the token is removed from the error of an answer that is not JSON', async (t) => {
  // A proxy's page, for one. node-fetch names the address it was read from.
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
