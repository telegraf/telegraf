const test = require('ava')
const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')
const { Readable } = require('stream')
const { default: ApiClient } = require('../lib/core/network/client')
const { InputFile, isBrandedInputFile } = require('../lib/input-file')
const {
  convertFiles,
  destroyUnread,
} = require('../lib/core/network/file-literals')
const { extractFiles, toMultipart } = require('../lib/core/network/payload')
const { fixtures, withResolvers } = require('./_helpers')

const TOKEN = '123456:SECRET-abc_DEF'

// Records every warning emitted in this file.
const warnings = []
process.emitWarning = (message, type, code) =>
  warnings.push({ message, type, code })

// A stand-in for the download of a call: every URL answers with its own address.
const download = (url) => Readable.from([`from ${url}`])

// Joins the segments of a multipart body the way a client would send them.
async function assemble(segments) {
  const chunks = []
  for (const segment of segments) {
    if (typeof segment === 'function') {
      for await (const chunk of segment()) chunks.push(Buffer.from(chunk))
    } else if (segment instanceof Blob) {
      chunks.push(Buffer.from(await segment.arrayBuffer()))
    } else {
      chunks.push(Buffer.from(segment))
    }
  }
  return Buffer.concat(chunks).toString()
}

// Parses a multipart body into its file parts by name: `{ file, content }`.
function parseMultipart(body, contentType) {
  const boundary = /boundary=(.+)$/.exec(contentType)[1]
  const parts = {}
  for (const raw of body.split(`--${boundary}`).slice(1, -1)) {
    const split = raw.indexOf('\r\n\r\n')
    const head = raw.slice(0, split)
    const name = /name="([^"]*)"/.exec(head)[1]
    const filename = /filename="([^"]*)"/.exec(head)
    if (filename === null) continue
    parts[name] = {
      file: decodeURIComponent(filename[1]),
      content: raw.slice(split + 4, -2),
    }
  }
  return parts
}

// Uploads a payload the way a client would, and returns its files by part name.
async function upload(payload) {
  const { payload: converted } = convertFiles(payload, download)
  const { payload: fields, attachments } = extractFiles(converted)
  const { contentType, segments } = toMultipart(fields, attachments)
  return parseMultipart(await assemble(segments), contentType)
}

const bytes = (text) => {
  const buffer = new ArrayBuffer(text.length)
  new Uint8Array(buffer).set(new TextEncoder().encode(text))
  return buffer
}

const webStream = (text) =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text))
      controller.close()
    },
  })

// A `Response` from a URL, which `new Response()` can't make.
const response = (url, text) => ({
  ok: true,
  status: 200,
  url,
  body: Readable.from([text]),
})

function localFile(t, name, contents) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'telegraf-'))
  t.teardown(() => fs.rmSync(folder, { recursive: true }))
  const file = path.join(folder, name)
  fs.writeFileSync(file, contents)
  return file
}

// A chain of `count` InputFiles, each made from a function that returns the next.
function chain(count, contents) {
  let file = new InputFile(contents)
  for (let made = 1; made < count; made++) {
    const inner = file
    file = new InputFile(() => inner)
  }
  return file
}

test.serial('InputFile should not print a warning', async (t) => {
  await upload({ photo: new InputFile(Buffer.from('a')) })

  t.deepEqual(warnings, [])
})

test.serial(
  'InputFile should warn for a plain object that its function returns',
  async (t) => {
    await upload({ photo: new InputFile(() => ({ source: new Blob(['a']) })) })

    t.deepEqual(
      warnings.map((warning) => warning.code),
      ['TELEGRAF_FILE_BLOB']
    )
  }
)

