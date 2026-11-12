const test = require('ava')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { Readable } = require('stream')
const { convertFileLiterals } = require('../lib/core/network/file-literals')
const { InputFile, extractFiles } = require('../lib/core/network/payload')
const Input = require('../lib/input')

// Every warning issued in this file. A warning is issued once in a process, so the tests
// that count them run one at a time, and first.
const warnings = []
process.emitWarning = (message, type, code) =>
  warnings.push({ message, type, code })

const noDownload = () => {
  throw new Error('nothing is to be downloaded here')
}
const convert = (payload, download = noDownload) =>
  convertFileLiterals(payload, download)

// The contents of a file, as text.
const read = async ({ source }) => {
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
  'sticker',
  'thumb',
  'thumbnail',
  'video',
  'video_note',
  'voice',
]

test.serial(
  'a literal made by an Input helper is a file anywhere, without a warning',
  (t) => {
    const converted = convert({
      photo: Input.fromBuffer(Buffer.from('a'), 'a.jpg'),
      anything: { list: [{ at: { all: Input.fromURLStream('https://x/b') } }] },
      also: Input.fromLocalFile('c.txt'),
      and: Input.fromReadableStream(Readable.from(['d'])),
    })

    t.true(InputFile.is(converted.photo))
    t.true(InputFile.is(converted.anything.list[0].at.all))
    t.true(InputFile.is(converted.also))
    t.true(InputFile.is(converted.and))
    t.deepEqual(warnings, [])
  }
)

test.serial('a { url } that is not held as a file is left alone', (t) => {
  // These are objects of the Bot API, not files.
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
  }

  t.is(convert(payload), payload)
  t.deepEqual(warnings, [])
})

test.serial(
  'each kind of plain literal warns once, and names its helper',
  (t) => {
    const payload = () => ({
      photo: { source: Buffer.from('a') },
      document: { source: 'a.txt' },
      video: { source: new Readable({ read() {} }) },
      audio: { url: 'https://example.com/a.mp3' },
    })
    convert(payload())
    convert(payload())

    const helpers = {
      TELEGRAF_FILE_BUFFER: /`\{ source \}`.*`Input\.fromBuffer\(buffer\)`/,
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
  }
)

test('a plain { source } is a file anywhere', (t) => {
  const literal = { source: Buffer.from('a') }
  const converted = convert({ anything: { list: [{ at: { all: literal } }] } })

  t.true(InputFile.is(converted.anything.list[0].at.all))
})

test('a plain { url } is a file under each name a file has', (t) => {
  const literal = { url: 'https://example.com/a' }
  for (const key of FILE_KEYS) {
    t.true(InputFile.is(convert({ [key]: literal })[key]), key)
    t.true(InputFile.is(convert({ a: [{ [key]: literal }] }).a[0][key]), key)
    t.true(InputFile.is(convert({ [key]: [literal] })[key][0]), `${key}[]`)
  }
})

test('only exactly a source or a URL, with or without a file name, is a file', (t) => {
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

  // A key that is there with no value is as good as absent.
  for (const file of [
    { source, filename: undefined },
    { source, caption: undefined },
    { url: 'https://example.com/a', filename: undefined },
  ]) {
    t.true(InputFile.is(convert({ photo: file }).photo), JSON.stringify(file))
  }
})

test('a file is named by its literal, and a path by its last part', (t) => {
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

test('bytes are the contents, and a stream is passed on', async (t) => {
  const source = Buffer.from('bytes')
  const stream = Readable.from(['stream'])
  const converted = convert({ photo: { source }, video: { source: stream } })

  t.is(converted.photo.source, source)
  t.is(converted.video.source(), stream)
  t.is(await read(converted.video), 'stream')
})

test('a path is read when the file is sent, and must be a file', async (t) => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'telegraf-'))
  t.teardown(() => fs.rmSync(folder, { recursive: true }))
  const file = path.join(folder, 'a.txt')
  fs.writeFileSync(file, 'contents')
  const missing = path.join(folder, 'missing.txt')

  // Nothing is looked at yet.
  const converted = convert({
    document: { source: file },
    photo: { source: folder },
    video: { source: missing },
  })

  t.is(await read(converted.document), 'contents')
  await t.throwsAsync(read(converted.photo), {
    instanceOf: TypeError,
    message: `Unable to upload '${folder}', not a file`,
  })
  await t.throwsAsync(read(converted.video), { code: 'ENOENT' })
})

test('a URL is downloaded when the file is sent', async (t) => {
  const asked = []
  const download = (url) => {
    asked.push(url)
    return Readable.from(['downloaded'])
  }
  const converted = convert(
    { photo: { url: 'https://example.com/a' } },
    download
  )
  t.deepEqual(asked, [], 'nothing is downloaded yet')

  t.is(await read(converted.photo), 'downloaded')
  t.deepEqual(asked, ['https://example.com/a'])
})

test('the payload is left as it was', (t) => {
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

test('every position v4 uploads from is found', (t) => {
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

test('an Input helper returns what it did before', (t) => {
  const buffer = Buffer.from('a')
  const stream = Readable.from(['a'])
  const cases = [
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
    // What marks it is there, and does not show.
    const [mark] = Object.getOwnPropertySymbols(made)
    t.is(mark, Symbol.for('telegraf.Input'))
    t.false(Object.prototype.propertyIsEnumerable.call(made, mark))
  }

  t.is(Input.fromURL('https://example.com/a'), 'https://example.com/a')
  t.is(Input.fromFileId('abc'), 'abc')
})
