const test = require('ava')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { Readable, Stream } = require('stream')
const { convertFileLiterals } = require('../lib/core/network/file-literals')
const { InputFile, extractFiles } = require('../lib/core/network/payload')
const Input = require('../lib/input')

// Records every warning emitted in this file. A warning is emitted once per process, so
// the tests that count them run serially, and first.
const warnings = []
process.emitWarning = (message, type, code) =>
  warnings.push({ message, type, code })

// These tests don't fetch anything.
const fakeDownload = () => Readable.from([])
const convert = (payload, download = fakeDownload) =>
  convertFileLiterals(payload, download).payload

// Reads a file's contents as text.
const text = async ({ source }) => {
  if (source instanceof Uint8Array) return Buffer.from(source).toString()
  const chunks = []
  for await (const chunk of source()) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString()
}

const FILE_KEYS = [
  'animation',
  'audio',
  'certificate',
  'cover',
  'document',
  'live_photo',
  'media',
  'photo',
  'png_sticker',
  'sticker',
  'tgs_sticker',
  'thumb',
  'thumbnail',
  'video',
  'video_note',
  'voice',
  'webm_sticker',
]

test.serial('should convert an Input helper literal without a warning', (t) => {
  const converted = convert({
    photo: Input.fromBuffer(Buffer.from('a'), 'a.jpg'),
    anything: { list: [{ at: { all: Input.fromURLStream('https://x/b') } }] },
    also: Input.fromLocalFile('c.txt'),
    and: Input.fromReadableStream(Readable.from(['d'])),
    last: Input.fromLazyStream(() => Readable.from(['e'])),
  })

  t.true(InputFile.is(converted.photo))
  t.true(InputFile.is(converted.anything.list[0].at.all))
  t.true(InputFile.is(converted.also))
  t.true(InputFile.is(converted.and))
  t.true(InputFile.is(converted.last))
  t.deepEqual(warnings, [])
})

test.serial('should not convert a { url } object outside a file key', (t) => {
  // These are Bot API objects, not files.
  const payload = {
    link_preview_options: { url: 'https://example.com' },
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'app', web_app: { url: 'https://example.com/app' } },
          { text: 'log in', login_url: { url: 'https://example.com/in' } },
        ],
      ],
    },
    results: [{ url: 'https://example.com/result' }],
    // Only the URL of a file has to be an HTTP URL.
    start_parameter: { url: 'tg://resolve?domain=telegraf' },
  }

  t.is(convert(payload), payload)
  t.deepEqual(warnings, [])
})

test.serial('should warn once per plain literal type', (t) => {
  const payload = () => ({
    photo: { source: Buffer.from('a') },
    document: { source: 'a.txt' },
    video: { source: new Readable({ read() {} }) },
    audio: { url: 'https://example.com/a.mp3' },
    voice: { source: () => Readable.from(['a']) },
  })
  convert(payload())
  convert(payload())

  const helpers = {
    TELEGRAF_FILE_BUFFER: /`\{ source \}`.*`Input\.fromBuffer\(buffer\)`/,
    TELEGRAF_FILE_FUNCTION:
      /`\{ source \}`.*`Input\.fromLazyStream\(\(\) => stream\)`/,
    TELEGRAF_FILE_PATH: /`\{ source \}`.*`Input\.fromLocalFile\(path\)`/,
    TELEGRAF_FILE_STREAM:
      /`\{ source \}`.*`Input\.fromReadableStream\(stream\)`/,
    TELEGRAF_FILE_URL: /`\{ url \}`.*`Input\.fromURLStream\(url\)`/,
  }
  t.deepEqual(
    warnings.map((warning) => warning.code).sort(),
    Object.keys(helpers)
  )
  for (const { message, type, code } of warnings) {
    t.is(type, 'DeprecationWarning')
    t.regex(message, helpers[code])
  }
})

test('should convert a nested { source } literal', (t) => {
  const literal = { source: Buffer.from('a') }
  const converted = convert({ anything: { list: [{ at: { all: literal } }] } })

  t.true(InputFile.is(converted.anything.list[0].at.all))
})

test('should convert a { url } literal under every file key', (t) => {
  const literal = { url: 'https://example.com/a' }
  for (const key of FILE_KEYS) {
    t.true(InputFile.is(convert({ [key]: literal })[key]), key)
    t.true(InputFile.is(convert({ a: [{ [key]: literal }] }).a[0][key]), key)
    t.true(InputFile.is(convert({ [key]: [literal] })[key][0]), `${key}[]`)
  }
})