test('InputFile should upload each kind of contents', async (t) => {
  const file = localFile(t, 'on disk.txt', 'from disk')
  const generator = (async function* () {
    yield 'generator'
  })()
  const parts = await upload({
    document: InputFile.fromLocalFile(file),
    photo: InputFile.fromURLStream('https://example.com/a/cat.jpg'),
    video: new InputFile(new URL('https://example.com/b/clip%20one.mp4')),
    audio: new InputFile(Buffer.from('buffer')),
    voice: new InputFile(bytes('array buffer')),
    sticker: new InputFile(new Blob(['blob'])),
    animation: new InputFile(new File(['file'], 'named.gif')),
    thumbnail: new InputFile(Readable.from(['node stream'])),
    cover: new InputFile(webStream('web stream')),
    video_note: new InputFile(generator),
    certificate: new InputFile(new Response('response')),
    media: new InputFile(response('https://example.com/c/report.pdf', 'from')),
    // Taken by their members, like the types of other runtimes and polyfills.
    live_photo: new InputFile({
      size: 9,
      type: '',
      name: 'like.mov',
      stream: () => webStream('blob-like'),
    }),
    png_sticker: new InputFile({ href: 'https://example.com/d/like.png' }),
  })

  t.deepEqual(parts, {
    document: { file: 'on disk.txt', content: 'from disk' },
    photo: { file: 'cat.jpg', content: 'from https://example.com/a/cat.jpg' },
    video: {
      file: 'clip one.mp4',
      content: 'from https://example.com/b/clip%20one.mp4',
    },
    audio: { file: 'audio.mp3', content: 'buffer' },
    voice: { file: 'voice.ogg', content: 'array buffer' },
    sticker: { file: 'sticker.webp', content: 'blob' },
    animation: { file: 'named.gif', content: 'file' },
    thumbnail: { file: 'thumbnail.dat', content: 'node stream' },
    cover: { file: 'cover.dat', content: 'web stream' },
    video_note: { file: 'video_note.mp4', content: 'generator' },
    certificate: { file: 'certificate.dat', content: 'response' },
    media: { file: 'report.pdf', content: 'from' },
    live_photo: { file: 'like.mov', content: 'blob-like' },
    png_sticker: {
      file: 'like.png',
      content: 'from https://example.com/d/like.png',
    },
  })
})

test('InputFile should take a string only from fromLocalFile or fromURLStream', async (t) => {
  // A string could be a path or a URL.
  for (const text of ['a.txt', 'https://example.com/a.jpg']) {
    t.throws(
      () => new InputFile(text),
      {
        instanceOf: TypeError,
        message:
          'A string is not the source of an InputFile: use `InputFile.fromLocalFile(path)` ' +
          'for a local file, or `InputFile.fromURLStream(url)` to download a URL.',
      },
      text
    )
  }

  // A path that looks like a URL is a path, and a URL is never read as a path.
  const file = localFile(t, 'https', 'a local file')
  const parts = await upload({
    document: InputFile.fromLocalFile(file),
    photo: InputFile.fromURLStream('HTTPS://example.com/a.jpg'),
  })
  t.is(parts.document.content, 'a local file')
  t.is(parts.photo.content, 'from HTTPS://example.com/a.jpg')
  t.throws(
    () => convertFiles({ photo: InputFile.fromURLStream(file) }, download),
    { message: /only http: and https: URLs are supported/ }
  )
})

test('InputFile should take another InputFile only from a function', async (t) => {
  // e.g. from JavaScript, or a value typed `any`
  const inner = new InputFile(Buffer.from('inner'), 'inner.txt')
  t.throws(() => new InputFile(inner, 'outer.txt'), {
    instanceOf: TypeError,
    message:
      'An InputFile is not the source of an InputFile: use `new InputFile(() => file)`.',
  })

  const parts = await upload({ document: new InputFile(() => inner) })
  t.is(parts.document.content, 'inner')
})

test('InputFile should have the keys of the plain object it matches', (t) => {
  // Code that reads a file checks `'url' in file` and `file.source`.
  const keys = (file) => Object.keys(file).sort()

  t.deepEqual(keys(InputFile.fromLocalFile('a.txt')), ['filename', 'source'])
  t.deepEqual(keys(new InputFile(Buffer.from('a'), 'b.txt')), [
    'filename',
    'source',
  ])
  const url = 'https://example.com/a.jpg'
  for (const file of [
    InputFile.fromURLStream(url),
    InputFile.fromURLStream(new URL(url)),
    new InputFile(new URL(url)),
  ]) {
    t.deepEqual(keys(file), ['filename', 'url'])
    t.is(file.url, url)
  }
})

