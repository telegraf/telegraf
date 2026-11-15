const test = require('ava')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { Readable } = require('stream')
const { InputFile } = require('../lib/input-file')
const {
  convertFiles,
  destroyUnread,
} = require('../lib/core/network/file-literals')
const { extractFiles, toMultipart } = require('../lib/core/network/payload')

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

test('InputFile should upload each kind of contents', async (t) => {
  const file = localFile(t, 'on disk.txt', 'from disk')
  const generator = (async function* () {
    yield 'generator'
  })()
  const parts = await upload({
    document: new InputFile(file),
    photo: new InputFile('https://example.com/a/cat.jpg'),
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

test('InputFile should download a string only if it starts with http:// or https://', async (t) => {
  const file = localFile(t, 'https', 'a local file')
  const parts = await upload({
    photo: new InputFile('HTTPS://example.com/a.jpg'),
    video: new InputFile('http://example.com/b.mp4'),
    // A path that starts with `https`, not `https://`.
    document: new InputFile(file),
  })

  t.is(parts.photo.content, 'from HTTPS://example.com/a.jpg')
  t.is(parts.video.content, 'from http://example.com/b.mp4')
  t.is(parts.document.content, 'a local file')
})

test('InputFile should refuse a URL that is not http: or https:', (t) => {
  for (const url of ['file:///etc/passwd', 'ftp://example.com/a.jpg']) {
    t.throws(() => convertFiles({ photo: new InputFile(new URL(url)) }), {
      instanceOf: TypeError,
      message: /only http: and https: URLs are supported/,
    })
  }
})

test('InputFile should use its filename over the name of its contents', async (t) => {
  const parts = await upload({
    document: new InputFile('https://example.com/a.txt', 'renamed.txt'),
    animation: new InputFile(new File(['a'], 'named.gif'), 'renamed.gif'),
    // A URL without a last segment carries no name.
    photo: new InputFile('https://example.com/'),
  })

  t.is(parts.document.file, 'renamed.txt')
  t.is(parts.animation.file, 'renamed.gif')
  t.is(parts.photo.file, 'photo.jpg')
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

test('InputFile should accept each kind of contents from its function', async (t) => {
  const file = localFile(t, 'returned.txt', 'from disk')
  const parts = await upload({
    document: new InputFile(() => file),
    photo: new InputFile(async () => 'https://example.com/a/cat.jpg'),
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
    new InputFile('https://example.com/c/derived.txt', name)
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
  await t.throwsAsync(upload({ document: chain(11, 'a') }), expected)
  const parts = await upload({ document: chain(10, Buffer.from('deep')) })
  t.is(parts.document.content, 'deep')
})

test('InputFile should be sent once if it is made from a stream', async (t) => {
  const stream = new InputFile(Readable.from(['once']))
  await upload({ document: stream })

  t.throws(() => convertFiles({ document: stream }, download), {
    instanceOf: TypeError,
    message:
      'Invalid file under `document`: an InputFile made from a stream can be sent once; ' +
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
    new InputFile('https://example.com/a'),
    new InputFile(() => Readable.from(['a'])),
  ]
  for (const file of again) {
    await upload({ document: file })
    await t.notThrowsAsync(upload({ document: file }))
  }
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
  const { streams } = convertFiles(
    {
      document: new InputFile(node),
      photo: new InputFile(web),
      audio: new InputFile(Buffer.from('a')),
      video: new InputFile(() => Readable.from(['a'])),
    },
    download
  )
  t.is(
    streams.length,
    2,
    'a function opens its stream when the upload reaches it'
  )
  t.is(streams[0], node)
  t.is(streams[1], web)

  destroyUnread(streams)
  t.true(node.destroyed)
  t.true(cancelled)
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
    return segments.find((segment) => typeof segment === 'function')()
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

test('InputFile should throw when it is serialised', (t) => {
  t.throws(() => JSON.stringify({ photo: new InputFile('a.jpg') }), {
    instanceOf: TypeError,
  })
})

test('InputFile.is should accept an InputFile from another package copy', (t) => {
  t.true(InputFile.is(new InputFile('a.jpg')))
  t.true(
    InputFile.is({ [Symbol.for('telegraf.InputFile')]: true, source: 'a' })
  )
  t.false(InputFile.is({ source: 'a.jpg' }), 'a look-alike is not a file')
})