test('should convert only an exact literal shape', (t) => {
  const source = Buffer.from('a')
  const others = [
    { source, caption: 'a' },
    { source, filename: 5 },
    { source: 5 },
    { source: {} },
    { source, url: 'https://example.com/a' },
    { url: 5 },
    { url: 'https://example.com/a', type: 'photo' },
    { filename: 'a.jpg' },
    {},
  ]
  for (const other of others) {
    const payload = { photo: other }
    t.is(convert(payload), payload, JSON.stringify(other))
  }

  // A key set to undefined counts as absent.
  for (const file of [
    { source, filename: undefined },
    { source, caption: undefined },
    { url: 'https://example.com/a', filename: undefined },
  ]) {
    t.true(InputFile.is(convert({ photo: file }).photo), JSON.stringify(file))
  }
})

test('should accept a null filename and a URL object', async (t) => {
  // v4 accepted a null filename and a URL object.
  const asked = []
  const download = (url) => {
    asked.push(url)
    return Readable.from(['downloaded'])
  }
  const converted = convert(
    {
      photo: { source: Buffer.from('a'), filename: null },
      document: { url: new URL('https://example.com/a b'), filename: null },
    },
    download
  )

  t.true(InputFile.is(converted.photo))
  t.is(converted.photo.name, undefined)
  t.is(converted.document.name, undefined)
  t.is(await text(converted.document), 'downloaded')
  t.deepEqual(asked, ['https://example.com/a%20b'])
})

test('should support a stream without an async iterator', async (t) => {
  // Streams from before async iteration only have pipe().
  const old = new Stream()
  const bare = {
    pipe(destination) {
      destination.end('bare')
    },
  }
  const { payload, streams } = convertFileLiterals(
    { video: { source: old }, audio: Input.fromReadableStream(bare) },
    fakeDownload
  )
  t.deepEqual(streams, [old, bare])

  // Such a stream emits whether or not it is being read.
  old.emit('data', Buffer.from('an old '))
  old.emit('data', 'stream')
  old.emit('end')
  t.is(await text(payload.video), 'an old stream')
  t.is(await text(payload.audio), 'bare')
})

test('should use the filename or the path basename', (t) => {
  const source = Buffer.from('a')
  const converted = convert({
    named: { source, filename: 'a.jpg' },
    unnamed: { source },
    path: { source: path.join('some', 'folder', 'b.txt') },
    renamed: {
      source: path.join('some', 'folder', 'b.txt'),
      filename: 'c.txt',
    },
    photo: { url: 'https://example.com/d.png', filename: 'e.png' },
  })

  t.is(converted.named.name, 'a.jpg')
  t.is(converted.unnamed.name, undefined)
  t.is(converted.path.name, 'b.txt')
  t.is(converted.renamed.name, 'c.txt')
  t.is(converted.photo.name, 'e.png')
})

test('should use a Buffer or a stream as the source', async (t) => {
  const source = Buffer.from('bytes')
  const stream = Readable.from(['stream'])
  const converted = convert({ photo: { source }, video: { source: stream } })

  t.is(converted.photo.source, source)
  t.is(await text(converted.video), 'stream')
})

test('should keep what a flowing stream emits before it is read', async (t) => {
  // e.g. the caller's own `data` listener for progress.
  const stream = Readable.from(['flow', 'ing'])
  let seen = ''
  stream.on('data', (chunk) => (seen += chunk))
  const converted = convert({ video: Input.fromReadableStream(stream) })

  await new Promise((resolve) => stream.once('end', resolve))
  t.is(seen, 'flowing')
  t.is(await text(converted.video), 'flowing')
})

test('should give a stream under two keys to both files', async (t) => {
  const stream = Readable.from(['twice'])
  const converted = convert({
    document: Input.fromReadableStream(stream),
    thumbnail: Input.fromReadableStream(stream),
  })

  t.is(await text(converted.document), 'twice')
  t.is(await text(converted.thumbnail), 'twice')
})

test('should reject with an early stream error', async (t) => {
  // A stream error without a listener is an uncaught exception.
  const error = new Error('disk gone')
  const stream = new Readable({ read() {} })
  const converted = convert({ document: Input.fromReadableStream(stream) })

  stream.destroy(error)
  await new Promise((resolve) => stream.once('close', resolve))
  await t.throwsAsync(text(converted.document), { is: error })
})

test('should return the source streams', (t) => {
  // Unlike a path or a URL, they are already open.
  const first = Readable.from(['a'])
  const second = Readable.from(['b'])
  const { streams } = convertFileLiterals(
    {
      photo: Input.fromReadableStream(first),
      media: [{ type: 'video', media: { source: second } }],
      document: { source: Buffer.from('c') },
      audio: { source: 'd.mp3' },
      voice: { url: 'https://example.com/e.ogg' },
    },
    fakeDownload
  )

  t.deepEqual(streams, [first, second])
})