test('InputFile should refuse a URL that is not http: or https:', (t) => {
  for (const url of ['file:///etc/passwd', 'ftp://example.com/a.jpg']) {
    for (const file of [
      new InputFile(new URL(url)),
      InputFile.fromURLStream(url),
    ]) {
      t.throws(() => convertFiles({ photo: file }), {
        instanceOf: TypeError,
        message: /only http: and https: URLs are supported/,
      })
    }
  }
})

test('InputFile should throw for a path or a URL that is not a string', (t) => {
  t.throws(() => InputFile.fromLocalFile(5), {
    instanceOf: TypeError,
    message: 'The path of an InputFile must be a string.',
  })
  t.throws(() => InputFile.fromURLStream({}), {
    instanceOf: TypeError,
    message: 'The URL of an InputFile must be a string or a URL.',
  })
})

test('InputFile should use its filename over the name of its contents', async (t) => {
  const parts = await upload({
    document: InputFile.fromURLStream(
      'https://example.com/a.txt',
      'renamed.txt'
    ),
    animation: new InputFile(new File(['a'], 'named.gif'), 'renamed.gif'),
    // A URL without a last segment carries no name.
    photo: InputFile.fromURLStream('https://example.com/'),
  })

  t.is(parts.document.file, 'renamed.txt')
  t.is(parts.animation.file, 'renamed.gif')
  t.is(parts.photo.file, 'photo.jpg')
})

test('InputFile should add the extension of its parameter to a URL name without one', async (t) => {
  // The Bot API server sends an animation whose name doesn't end in `.mp4` as a document.
  const parts = await upload({
    animation: InputFile.fromURLStream('https://example.com/render?id=7'),
    photo: new InputFile(new URL('https://files.example.com/s/9f2c1e7a')),
    document: new InputFile(async () =>
      response('https://example.com/export', 'r')
    ),
    video: InputFile.fromURLStream('https://example.com/v1.2/clip.webm'),
    // A leading dot doesn't make an extension.
    audio: InputFile.fromURLStream('https://example.com/.hidden'),
  })

  t.is(parts.animation.file, 'render.mp4')
  t.is(parts.photo.file, '9f2c1e7a.jpg')
  t.is(parts.document.file, 'export.dat')
  t.is(parts.video.file, 'clip.webm', 'a name with an extension keeps it')
  t.is(parts.audio.file, '.hidden.mp3')
})

test('InputFile should name a File by the last segment of its name', async (t) => {
  // e.g. `Bun.file(path)`, whose name is the path as it was given
  const bunFile = (name) => ({
    size: 1,
    type: '',
    name,
    stream: () => webStream('a'),
  })
  const parts = await upload({
    document: new InputFile(new File(['a'], 'dir/sub/a.txt')),
    photo: new InputFile(bunFile('/home/bot/secret-project/b.jpg')),
    video: new InputFile(bunFile('C:\\Users\\bot\\secret-project\\c.mp4')),
    // A name that ends with a separator has no last segment.
    audio: new InputFile(bunFile('dir/')),
  })

  t.is(parts.document.file, 'a.txt')
  t.is(parts.photo.file, 'b.jpg')
  t.is(parts.video.file, 'c.mp4')
  t.is(parts.audio.file, 'audio.mp3')
})

test('InputFile should call its function when the upload reaches the file', async (t) => {
  let calls = 0
  const payload = {
    document: new InputFile(() => {
      calls++
      return Readable.from(['lazy'])
    }),
  }
  convertFiles(payload, download)
  t.is(calls, 0)

  // A stream can be read once, so each call needs its own.
  t.is((await upload(payload)).document.content, 'lazy')
  t.is((await upload(payload)).document.content, 'lazy')
  t.is(calls, 2)
})

