const test = require('ava')
const {
  InputFile,
  extractFiles,
  toJson,
  toMultipart,
} = require('../lib/core/network/payload')

const bytes = (text) => new TextEncoder().encode(text)

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

test('a payload without files is returned as it is', (t) => {
  const payload = { chat_id: 1, reply_markup: { inline_keyboard: [[]] } }
  const extracted = extractFiles(payload)

  t.is(extracted.payload, payload, 'nothing is copied')
  t.deepEqual(extracted.attachments, [])
})

test('JSON leaves out null and undefined', (t) => {
  t.is(
    toJson({
      chat_id: 1,
      caption: null,
      entities: undefined,
      nested: { a: null, b: 2 },
    }),
    '{"chat_id":1,"nested":{"b":2}}'
  )
})

test('a file that is a parameter is taken out, and the payload is not changed', (t) => {
  const file = new InputFile(bytes('DATA'), 'a.txt')
  const payload = { chat_id: 1, document: file }
  const extracted = extractFiles(payload)

  t.is(payload.document, file, 'the caller still holds its file')
  t.deepEqual(extracted.attachments, [
    { id: 'document', parameter: 'document', file },
  ])
  t.is(extracted.payload.document, undefined)
  t.is(extracted.payload.chat_id, 1)
})

test('files are found at any depth', (t) => {
  const thumbnail = new InputFile(bytes('thumb'))
  const sticker = new InputFile(bytes('sticker'))
  const second = new InputFile(bytes('second'))
  const payload = {
    // the three shapes 776b0f could not reach
    rich_message: { blocks: [{ type: 'animation', animation: { thumbnail } }] },
    stickers: [{ sticker, emoji_list: ['x'] }],
    media: [
      { type: 'photo', media: 'file-id' },
      { type: 'photo', media: second },
    ],
  }
  const { payload: out, attachments } = extractFiles(payload)

  t.deepEqual(
    attachments.map((a) => [a.parameter, a.file]),
    [
      ['rich_message', thumbnail],
      ['stickers', sticker],
      ['media', second],
    ]
  )
  const ids = attachments.map((a) => a.id)
  t.is(new Set(ids).size, 3, 'every attachment has its own id')
  t.is(out.rich_message.blocks[0].animation.thumbnail, `attach://${ids[0]}`)
  t.is(out.stickers[0].sticker, `attach://${ids[1]}`)
  t.is(out.media[1].media, `attach://${ids[2]}`)

  t.is(out.media[0], payload.media[0], 'an item without a file is shared')
  t.is(payload.media[1].media, second, 'the original is untouched')
})

test('multipart: parameters, then attachments, byte for byte', async (t) => {
  const { payload, attachments } = extractFiles({
    chat_id: 1,
    caption: 'hi',
    disable_notification: true,
    document: new InputFile(bytes('DATA'), 'a.txt'),
    reply_parameters: { message_id: 7, quote: null },
    message_thread_id: undefined,
    // A caller may refer to a file that is a parameter by the parameter's name.
    media: [{ type: 'document', media: 'attach://document' }],
    cover: { nested: new InputFile(bytes('NESTED'), 'b.txt') },
  })
  const { contentType, segments } = toMultipart(payload, attachments, 'B')
  const [, { id }] = attachments

  t.is(contentType, 'multipart/form-data; boundary=B')
  t.is(
    await assemble(segments),
    [
      '--B',
      'content-disposition: form-data; name="chat_id"',
      '',
      '1',
      '--B',
      'content-disposition: form-data; name="caption"',
      '',
      'hi',
      '--B',
      'content-disposition: form-data; name="disable_notification"',
      '',
      'true',
      '--B',
      'content-disposition: form-data; name="reply_parameters"',
      '',
      '{"message_id":7}',
      '--B',
      'content-disposition: form-data; name="media"',
      '',
      '[{"type":"document","media":"attach://document"}]',
      '--B',
      'content-disposition: form-data; name="cover"',
      '',
      `{"nested":"attach://${id}"}`,
      '--B',
      'content-disposition: form-data; name="document"; filename="a.txt"',
      'content-type: application/octet-stream',
      '',
      'DATA',
      '--B',
      `content-disposition: form-data; name="${id}"; filename="b.txt"`,
      'content-type: application/octet-stream',
      '',
      'NESTED',
      '--B--',
      '',
    ].join('\r\n')
  )
})

test('multipart: known bytes are joined, sources stay as they are', (t) => {
  const blob = new Blob(['blob'])
  const stream = () => (async function* () {})()
  const { payload, attachments } = extractFiles({
    chat_id: 1,
    photo: new InputFile(blob),
    thumbnail: new InputFile(stream),
    document: new InputFile(bytes('x').buffer),
  })
  const { segments } = toMultipart(payload, attachments, 'B')

  t.is(segments.length, 7, 'text, source, text, source, text, source, text')
  t.is(segments[1], blob, 'a Blob is not read')
  t.is(segments[3], stream, 'a stream is not opened')
  t.true(segments[5] instanceof Uint8Array, 'an ArrayBuffer becomes bytes')
})

test('multipart: a file without a name is named after its parameter', async (t) => {
  const { payload, attachments } = extractFiles({
    photo: new InputFile(bytes('p')),
    media: [{ type: 'video', media: new InputFile(bytes('m')) }],
  })
  const body = await assemble(toMultipart(payload, attachments, 'B').segments)

  t.regex(body, /filename="photo\.jpg"/)
  t.regex(body, /filename="media\.dat"/)
})

test('multipart: names cannot break out of their header', async (t) => {
  const { payload, attachments } = extractFiles({
    document: new InputFile(bytes('x'), 'a"\r\nx-injected: 1\r\n.txt'),
  })
  const body = await assemble(toMultipart(payload, attachments, 'B').segments)

  t.regex(body, /filename="a%22%0D%0Ax-injected: 1%0D%0A\.txt"\r\n/)
  t.notRegex(body, /\r\nx-injected/)
})

test('multipart: a name reaches the server as it was given', async (t) => {
  // The Bot API server percent-decodes a file name, and reads a backslash inside the quotes
  // as an escape. Sent as they are, '%2F' would become '/' and the backslash would vanish.
  const name = 'отчёт 50%2Foff\\sale "final" 100%.txt'
  const { payload, attachments } = extractFiles({
    document: new InputFile(bytes('x'), name),
  })
  const body = await assemble(toMultipart(payload, attachments, 'B').segments)
  const [, sent] = /filename="([^"]*)"/.exec(body)

  t.is(sent, 'отчёт 50%252Foff%5Csale %22final%22 100%25.txt')
  t.is(decodeURIComponent(sent), name, 'percent-decoding gives the name back')
})

test('a file made by another copy of the package is recognised', (t) => {
  const foreign = {
    [Symbol.for('telegraf.InputFile')]: true,
    source: bytes('x'),
  }

  t.true(InputFile.is(foreign))
  t.is(extractFiles({ photo: foreign }).attachments.length, 1)
  t.false(InputFile.is({ source: bytes('x') }), 'a look-alike is not a file')
})

test('a file out of reach fails loudly instead of being sent as data', (t) => {
  class Wrapper {
    constructor() {
      this.photo = new InputFile(bytes('x'))
    }
  }
  const { payload, attachments } = extractFiles({ extra: new Wrapper() })

  t.is(attachments.length, 0, 'class instances are not walked')
  t.throws(() => toJson(payload), { instanceOf: TypeError })
})