test('should reject a { url } file that is not an HTTP URL', (t) => {
  const expected = {
    instanceOf: TypeError,
    message: /only http: and https: URLs are supported/,
  }
  const refused = [
    'file:///etc/passwd',
    'data:text/plain,a',
    'ftp://example.com/a.jpg',
    'example.com/a.jpg',
    '',
  ]
  for (const url of refused) {
    t.throws(() => convert({ photo: { url } }), expected, url)
    t.throws(() => convert({ any: Input.fromURLStream(url) }), expected, url)
  }

  t.notThrows(() =>
    convert({
      photo: Input.fromURLStream('HTTP://example.com/a.jpg'),
      audio: Input.fromURLStream(new URL('https://example.com/a.mp3')),
    })
  )
})

test('should destroy the streams it found when it throws', (t) => {
  // The caller gets no list of streams to destroy.
  const stream = new Readable({ read() {} })
  const payload = {
    document: Input.fromReadableStream(stream),
    thumbnail: Input.fromURLStream('file:///a.jpg'),
  }

  t.throws(() => convert(payload), { instanceOf: TypeError })
  t.true(stream.destroyed)
})

test('should read a file path lazily', async (t) => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'telegraf-'))
  t.teardown(() => fs.rmSync(folder, { recursive: true }))
  const file = path.join(folder, 'a.txt')
  fs.writeFileSync(file, 'contents')
  const missing = path.join(folder, 'missing.txt')

  // The paths aren't opened yet.
  const converted = convert({
    document: { source: file },
    photo: { source: folder },
    video: { source: missing },
  })

  t.is(await text(converted.document), 'contents')
  await t.throwsAsync(text(converted.photo), {
    instanceOf: TypeError,
    message: `Unable to upload '${folder}', not a file`,
  })
  await t.throwsAsync(text(converted.video), { code: 'ENOENT' })
})

test('should download a URL when its file is read', async (t) => {
  // A download that waits for its turn can be dropped by its host.
  const asked = []
  const download = (url) => {
    asked.push(url)
    return Readable.from([`from ${url}`])
  }
  const converted = convert(
    {
      photo: { url: 'https://example.com/a' },
      media: [{ type: 'photo', media: { url: 'https://example.com/b' } }],
    },
    download
  )
  t.deepEqual(asked, [])

  t.is(await text(converted.photo), 'from https://example.com/a')
  t.deepEqual(asked, ['https://example.com/a'])
  t.is(await text(converted.media[0].media), 'from https://example.com/b')
  t.deepEqual(asked, ['https://example.com/a', 'https://example.com/b'])
})

test('should call a lazy stream function when its file is read', async (t) => {
  let calls = 0
  const converted = convert({
    document: Input.fromLazyStream(() => {
      calls++
      return Readable.from(['la', 'zy'])
    }),
  })
  t.is(calls, 0)

  t.is(await text(converted.document), 'lazy')
  t.is(calls, 1)
  // A stream can be read once, so each read needs its own.
  t.is(await text(converted.document), 'lazy')
  t.is(calls, 2)
})

test('should accept every stream type from a lazy stream function', async (t) => {
  const web = () =>
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('web'))
        controller.close()
      },
    })
  const converted = convert({
    document: Input.fromLazyStream(web),
    photo: Input.fromLazyStream(async () => web()),
    video: Input.fromLazyStream(async function* () {
      yield Buffer.from('generator')
    }),
    audio: Input.fromLazyStream(async () => Readable.from(['node'])),
    // e.g. `() => fetch(url)`
    voice: Input.fromLazyStream(async () => new Response('response')),
    sticker: Input.fromLazyStream(() => new Response('response')),
  })

  t.is(await text(converted.document), 'web')
  t.is(await text(converted.photo), 'web')
  t.is(await text(converted.video), 'generator')
  t.is(await text(converted.audio), 'node')
  t.is(await text(converted.voice), 'response')
  t.is(await text(converted.sticker), 'response')
})

test('should reject a lazy stream function that returns no stream', async (t) => {
  const converted = convert({
    document: Input.fromLazyStream(() => Buffer.from('a')),
    photo: Input.fromLazyStream(async () => undefined),
    video: Input.fromLazyStream(async () => new Response(null)),
  })
  const expected = {
    instanceOf: TypeError,
    message: /`Input\.fromLazyStream` must return a stream/,
  }

  await t.throwsAsync(text(converted.document), expected)
  await t.throwsAsync(text(converted.photo), expected)
  await t.throwsAsync(text(converted.video), expected)
})