test('InputFile should pass the signal of the call to its functions', async (t) => {
  const controller = new AbortController()
  const signals = []
  const payload = {
    document: new InputFile((outer) => {
      signals.push(outer)
      return new InputFile(async (inner) => {
        signals.push(inner)
        return Buffer.from('a')
      })
    }),
  }
  const { payload: converted } = convertFiles(
    payload,
    download,
    controller.signal
  )
  const { payload: fields, attachments } = extractFiles(converted)
  await assemble(toMultipart(fields, attachments).segments)

  t.deepEqual(signals, [controller.signal, controller.signal])
})

test('InputFile should end the download of its function when the call is aborted', async (t) => {
  // A download that stalls after its headers ends when its part is destroyed. One that
  // stalls before them ends when the signal of the call aborts.
  let received
  const host = http.createServer((req, res) => {
    const closed = new Promise((resolve) => req.socket.once('close', resolve))
    if (req.url === '/after-headers') {
      res.writeHead(200)
      res.write('first chunk')
    }
    // In an object: a promise resolved with a promise waits for it.
    received.resolve({ closed })
  })
  // Never answers: the upload stalls with the download.
  const api = http.createServer((req) => req.resume())
  const listen = (server) =>
    new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () =>
        resolve(`http://127.0.0.1:${server.address().port}`)
      )
    })
  const hostOrigin = await listen(host)
  const apiOrigin = await listen(api)
  t.teardown(() => {
    for (const server of [host, api]) {
      server.closeAllConnections()
      server.close()
    }
  })

  const files = {
    'after its headers': () =>
      new InputFile(() => fetch(`${hostOrigin}/after-headers`)),
    'before its headers': () =>
      new InputFile((signal) => fetch(`${hostOrigin}/before`, { signal })),
  }
  const transports = {
    default: {},
    fetch: { fetch: (url, init) => fetch(url, init) },
  }
  for (const [stall, file] of Object.entries(files)) {
    for (const [transport, options] of Object.entries(transports)) {
      received = withResolvers()
      const client = new ApiClient(TOKEN, {
        api: { root: apiOrigin },
        ...options,
      })
      const controller = new AbortController()
      const call = client.callApi(
        'sendDocument',
        { chat_id: 1, document: file() },
        { signal: controller.signal }
      )
      const { closed } = await received.promise
      controller.abort()
      await t.throwsAsync(call, { name: 'AbortError' }, transport)

      const state = await Promise.race([
        closed.then(() => 'closed'),
        new Promise((resolve) => setTimeout(resolve, 2000, 'still open')),
      ])
      t.is(state, 'closed', `${stall}, ${transport} transport`)
    }
  }
})

test('InputFile should accept each kind of contents from its function', async (t) => {
  const file = localFile(t, 'returned.txt', 'from disk')
  const parts = await upload({
    document: new InputFile(() => InputFile.fromLocalFile(file)),
    photo: new InputFile(async () =>
      InputFile.fromURLStream('https://example.com/a/cat.jpg')
    ),
    video: new InputFile(() => new URL('https://example.com/b/clip.mp4')),
    audio: new InputFile(async () => Buffer.from('buffer')),
    voice: new InputFile(() => bytes('array buffer')),
    animation: new InputFile(async () => new File(['file'], 'named.gif')),
    thumbnail: new InputFile(() => Readable.from(['node stream'])),
    cover: new InputFile(async () => webStream('web stream')),
    video_note: new InputFile(async function* () {
      yield 'generator'
    }),
    // e.g. `() => fetch(url)`
    certificate: new InputFile(async () => new Response('response')),
    media: new InputFile(() =>
      response('https://example.com/c/report.pdf', 'r')
    ),
    sticker: new InputFile(async () => new InputFile(Buffer.from('inner'))),
  })

  t.deepEqual(parts, {
    document: { file: 'returned.txt', content: 'from disk' },
    photo: { file: 'cat.jpg', content: 'from https://example.com/a/cat.jpg' },
    video: { file: 'clip.mp4', content: 'from https://example.com/b/clip.mp4' },
    audio: { file: 'audio.mp3', content: 'buffer' },
    voice: { file: 'voice.ogg', content: 'array buffer' },
    animation: { file: 'named.gif', content: 'file' },
    thumbnail: { file: 'thumbnail.dat', content: 'node stream' },
    cover: { file: 'cover.dat', content: 'web stream' },
    video_note: { file: 'video_note.mp4', content: 'generator' },
    certificate: { file: 'certificate.dat', content: 'response' },
    media: { file: 'report.pdf', content: 'r' },
    sticker: { file: 'sticker.webp', content: 'inner' },
  })
})

