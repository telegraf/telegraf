const test = require('ava')
const {
  MultipartFile,
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

test('extractFiles should return a payload without files unchanged', (t) => {
  const payload = { chat_id: 1, reply_markup: { inline_keyboard: [[]] } }
  const extracted = extractFiles(payload)

  t.is(extracted.payload, payload, 'nothing is copied')
  t.deepEqual(extracted.attachments, [])
})

test('toJson should omit null and undefined', (t) => {
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

test('extractFiles should extract a top-level file', (t) => {
  const file = new MultipartFile(bytes('DATA'), 'a.txt')
  const payload = { chat_id: 1, document: file }
  const extracted = extractFiles(payload)

  t.is(payload.document, file, 'the caller still holds its file')
  t.deepEqual(extracted.attachments, [
    { id: 'document', parameter: 'document', file },
  ])
  t.is(extracted.payload.document, undefined)
  t.is(extracted.payload.chat_id, 1)
})

test('extractFiles should find nested files', (t) => {
  const thumbnail = new MultipartFile(bytes('thumb'))
  const sticker = new MultipartFile(bytes('sticker'))
  const second = new MultipartFile(bytes('second'))
  const payload = {
    // three shapes the old upload code could not reach
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

test('extractFiles should not follow a value that contains itself', (t) => {
  const payload = { chat_id: 1, photo: new MultipartFile(bytes('a')), list: [] }
  payload.self = payload
  payload.list.push(payload.list)
  const { payload: fields, attachments } = extractFiles(payload)

  t.is(attachments.length, 1)
  t.is(fields.self, payload)
  // `JSON.stringify` is what refuses it.
  t.throws(() => toJson(fields), { instanceOf: TypeError })
})

test('extractFiles should extract a file from a value that appears twice', (t) => {
  const item = { thumbnail: new MultipartFile(bytes('a')) }
  const { payload: fields, attachments } = extractFiles({
    media: [item, item],
    cover: item,
  })

  t.is(attachments.length, 3)
  t.regex(fields.media[1].thumbnail, /^attach:\/\//)
  t.regex(fields.cover.thumbnail, /^attach:\/\//)
})

test('toMultipart should write fields before files', async (t) => {
  const { payload, attachments } = extractFiles({
    chat_id: 1,
    caption: 'hi',
    disable_notification: true,
    document: new MultipartFile(bytes('DATA'), 'a.txt'),
    reply_parameters: { message_id: 7, quote: null },
    message_thread_id: undefined,
    // A caller can reference a top-level file by its key: attach://<key>.
    media: [{ type: 'document', media: 'attach://document' }],
    cover: { nested: new MultipartFile(bytes('NESTED'), 'b.txt') },
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

test('toMultipart should not read file sources', (t) => {
  const blob = new Blob(['blob'])
  const stream = () => (async function* () {})()
  const { payload, attachments } = extractFiles({
    chat_id: 1,
    photo: new MultipartFile(blob),
    thumbnail: new MultipartFile(stream),
    document: new MultipartFile(bytes('x').buffer),
  })
  const { segments } = toMultipart(payload, attachments, 'B')

  t.is(segments.length, 7, 'text, source, text, source, text, source, text')
  t.is(segments[1], blob, 'a Blob is not read')
  t.is(segments[3], stream, 'a stream is not opened')
  t.true(segments[5] instanceof Uint8Array, 'an ArrayBuffer becomes bytes')
})

test('toMultipart should use a default file name', async (t) => {
  const { payload, attachments } = extractFiles({
    photo: new MultipartFile(bytes('p')),
    media: [{ type: 'video', media: new MultipartFile(bytes('m')) }],
  })
  const body = await assemble(toMultipart(payload, attachments, 'B').segments)

  t.regex(body, /filename="photo\.jpg"/)
  t.regex(body, /filename="media\.dat"/)
})

test('toMultipart should name a deferred file when it is opened', async (t) => {
  let opened = 0
  const deferred = (name) => ({
    open: async () => {
      opened++
      const stream = (async function* () {
        yield bytes('contents')
      })()
      return { stream, name }
    },
  })
  const { payload, attachments } = extractFiles({
    document: new MultipartFile(deferred('opened.txt')),
    photo: new MultipartFile(deferred('opened.jpg'), 'given.jpg'),
    video: new MultipartFile(deferred(undefined)),
  })
  const { segments } = toMultipart(payload, attachments, 'B')
  t.is(opened, 0, 'a deferred file is opened when the upload reaches it')
  const body = await assemble(segments)

  t.is(opened, 3)
  t.regex(
    body,
    /name="document"; filename="opened\.txt"\r\n[^]*\r\n\r\ncontents/
  )
  t.regex(body, /name="photo"; filename="given\.jpg"/, 'a given name wins')
  t.regex(body, /name="video"; filename="video\.mp4"/)
})

test('toMultipart should release a deferred stream when the upload ends', async (t) => {
  // e.g. the request failed, or the server answered before the upload was done.
  const cancelled = []
  const web = (name) =>
    new ReadableStream({
      pull: (controller) => controller.enqueue(bytes(name)),
      cancel: () => void cancelled.push(name),
    })
  const part = (stream) => {
    const { payload, attachments } = extractFiles({
      document: new MultipartFile({ open: async () => ({ stream }) }),
    })
    const { segments } = toMultipart(payload, attachments, 'B')
    return segments.find((segment) => typeof segment === 'function')()
  }

  const atHeader = part(web('at header'))
  t.regex(Buffer.from((await atHeader.next()).value).toString(), /filename=/)
  await atHeader.return()

  const inContents = part(web('in contents'))
  await inContents.next()
  t.is(Buffer.from((await inContents.next()).value).toString(), 'in contents')
  await inContents.return()

  t.deepEqual(cancelled, ['at header', 'in contents'])
})

test('toMultipart should escape header injection in a file name', async (t) => {
  const { payload, attachments } = extractFiles({
    document: new MultipartFile(bytes('x'), 'a"\r\nx-injected: 1\r\n.txt'),
  })
  const body = await assemble(toMultipart(payload, attachments, 'B').segments)

  t.regex(body, /filename="a%22%0D%0Ax-injected: 1%0D%0A\.txt"\r\n/)
  t.notRegex(body, /\r\nx-injected/)
})

test('toMultipart should percent-encode a file name', async (t) => {
  // The Bot API server percent-decodes a file name, and reads a backslash inside the quotes
  // as an escape. Sent as they are, '%2F' would become '/' and the backslash would vanish.
  const name = 'отчёт 50%2Foff\\sale "final" 100%.txt'
  const { payload, attachments } = extractFiles({
    document: new MultipartFile(bytes('x'), name),
  })
  const body = await assemble(toMultipart(payload, attachments, 'B').segments)
  const [, sent] = /filename="([^"]*)"/.exec(body)

  t.is(sent, 'отчёт 50%252Foff%5Csale %22final%22 100%25.txt')
  t.is(decodeURIComponent(sent), name, 'percent-decoding gives the name back')
})

test('MultipartFile.is should accept a MultipartFile from another package copy', (t) => {
  const foreign = {
    [Symbol.for('telegraf.MultipartFile')]: true,
    source: bytes('x'),
  }

  t.true(MultipartFile.is(foreign))
  t.is(extractFiles({ photo: foreign }).attachments.length, 1)
  t.false(
    MultipartFile.is({ source: bytes('x') }),
    'a look-alike is not a file'
  )
})

test('toJson should throw on a MultipartFile', (t) => {
  class Wrapper {
    constructor() {
      this.photo = new MultipartFile(bytes('x'))
    }
  }
  const { payload, attachments } = extractFiles({ extra: new Wrapper() })

  t.is(attachments.length, 0, 'class instances are not walked')
  t.throws(() => toJson(payload), { instanceOf: TypeError })
})