test('should reject a lazy stream response with an error status', async (t) => {
  // Its body is an error page, not the file.
  const converted = convert({
    document: Input.fromLazyStream(
      async () => new Response('gone', { status: 404, statusText: 'Not Found' })
    ),
  })

  await t.throwsAsync(text(converted.document), {
    message: /^Unable to download '.*': 404 Not Found$/,
  })
})

test('should not follow a value that contains itself', (t) => {
  // `JSON.stringify` throws for it when the payload is serialized.
  const payload = { chat_id: 1, list: [] }
  payload.self = payload
  payload.list.push(payload.list)
  t.is(convert(payload), payload)

  const upload = { photo: Input.fromBuffer(Buffer.from('a')) }
  upload.self = upload
  const converted = convert(upload)
  t.true(InputFile.is(converted.photo))
  t.is(converted.self, upload)
})

test('should convert a value that appears twice', (t) => {
  const item = { thumbnail: Input.fromBuffer(Buffer.from('a')) }
  const converted = convert({ media: [item, item], cover: item })

  t.true(InputFile.is(converted.media[0].thumbnail))
  t.true(InputFile.is(converted.media[1].thumbnail))
  t.true(InputFile.is(converted.cover.thumbnail))
})

test('should not mutate the payload', (t) => {
  const literal = { source: Buffer.from('a') }
  const file = new InputFile(Buffer.from('b'))
  const kept = { chat: { id: 1 } }
  const payload = { media: [{ type: 'photo', media: literal }], file, kept }
  const converted = convert(payload)

  t.not(converted, payload)
  t.is(payload.media[0].media, literal, 'the literal is still where it was')
  t.true(InputFile.is(converted.media[0].media))
  t.is(converted.file, file, 'an InputFile is not touched')
  t.is(converted.kept, kept, 'what holds no literal is shared')

  const plain = { chat_id: 1, text: 'a', entities: [{ type: 'bold' }] }
  t.is(convert(plain), plain, 'a payload with no literal is returned as it is')
})

test('should convert every v4 upload position', (t) => {
  const literals = [
    ['source', () => ({ source: Buffer.from('a') })],
    ['url', () => ({ url: 'https://example.com/a' })],
  ]
  for (const [kind, literal] of literals) {
    const positions = {
      'the parameter': [{ photo: literal() }, 1],
      thumb: [{ thumb: literal() }, 1],
      thumbnail: [{ thumbnail: literal() }, 1],
      'media[].media': [{ media: [{ type: 'photo', media: literal() }] }, 1],
      'media[].thumbnail': [
        { media: [{ type: 'video', media: literal(), thumbnail: literal() }] },
        2,
      ],
      'media[].thumb': [
        { media: [{ type: 'video', media: literal(), thumb: literal() }] },
        2,
      ],
      'media.media': [{ media: { type: 'photo', media: literal() } }, 1],
    }
    for (const [position, [payload, files]] of Object.entries(positions)) {
      const { attachments } = extractFiles(convert(payload, () => []))
      t.is(attachments.length, files, `${kind} at ${position}`)
    }
  }
})

test('Input helpers should keep their return shape', (t) => {
  const buffer = Buffer.from('a')
  const stream = Readable.from(['a'])
  const open = () => stream
  const cases = [
    [Input.fromLazyStream(open, 'a.txt'), { source: open, filename: 'a.txt' }],
    [Input.fromBuffer(buffer, 'a.jpg'), { source: buffer, filename: 'a.jpg' }],
    [Input.fromBuffer(buffer), { source: buffer, filename: undefined }],
    [Input.fromLocalFile('a.txt'), { source: 'a.txt', filename: undefined }],
    [Input.fromReadableStream(stream), { source: stream, filename: undefined }],
    [
      Input.fromURLStream(new URL('https://example.com/a'), 'a.png'),
      { url: 'https://example.com/a', filename: 'a.png' },
    ],
  ]
  for (const [made, literal] of cases) {
    t.deepEqual(Object.keys(made), Object.keys(literal))
    t.deepEqual({ ...made }, literal)
    // The marker is present but not enumerable.
    const [mark] = Object.getOwnPropertySymbols(made)
    t.is(mark, Symbol.for('telegraf.Input'))
    t.false(Object.prototype.propertyIsEnumerable.call(made, mark))
  }

  t.is(Input.fromURL('https://example.com/a'), 'https://example.com/a')
  t.is(Input.fromFileId('abc'), 'abc')
})