test('InputFile should take the outermost filename', async (t) => {
  const innermost = (name) =>
    InputFile.fromURLStream('https://example.com/c/derived.txt', name)
  const nest = (outer, inner, last) =>
    new InputFile(() => new InputFile(() => innermost(last), inner), outer)
  const parts = await upload({
    document: nest('outer.txt', 'inner.txt', 'innermost.txt'),
    photo: nest(undefined, 'inner.txt', 'innermost.txt'),
    video: nest(undefined, undefined, 'innermost.txt'),
    audio: nest(undefined, undefined, undefined),
  })

  t.is(parts.document.file, 'outer.txt')
  t.is(parts.photo.file, 'inner.txt')
  t.is(parts.video.file, 'innermost.txt')
  t.is(parts.audio.file, 'derived.txt', 'else the name of the contents')
})

test('InputFile should reject a function that returns a function', async (t) => {
  await t.throwsAsync(
    upload({ document: new InputFile(() => () => Buffer.from('a')) }),
    {
      instanceOf: TypeError,
      message:
        'Invalid file under `document`: the function of an InputFile returned a function.',
    }
  )
})

test('InputFile should reject a function that returns a string', async (t) => {
  // A string could be a path or a URL.
  await t.throwsAsync(
    upload({ document: new InputFile(async () => 'a.txt') }),
    {
      instanceOf: TypeError,
      message:
        'Invalid file under `document`: the function of an InputFile returned a string; ' +
        'return `InputFile.fromLocalFile(path)` or `InputFile.fromURLStream(url)`.',
    }
  )
})

test('InputFile should accept a plain object from its function', async (t) => {
  // A plain `{ source }` or `{ url }` is typed as an `InputFile`.
  const file = localFile(t, 'plain.txt', 'from disk')
  const parts = await upload({
    document: new InputFile(() => ({ source: file })),
    photo: new InputFile(async () => ({
      url: 'https://example.com/a.jpg',
      filename: 'b.jpg',
    })),
  })

  t.deepEqual(parts.document, { file: 'plain.txt', content: 'from disk' })
  t.deepEqual(parts.photo, {
    file: 'b.jpg',
    content: 'from https://example.com/a.jpg',
  })
  await t.throwsAsync(
    upload({
      document: new InputFile(() => ({ source: Buffer.from('a'), extra: 1 })),
    }),
    { message: /unexpected key `extra`/ }
  )
  await t.throwsAsync(
    upload({ document: new InputFile(() => ({ source: file, extra: 1 })) }),
    {
      message:
        'Invalid file under `document`: the function of an InputFile returned an object ' +
        'that is not exactly `{ source, filename? }` or `{ url, filename? }`.',
    }
  )
})

test('InputFile should send a plain object of its kinds as it sends an InputFile', async (t) => {
  // A plain object of these kinds is typed as an `InputFile`. 4.16.3 didn't accept them.
  const iterable = {
    source: (async function* () {
      yield 'iterable'
    })(),
  }
  const parts = await upload({
    document: { source: new Blob(['blob']) },
    photo: { source: bytes('bytes'), filename: 'a.jpg' },
    video: { source: webStream('web stream') },
    audio: { source: response('https://example.com/a.mp3', 'response') },
    voice: iterable,
    animation: { source: () => ({ source: () => Readable.from(['nested']) }) },
  })

  t.is(parts.document.content, 'blob')
  t.deepEqual(parts.photo, { file: 'a.jpg', content: 'bytes' })
  t.is(parts.video.content, 'web stream')
  t.deepEqual(parts.audio, { file: 'a.mp3', content: 'response' })
  t.is(parts.voice.content, 'iterable')
  t.is(parts.animation.content, 'nested')
  t.throws(() => convertFiles({ voice: iterable }, download), {
    message: /can be sent once/,
  })
  const self = { source: () => self }
  await t.throwsAsync(upload({ document: self }), {
    message: /nested more than 10 deep/,
  })
})

test('InputFile should stop at 10 nested InputFiles', async (t) => {
  const expected = {
    instanceOf: TypeError,
    message:
      'Invalid file under `document`: InputFiles are nested more than 10 deep.',
  }
  const self = new InputFile(() => self)
  const endless = () => new InputFile(endless)

  await t.throwsAsync(upload({ document: self }), expected)
  await t.throwsAsync(upload({ document: endless() }), expected)
  await t.throwsAsync(
    upload({ document: chain(11, Buffer.from('a')) }),
    expected
  )
  const parts = await upload({ document: chain(10, Buffer.from('deep')) })
  t.is(parts.document.content, 'deep')
})

test('InputFile should be sent once if it is made from a stream', async (t) => {
  const stream = new InputFile(Readable.from(['once']))
  await upload({ document: stream })

  t.throws(() => convertFiles({ document: stream }, download), {
    instanceOf: TypeError,
    message:
      'Invalid file under `document`: a file made from a stream can be sent once; ' +
      'make it from a function that returns the stream to send it again.',
  })
  const twice = new InputFile(Readable.from(['twice']))
  t.throws(
    () => convertFiles({ document: twice, thumbnail: twice }, download),
    {
      message: /can be sent once/,
    }
  )
  const generator = new InputFile(
    (async function* () {
      yield 'once'
    })()
  )
  await upload({ document: generator })
  t.throws(() => convertFiles({ document: generator }, download), {
    message: /can be sent once/,
  })

  // Contents that can be read again can be sent again.
  const again = [
    new InputFile(Buffer.from('a')),
    InputFile.fromURLStream('https://example.com/a'),
    new InputFile(() => Readable.from(['a'])),
  ]
  for (const file of again) {
    await upload({ document: file })
    await t.notThrowsAsync(upload({ document: file }))
  }
})

test('InputFile should be sent once if a function returns it', async (t) => {
  const expected = { instanceOf: TypeError, message: /can be sent once/ }
  const file = new InputFile(Readable.from(['once']))
  const lazy = new InputFile(() => file)

  t.is((await upload({ document: lazy })).document.content, 'once')
  await t.throwsAsync(upload({ document: lazy }), expected)
  t.throws(() => convertFiles({ document: file }, download), expected)

  const web = new InputFile(webStream('once'))
  const lazyWeb = new InputFile(async () => web)
  t.is((await upload({ document: lazyWeb })).document.content, 'once')
  await t.throwsAsync(upload({ document: lazyWeb }), expected)
})

test('InputFile should reject a stream that was already read', async (t) => {
  const expected = {
    instanceOf: TypeError,
    message:
      'Invalid file under `document`: the stream was already read or destroyed; ' +
      'pass a new stream to send the file again.',
  }
  // Each function returns the same stream in every call.
  const node = Readable.from(['once'])
  const web = webStream('once')
  const response = new Response('once')
  for (const stream of [node, web, response]) {
    const same = new InputFile(() => stream)
    t.is((await upload({ document: same })).document.content, 'once')
    await t.throwsAsync(upload({ document: same }), expected)
  }

  const destroyed = new Readable({ read() {} })
  destroyed.destroy()
  t.throws(
    () => convertFiles({ document: new InputFile(destroyed) }, download),
    expected
  )
})

test('InputFile should leave a stream open when it refuses to send it again', async (t) => {
  // e.g. a socket, read to its end and still written to
  const { stream, written } = fixtures.stream.duplex()
  const same = new InputFile(() => stream)
  await upload({ document: same })
  await t.throwsAsync(upload({ document: same }), { message: /already read/ })
  t.false(stream.destroyed)
  stream.write('reply')
  t.deepEqual(written, ['reply'])

  // Another call is still reading the stream of an `InputFile` sent twice at once.
  const pending = new Readable({ read() {} })
  const file = new InputFile(pending)
  const first = convertFiles({ document: file }, download)
  t.throws(() => convertFiles({ document: file }, download), {
    message: /can be sent once/,
  })
  t.false(pending.destroyed)
  pending.push('still read')
  pending.push(null)
  const { payload, attachments } = extractFiles(first.payload)
  const { contentType, segments } = toMultipart(payload, attachments)
  const parts = parseMultipart(await assemble(segments), contentType)
  t.is(parts.document.content, 'still read')
})

test('InputFile should reject what is not the contents of a file', async (t) => {
  const expected = (kind) => ({
    instanceOf: TypeError,
    message: `Invalid file under \`document\`: ${kind} is not the contents of a file.`,
  })

  t.throws(
    () => convertFiles({ document: new InputFile(5) }, download),
    expected('[object Number]')
  )
  t.throws(
    () => convertFiles({ document: new InputFile({}) }, download),
    expected('[object Object]')
  )
  await t.throwsAsync(
    upload({ document: new InputFile(async () => undefined) }),
    expected('[object Undefined]')
  )
})

test('InputFile should reject a response with an error status', async (t) => {
  // Its body is an error page, not the file.
  let cancelled = false
  const body = new ReadableStream({
    cancel() {
      cancelled = true
    },
  })
  const failed = { ok: false, status: 404, statusText: 'Not Found', body }

  t.throws(() => convertFiles({ document: new InputFile(failed) }, download), {
    message: "Unable to download '': 404 Not Found",
  })
  t.true(cancelled, 'the error page is not read')
  // e.g. the response of node-fetch 2
  const nodeBody = new Readable({ read() {} })
  const failedNode = {
    ok: false,
    status: 500,
    statusText: 'Error',
    body: nodeBody,
  }
  t.throws(
    () => convertFiles({ document: new InputFile(failedNode) }, download),
    { message: "Unable to download '': 500 Error" }
  )
  t.true(nodeBody.destroyed, 'an error page from node-fetch is not read')
  const gone = new Response('gone', { status: 410, statusText: 'Gone' })
  await t.throwsAsync(upload({ document: new InputFile(async () => gone) }), {
    message: "Unable to download '': 410 Gone",
  })
  t.throws(
    () => convertFiles({ document: new InputFile(new Response(null)) }),
    { message: "Unable to download '': the response has no body" }
  )
})

test('InputFile should return the streams it was given', (t) => {
  let cancelled = false
  const node = new Readable({ read() {} })
  const web = new ReadableStream({
    cancel() {
      cancelled = true
    },
  })
  const nodeBody = new Readable({ read() {} })
  const { streams } = convertFiles(
    {
      document: new InputFile(node),
      photo: new InputFile(web),
      // e.g. the response of node-fetch 2
      voice: new InputFile({ ok: true, status: 200, body: nodeBody }),
      audio: new InputFile(Buffer.from('a')),
      video: new InputFile(() => Readable.from(['a'])),
    },
    download
  )
  t.deepEqual(
    streams,
    [node, web, nodeBody],
    'a function opens its stream when the upload reaches it'
  )

  destroyUnread(streams)
  t.true(node.destroyed)
  t.true(cancelled)
  t.true(nodeBody.destroyed)
})

test('InputFile should reject with the error of a response body that fails before it is read', async (t) => {
  // A Node stream that fails without an `error` listener ends the process.
  const error = new Error('connection reset')
  const body = new Readable({ read() {} })
  const payload = {
    document: new InputFile(Buffer.from('first')),
    voice: new InputFile({ ok: true, status: 200, body }),
  }
  const { payload: converted } = convertFiles(payload, download)
  body.destroy(error)
  await new Promise((resolve) => body.once('close', resolve))

  const { payload: fields, attachments } = extractFiles(converted)
  const { segments } = toMultipart(fields, attachments)
  await t.throwsAsync(assemble(segments), { is: error })
})

test('InputFile should destroy the stream of its function when the upload ends', async (t) => {
  // e.g. the request failed, or the server answered before the upload was done.
  const part = (stream) => {
    const converted = convertFiles(
      { document: new InputFile(() => stream) },
      download
    )
    const { payload, attachments } = extractFiles(converted.payload)
    const { segments } = toMultipart(payload, attachments)
    const part = segments.find((segment) => typeof segment === 'function')()
    return part[Symbol.asyncIterator]()
  }
  const endless = () =>
    new Readable({
      read() {
        this.push('a')
      },
    })
  // The stream is destroyed when the `close` of the stream it is piped into is emitted.
  const emitted = () => new Promise((resolve) => setImmediate(resolve))

  const atHeader = endless()
  const first = part(atHeader)
  await first.next()
  await first.return()
  await emitted()
  t.true(atHeader.destroyed)

  const inContents = endless()
  const second = part(inContents)
  await second.next()
  await second.next()
  await second.return()
  await emitted()
  t.true(inContents.destroyed)
})

test('InputFile should throw for a filename that is not a string', (t) => {
  // e.g. from JavaScript, or a value typed `any`
  for (const filename of [123, {}, true]) {
    t.throws(
      () => new InputFile(Buffer.from('a'), filename),
      {
        instanceOf: TypeError,
        message: 'The filename of an InputFile must be a string.',
      },
      String(filename)
    )
  }
})

test('InputFile should make a file from fromLocalFile or fromURLStream called unbound', (t) => {
  // As the `Input` helpers allowed.
  const { fromLocalFile, fromURLStream } = InputFile
  const files = [fromLocalFile('a.jpg'), fromURLStream('https://example.com/a')]

  for (const file of files) {
    t.true(file instanceof InputFile)
    t.true(isBrandedInputFile(file))
  }
})

test('InputFile should take a null filename as no name', async (t) => {
  // v4's plain file objects took `filename: null` as no name.
  const file = new InputFile(Buffer.from('a'), null)

  t.is(file.filename, undefined)
  t.is((await upload({ document: file })).document.file, 'document.dat')
})

test('InputFile should serialise as its filename', (t) => {
  // Not its path or its contents.
  t.is(
    JSON.stringify({ photo: InputFile.fromLocalFile('secret/a.jpg') }),
    '{"photo":"[InputFile]"}'
  )
  t.is(
    JSON.stringify(new InputFile(Buffer.from('a'), 'b.txt')),
    '"[InputFile b.txt]"'
  )
})

test('InputFile should leave a TelegramError of a refused upload serialisable', async (t) => {
  // e.g. a logger that serialises an error with its properties
  const refused = { ok: false, error_code: 400, description: 'Bad Request' }
  const { fetch } = fixtures.fetch.recorder(
    async () => new Response(JSON.stringify(refused))
  )
  const client = new ApiClient(TOKEN, { fetch })
  const document = new InputFile(Buffer.from('a'), 'a.txt')
  const error = await t.throwsAsync(
    client.callApi('sendDocument', { chat_id: 1, document })
  )

  t.is(
    JSON.parse(JSON.stringify(error)).on.payload.document,
    '[InputFile a.txt]'
  )
})

test('isBrandedInputFile should accept an InputFile from another package copy', (t) => {
  t.true(isBrandedInputFile(InputFile.fromLocalFile('a.jpg')))
  t.true(
    isBrandedInputFile({
      [Symbol.for('telegraf.InputFile')]: true,
      source: 'a',
    })
  )
  t.false(isBrandedInputFile({ source: 'a.jpg' }), 'a look-alike is not a file')
})
