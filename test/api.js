const http = require('http')
const { execFile } = require('child_process')
const os = require('os')
const fs = require('fs')
const path = require('path')
const util = require('util')
const ts = require('typescript')
const { default: test } = require('ava')
const { Context, Input, TelegrafNetworkError, Telegram } = require('../')

test('typed methods match the independent official Bot API 10.3 snapshot', (t) => {
  const snapshot = require('./_bot-api-methods.json')
  t.is(snapshot.methods.length, 185)
  t.deepEqual(readMethodsFromTypes().sort(), snapshot.methods)
})

test('README JavaScript examples are syntactically valid', (t) => {
  const readme = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8')
  const examples = [...readme.matchAll(/```js\r?\n([\s\S]*?)```/g)]
  t.true(examples.length > 0)
  for (const [index, example] of examples.entries()) {
    const source = ts.createSourceFile(
      `readme-${index}.js`,
      example[1],
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS
    )
    t.deepEqual(
      source.parseDiagnostics.map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      ),
      [],
      `README JavaScript example ${index + 1}`
    )
  }
})

test('legacy getChatMembersCount delegates to the supported API method', async (t) => {
  const telegram = new Telegram('token')
  telegram.callApi = async (method, payload) => {
    t.is(method, 'getChatMemberCount')
    t.deepEqual(payload, { chat_id: 42 })
    return 12
  }
  t.is(await telegram.getChatMembersCount(42), 12)
})

function readTypeFile() {
  const typesRoot = path.dirname(
    require.resolve('@telegraf/types/package.json')
  )
  return fs
    .readFileSync(path.join(typesRoot, 'bot-api.d.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

let apiDeclarations
function readApiDeclarations() {
  if (apiDeclarations) return apiDeclarations
  const entry = require.resolve('@telegraf/types/index.d.ts')
  const program = ts.createProgram([entry], {
    module: ts.ModuleKind.Node16,
    moduleResolution: ts.ModuleResolutionKind.Node16,
  })
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(entry)
  const api = checker
    .getExportsOfModule(checker.getSymbolAtLocation(source))
    .find((symbol) => symbol.name === 'ApiMethods')
  apiDeclarations = {
    checker,
    methods: checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(api)),
  }
  return apiDeclarations
}

function readMethodsFromTypes() {
  return readApiDeclarations().methods.map((symbol) => symbol.name)
}

function getBlock(source, pattern) {
  const match = pattern.exec(source)
  if (!match) return ''
  const open = source.indexOf('{', match.index)
  if (open === -1) return ''

  let depth = 0
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}') depth--
    if (depth === 0) return source.slice(open, i + 1)
  }
  return ''
}

function getInterface(source, name) {
  return getBlock(source, new RegExp(`\\binterface ${name}\\b`))
}

function getMethodArgs(source, name) {
  return getBlock(source, new RegExp(`\\b${name}\\(args\\??: \\{`))
}

function compact(value) {
  return value.replace(/\s+/g, ' ')
}

function hasField(block, name, type) {
  return compact(block).includes(`${name}: ${type};`)
}

function hasOptionalField(block, name, type) {
  return compact(block).includes(`${name}?: ${type};`)
}

function hasAnyField(block, name) {
  return new RegExp(`\\b${name}\\??\\s*:`).test(block)
}

function hasTypeMember(source, name, member) {
  const match = new RegExp(`\\btype ${name} = ([\\s\\S]*?);`).exec(source)
  return Boolean(match && compact(match[1]).includes(member))
}

// Package root as a TypeScript import specifier; forward slashes keep Windows paths valid in string literals
const packageRoot = process.cwd().split(path.sep).join('/')

const execFileAsync = util.promisify(execFile)

// Asynchronous on purpose: a blocking tsc run stalls the AVA worker, and several of them
// back to back exceed AVA's inactivity timeout for every other test in this file
async function compileTypeScript(name, source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'telegraf-types-'))
  const file = path.join(dir, name)
  fs.writeFileSync(file, source)
  try {
    // run tsc through node: the extensionless .bin shim cannot be spawned on Windows
    await execFileAsync(process.execPath, [
      require.resolve('typescript/bin/tsc'),
      '--ignoreConfig',
      '--types',
      'node',
      '--typeRoots',
      path.join(__dirname, '../node_modules/@types'),
      '--noEmit',
      '--strict',
      '--module',
      'node16',
      '--moduleResolution',
      'node16',
      '--target',
      'es2022',
      '--skipLibCheck',
      file,
    ])
  } catch (err) {
    // surface compiler diagnostics
    if (err.stdout) err.message += `\n${err.stdout}`
    throw err
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

test('Telegram wraps every typed Bot API method', (t) => {
  const methods = readMethodsFromTypes()
  const missing = methods.filter(
    (method) => typeof Telegram.prototype[method] !== 'function'
  )
  t.deepEqual(missing, [])
})

test('Telegram wrappers call through to matching Bot API methods', (t) => {
  const source = fs.readFileSync(path.join(__dirname, '../src/telegram.ts'), {
    encoding: 'utf8',
  })
  const wrapped = new Set(
    [...source.matchAll(/callApi\('([a-zA-Z0-9]+)'/g)].map((match) => match[1])
  )
  const aliases = new Set(
    [...source.matchAll(/get ([a-zA-Z0-9]+)\(\) \{\n {8}return this\./g)].map(
      (match) => match[1]
    )
  )
  const missing = readMethodsFromTypes().filter(
    (method) => !wrapped.has(method) && !aliases.has(method)
  )
  t.deepEqual(missing, [])
})

test('Telegram answerCallbackQuery passes raw Bot API options', (t) => {
  const telegram = new Telegram('token')
  telegram.callApi = (method, payload) => {
    t.is(method, 'answerCallbackQuery')
    t.deepEqual(payload, {
      callback_query_id: 'callback-query-id',
      text: 'ok',
    })
    return true
  }

  t.true(
    telegram.answerCallbackQuery({
      callback_query_id: 'callback-query-id',
      text: 'ok',
    })
  )
})

test('Telegram setStickerSetThumbnail follows Bot API order', (t) => {
  const telegram = new Telegram('token')
  telegram.callApi = (method, payload) => {
    t.is(method, 'setStickerSetThumbnail')
    t.deepEqual(payload, {
      name: 'stickers',
      user_id: 42,
      thumbnail: 'attach://thumbnail',
      format: 'static',
    })
    return true
  }

  t.true(
    telegram.setStickerSetThumbnail(
      'stickers',
      42,
      'attach://thumbnail',
      'static'
    )
  )
})

test('Context exposes business update helpers', async (t) => {
  let businessConnectionId
  const calls = []
  const telegram = {
    getBusinessConnection(id) {
      businessConnectionId = id
      return { id }
    },
    sendMessage(...args) {
      calls.push(['sendMessage', args])
      return true
    },
    sendPhoto(...args) {
      calls.push(['sendPhoto', args])
      return true
    },
  }
  const ctx = new Context(
    {
      update_id: 1,
      business_message: {
        business_connection_id: 'biz-1',
        message_id: 12,
        date: 1,
        chat: { id: 42, type: 'private' },
        text: 'hello',
      },
    },
    telegram,
    { id: 7, is_bot: true, first_name: 'Bot' }
  )

  t.is(ctx.bizConnId, 'biz-1')
  t.is(ctx.msg.text, 'hello')
  t.deepEqual(await ctx.getBusinessConnection(), { id: 'biz-1' })
  t.is(businessConnectionId, 'biz-1')

  await ctx.reply('business reply')
  await ctx.sendPhoto('photo-id')

  t.deepEqual(calls, [
    [
      'sendMessage',
      [
        42,
        'business reply',
        {
          business_connection_id: 'biz-1',
          message_thread_id: undefined,
        },
      ],
    ],
    [
      'sendPhoto',
      [
        42,
        'photo-id',
        {
          business_connection_id: 'biz-1',
          message_thread_id: undefined,
        },
      ],
    ],
  ])
})

// Bot API 10.3: ephemeral messages

const botInfo = { id: 7, is_bot: true, first_name: 'Bot' }
const ephemeralUser = { id: 99, is_bot: false, first_name: 'User' }
const guestResult = (text) => ({
  type: 'article',
  id: 'answer',
  title: 'Answer',
  input_message_content: { message_text: text },
})
const privateChat = { id: 42, type: 'private' }
const ephemeralParams = { receiver_user_id: 99, callback_query_id: 'cbq-1' }
const inlineMarkup = {
  inline_keyboard: [[{ text: 'ok', callback_data: 'ok' }]],
}
const EPHEMERAL_MANAGEMENT_METHODS = [
  'editEphemeralMessageText',
  'editEphemeralMessageCaption',
  'editEphemeralMessageMedia',
  'editEphemeralMessageReplyMarkup',
  'deleteEphemeralMessage',
]

const boldEntities = (length) => [{ type: 'bold', offset: 0, length }]

/** Telegram client whose `callApi` records `[method, payload]` instead of hitting the network */
function recordingTelegram(result = true) {
  const calls = []
  const telegram = new Telegram('token')
  telegram.callApi = (method, payload) => {
    calls.push([method, payload])
    return result
  }
  return { telegram, calls }
}

function callbackUpdate(message) {
  return {
    update_id: 1,
    callback_query: {
      id: 'cbq-1',
      from: ephemeralUser,
      chat_instance: 'instance',
      data: 'more',
      message,
    },
  }
}

const ephemeralMessage = {
  message_id: 12,
  date: 1,
  chat: privateChat,
  from: botInfo,
  text: 'only you can see this',
  ephemeral_message_id: 1,
}

const plainMessageUpdate = {
  update_id: 2,
  message: {
    message_id: 13,
    date: 1,
    chat: privateChat,
    from: ephemeralUser,
    text: 'hello',
  },
}

/** Returns the members of `ApiMethods` whose args accept `field`, read from the installed types */
function readMethodsAcceptingField(field) {
  const { checker, methods } = readApiDeclarations()
  return methods
    .filter((method) =>
      checker
        .getSignaturesOfType(
          checker.getTypeOfSymbol(method),
          ts.SignatureKind.Call
        )
        .some((signature) => {
          const args = signature.parameters[0]
          return (
            args &&
            checker.getPropertyOfType(checker.getTypeOfSymbol(args), field)
          )
        })
    )
    .map((method) => method.name)
    .sort()
}

/** Spins up a local Bot API stub, runs `call` against it and resolves with the captured request */
async function captureBotApiRequest(call) {
  let resolveRequest
  const request = new Promise((resolve) => {
    resolveRequest = resolve
  })
  const server = http.createServer((req, res) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      resolveRequest({
        url: req.url,
        headers: req.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      })
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ ok: true, result: true }))
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const telegram = new Telegram('123:abc', {
      apiRoot: `http://127.0.0.1:${server.address().port}`,
    })
    const result = await call(telegram)
    return { result, ...(await request) }
  } finally {
    server.close()
  }
}

function getMultipartField(body, name) {
  const match = new RegExp(
    `name="${name}"\\r\\n(?:[^\\r\\n]+\\r\\n)*\\r\\n([^\\r\\n]*)`
  ).exec(body)
  return match && match[1]
}

test('Telegram.editEphemeralMessageText sends plain and formatted text', async (t) => {
  const { bold } = require('../format')
  const { telegram, calls } = recordingTelegram({ marker: 'api-result' })
  const linkPreview = { is_disabled: true }

  const result = await telegram.editEphemeralMessageText(
    42,
    99,
    1,
    '<b>hi</b>',
    {
      parse_mode: 'HTML',
      link_preview_options: linkPreview,
      reply_markup: inlineMarkup,
    }
  )
  await telegram.editEphemeralMessageText('@channel', 99, 2, bold('new'), {
    parse_mode: 'HTML',
  })

  t.deepEqual(result, { marker: 'api-result' })
  t.deepEqual(calls, [
    [
      'editEphemeralMessageText',
      {
        receiver_user_id: 99,
        chat_id: 42,
        ephemeral_message_id: 1,
        parse_mode: 'HTML',
        link_preview_options: linkPreview,
        reply_markup: inlineMarkup,
        text: '<b>hi</b>',
      },
    ],
    [
      'editEphemeralMessageText',
      {
        receiver_user_id: 99,
        chat_id: '@channel',
        ephemeral_message_id: 2,
        // entities from FmtString win over a parse_mode passed in extra
        parse_mode: undefined,
        text: 'new',
        entities: boldEntities(3),
      },
    ],
  ])
})

test('Telegram.editEphemeralMessageCaption formats, keeps and clears captions', async (t) => {
  const { bold } = require('../format')
  const { telegram, calls } = recordingTelegram()

  await telegram.editEphemeralMessageCaption(42, 99, 1, 'caption', {
    parse_mode: 'MarkdownV2',
    show_caption_above_media: true,
    reply_markup: inlineMarkup,
  })
  await telegram.editEphemeralMessageCaption(42, 99, 1, bold('formatted'))
  await telegram.editEphemeralMessageCaption(42, 99, 1, undefined)

  t.deepEqual(calls, [
    [
      'editEphemeralMessageCaption',
      {
        receiver_user_id: 99,
        chat_id: 42,
        ephemeral_message_id: 1,
        parse_mode: 'MarkdownV2',
        show_caption_above_media: true,
        reply_markup: inlineMarkup,
        caption: 'caption',
      },
    ],
    [
      'editEphemeralMessageCaption',
      {
        receiver_user_id: 99,
        chat_id: 42,
        ephemeral_message_id: 1,
        caption: 'formatted',
        caption_entities: boldEntities(9),
        parse_mode: undefined,
      },
    ],
    [
      'editEphemeralMessageCaption',
      {
        receiver_user_id: 99,
        chat_id: 42,
        ephemeral_message_id: 1,
        caption: undefined,
      },
    ],
  ])
})

test('Telegram.editEphemeralMessageMedia handles formatted and absent captions', async (t) => {
  const { bold } = require('../format')
  const { telegram, calls } = recordingTelegram()
  const target = {
    chat_id: 42,
    receiver_user_id: 99,
    ephemeral_message_id: 1,
  }
  await telegram.editEphemeralMessageMedia(
    42,
    99,
    1,
    { type: 'photo', media: 'photo-id', caption: bold('media') },
    { reply_markup: inlineMarkup }
  )
  const plain = {
    type: 'video',
    media: 'video-id',
    caption: 'plain',
    parse_mode: 'HTML',
  }
  const noCaption = { type: 'document', media: 'document-id' }
  await telegram.editEphemeralMessageMedia(42, 99, 1, plain)
  await telegram.editEphemeralMessageMedia(42, 99, 1, noCaption)
  t.deepEqual(calls, [
    [
      'editEphemeralMessageMedia',
      {
        ...target,
        media: {
          type: 'photo',
          media: 'photo-id',
          caption: 'media',
          caption_entities: boldEntities(5),
          parse_mode: undefined,
        },
        reply_markup: inlineMarkup,
      },
    ],
    ['editEphemeralMessageMedia', { ...target, media: plain }],
    ['editEphemeralMessageMedia', { ...target, media: noCaption }],
  ])
})

test('Telegram.editEphemeralMessageReplyMarkup sets and removes keyboards', async (t) => {
  const { telegram, calls } = recordingTelegram()

  await telegram.editEphemeralMessageReplyMarkup(42, 99, 1, inlineMarkup)
  await telegram.editEphemeralMessageReplyMarkup('@channel', 99, 1, undefined)

  t.deepEqual(calls, [
    [
      'editEphemeralMessageReplyMarkup',
      {
        receiver_user_id: 99,
        chat_id: 42,
        ephemeral_message_id: 1,
        reply_markup: inlineMarkup,
      },
    ],
    [
      'editEphemeralMessageReplyMarkup',
      {
        receiver_user_id: 99,
        chat_id: '@channel',
        ephemeral_message_id: 1,
        reply_markup: undefined,
      },
    ],
  ])
})

test('Telegram.deleteEphemeralMessage targets chat and ephemeral id', async (t) => {
  const { telegram, calls } = recordingTelegram()

  t.true(await telegram.deleteEphemeralMessage(42, 99, 1))
  await telegram.deleteEphemeralMessage('@channel', 99, 2)

  t.deepEqual(calls, [
    [
      'deleteEphemeralMessage',
      { receiver_user_id: 99, chat_id: 42, ephemeral_message_id: 1 },
    ],
    [
      'deleteEphemeralMessage',
      {
        receiver_user_id: 99,
        chat_id: '@channel',
        ephemeral_message_id: 2,
      },
    ],
  ])
})

test('ephemeral methods serialize to the Bot API as JSON', async (t) => {
  const { bold } = require('../format')
  const requests = []
  const telegram = new Telegram('123:abc', {
    fetch: async (url, init) => {
      requests.push({
        url: String(url),
        contentType: init.headers['content-type'],
        body: JSON.parse(init.body),
      })
      return {
        status: 200,
        statusText: 'OK',
        json: async () => ({ ok: true, result: true }),
      }
    },
  })

  await telegram.sendMessage(42, 'hi', {
    ephemeral_message_parameters: {
      ...ephemeralParams,
      replace_callback_query_message: true,
    },
  })
  t.true(await telegram.editEphemeralMessageText(42, 99, 1, bold('bold')))
  t.true(await telegram.deleteEphemeralMessage(42, 99, 1))

  const endpoint = (method) => `https://api.telegram.org/bot123:abc/${method}`
  t.deepEqual(requests, [
    {
      url: endpoint('sendMessage'),
      contentType: 'application/json',
      body: {
        chat_id: 42,
        text: 'hi',
        ephemeral_message_parameters: {
          receiver_user_id: 99,
          callback_query_id: 'cbq-1',
          replace_callback_query_message: true,
        },
      },
    },
    {
      url: endpoint('editEphemeralMessageText'),
      contentType: 'application/json',
      // undefined parse_mode is dropped from the wire payload
      body: {
        receiver_user_id: 99,
        chat_id: 42,
        ephemeral_message_id: 1,
        text: 'bold',
        entities: boldEntities(4),
      },
    },
    {
      url: endpoint('deleteEphemeralMessage'),
      contentType: 'application/json',
      body: {
        receiver_user_id: 99,
        chat_id: 42,
        ephemeral_message_id: 1,
      },
    },
  ])
})

test('ephemeral parameters and media survive multipart uploads', async (t) => {
  const sent = await captureBotApiRequest((telegram) =>
    telegram.sendPhoto(
      42,
      Input.fromBuffer(Buffer.from('photo-bytes'), 'photo.png'),
      { caption: 'pic', ephemeral_message_parameters: ephemeralParams }
    )
  )
  t.is(sent.url, '/bot123:abc/sendPhoto')
  t.regex(sent.headers['content-type'], /^multipart\/form-data/)
  t.deepEqual(
    JSON.parse(getMultipartField(sent.body, 'ephemeral_message_parameters')),
    ephemeralParams
  )
  t.true(sent.body.includes('filename="photo.png"'))

  const edited = await captureBotApiRequest((telegram) =>
    telegram.editEphemeralMessageMedia(42, 99, 1, {
      type: 'photo',
      media: Input.fromBuffer(Buffer.from('new-bytes'), 'new.png'),
    })
  )
  t.true(edited.result)
  t.is(edited.url, '/bot123:abc/editEphemeralMessageMedia')
  t.regex(edited.headers['content-type'], /^multipart\/form-data/)
  t.is(getMultipartField(edited.body, 'ephemeral_message_id'), '1')
  t.is(getMultipartField(edited.body, 'receiver_user_id'), '99')
  const media = JSON.parse(getMultipartField(edited.body, 'media'))
  t.is(media.type, 'photo')
  const attachment = /^attach:\/\/([0-9a-f]+)$/.exec(media.media)
  t.truthy(attachment)
  t.true(edited.body.includes(`name="${attachment[1]}"`))
  t.true(edited.body.includes('new-bytes'))
})

test('Context.ephemeralMessageId resolves from the current update', (t) => {
  const idOf = (update) => new Context(update, {}, botInfo).ephemeralMessageId

  t.is(idOf(callbackUpdate(ephemeralMessage)), 1)
  t.is(
    idOf({
      update_id: 3,
      message: { ...ephemeralMessage, ephemeral_message_id: 4 },
    }),
    4
  )
  t.is(idOf(plainMessageUpdate), undefined)
  // inaccessible callback message (date 0) carries no ephemeral id
  t.is(
    idOf(callbackUpdate({ chat: privateChat, message_id: 12, date: 0 })),
    undefined
  )
  t.is(
    idOf({
      update_id: 4,
      inline_query: {
        id: 'iq',
        from: ephemeralUser,
        query: '',
        offset: '',
      },
    }),
    undefined
  )
})

test('Context ephemeral helpers default to the ephemeral message in the update', async (t) => {
  const { bold } = require('../format')
  const { telegram, calls } = recordingTelegram()
  const ctx = new Context(callbackUpdate(ephemeralMessage), telegram, botInfo)

  await ctx.editEphemeralMessageText(99, 'edited', {
    parse_mode: 'HTML',
    reply_markup: inlineMarkup,
  })
  await ctx.editEphemeralMessageCaption(99, bold('caption'), {
    show_caption_above_media: true,
  })
  await ctx.editEphemeralMessageMedia(
    99,
    { type: 'photo', media: 'photo-id', caption: 'plain' },
    { reply_markup: inlineMarkup }
  )
  await ctx.editEphemeralMessageReplyMarkup(99, inlineMarkup)
  await ctx.deleteEphemeralMessage(99)

  const target = {
    receiver_user_id: 99,
    chat_id: 42,
    ephemeral_message_id: 1,
  }
  t.deepEqual(calls, [
    [
      'editEphemeralMessageText',
      {
        ...target,
        parse_mode: 'HTML',
        reply_markup: inlineMarkup,
        text: 'edited',
      },
    ],
    [
      'editEphemeralMessageCaption',
      {
        ...target,
        show_caption_above_media: true,
        caption: 'caption',
        caption_entities: boldEntities(7),
        parse_mode: undefined,
      },
    ],
    [
      'editEphemeralMessageMedia',
      {
        ...target,
        media: { type: 'photo', media: 'photo-id', caption: 'plain' },
        reply_markup: inlineMarkup,
      },
    ],
    [
      'editEphemeralMessageReplyMarkup',
      { ...target, reply_markup: inlineMarkup },
    ],
    ['deleteEphemeralMessage', target],
  ])
})

test('Context ephemeral helpers accept an explicit ephemeral message id', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const fromEphemeral = new Context(
    callbackUpdate(ephemeralMessage),
    telegram,
    botInfo
  )
  const fromPlain = new Context(plainMessageUpdate, telegram, botInfo)
  const other = { ephemeral_message_id: 3 }

  for (const ctx of [fromEphemeral, fromPlain]) {
    await ctx.editEphemeralMessageText(99, 'text', { ...other })
    await ctx.editEphemeralMessageCaption(99, 'caption', { ...other })
    await ctx.editEphemeralMessageMedia(
      99,
      { type: 'photo', media: 'photo-id' },
      { ...other }
    )
    await ctx.editEphemeralMessageReplyMarkup(99, undefined, { ...other })
    await ctx.deleteEphemeralMessage(99, 3)
  }

  const target = {
    receiver_user_id: 99,
    chat_id: 42,
    ephemeral_message_id: 3,
  }
  const expected = [
    ['editEphemeralMessageText', { ...target, text: 'text' }],
    ['editEphemeralMessageCaption', { ...target, caption: 'caption' }],
    [
      'editEphemeralMessageMedia',
      { ...target, media: { type: 'photo', media: 'photo-id' } },
    ],
    ['editEphemeralMessageReplyMarkup', { ...target, reply_markup: undefined }],
    ['deleteEphemeralMessage', target],
  ]
  // the override wins over the update's id
  t.deepEqual(calls, [...expected, ...expected])

  // and is stripped from the extras handed to Telegram
  const extras = []
  const spy = (...args) => {
    extras.push(args.at(-1))
    return true
  }
  const spyCtx = new Context(
    callbackUpdate(ephemeralMessage),
    {
      editEphemeralMessageText: spy,
      editEphemeralMessageCaption: spy,
      editEphemeralMessageMedia: spy,
    },
    botInfo
  )
  await spyCtx.editEphemeralMessageText(99, 'text', {
    ...other,
    parse_mode: 'HTML',
  })
  await spyCtx.editEphemeralMessageCaption(99, 'caption', { ...other })
  await spyCtx.editEphemeralMessageMedia(
    99,
    { type: 'photo', media: 'photo-id' },
    { ...other }
  )
  t.deepEqual(extras, [{ parse_mode: 'HTML' }, {}, {}])
})

test('Context ephemeral helpers throw without a target and make no API call', (t) => {
  const { telegram, calls } = recordingTelegram()
  const invoke = {
    editEphemeralMessageText: (ctx, extra) =>
      ctx.editEphemeralMessageText(99, 'text', extra),
    editEphemeralMessageCaption: (ctx, extra) =>
      ctx.editEphemeralMessageCaption(99, 'caption', extra),
    editEphemeralMessageMedia: (ctx, extra) =>
      ctx.editEphemeralMessageMedia(
        99,
        { type: 'photo', media: 'photo-id' },
        extra
      ),
    editEphemeralMessageReplyMarkup: (ctx, extra) =>
      ctx.editEphemeralMessageReplyMarkup(99, inlineMarkup, extra),
    deleteEphemeralMessage: (ctx, extra) =>
      ctx.deleteEphemeralMessage(99, extra?.ephemeral_message_id),
  }
  t.deepEqual(
    Object.keys(invoke).sort(),
    [...EPHEMERAL_MANAGEMENT_METHODS].sort()
  )

  const noEphemeral = new Context(plainMessageUpdate, telegram, botInfo)
  const inaccessible = new Context(
    callbackUpdate({ chat: privateChat, message_id: 12, date: 0 }),
    telegram,
    botInfo
  )
  const noChat = new Context(
    {
      update_id: 5,
      inline_query: {
        id: 'iq',
        from: ephemeralUser,
        query: '',
        offset: '',
      },
    },
    telegram,
    botInfo
  )

  for (const [method, call] of Object.entries(invoke)) {
    t.throws(() => call(noEphemeral), {
      instanceOf: TypeError,
      message: `Telegraf: "${method}" isn't available for "message"`,
    })
    t.throws(() => call(inaccessible), {
      instanceOf: TypeError,
      message: `Telegraf: "${method}" isn't available for "callback_query"`,
    })
    // an explicit id cannot stand in for a missing chat
    t.throws(() => call(noChat, { ephemeral_message_id: 1 }), {
      instanceOf: TypeError,
      message: `Telegraf: "${method}" isn't available for "inline_query"`,
    })
  }
  t.deepEqual(calls, [])
})

// Every Telegram wrapper for a method whose Bot API args accept ephemeral_message_parameters
const telegramEphemeralSendCalls = {
  sendAnimation: (tg, extra) => tg.sendAnimation(42, 'animation-id', extra),
  sendAudio: (tg, extra) => tg.sendAudio(42, 'audio-id', extra),
  sendContact: (tg, extra) => tg.sendContact(42, '+100', 'Name', extra),
  sendDocument: (tg, extra) => tg.sendDocument(42, 'document-id', extra),
  sendLivePhoto: (tg, extra) =>
    tg.sendLivePhoto({
      chat_id: 42,
      photo: 'photo-id',
      live_photo: Input.fromBuffer(Buffer.from('clip'), 'clip.mp4'),
      ...extra,
    }),
  sendLocation: (tg, extra) => tg.sendLocation(42, 1, 2, extra),
  sendMessage: (tg, extra) => tg.sendMessage(42, 'text', extra),
  sendPhoto: (tg, extra) => tg.sendPhoto(42, 'photo-id', extra),
  sendRichMessage: (tg, extra) =>
    tg.sendRichMessage({
      chat_id: 42,
      rich_message: { markdown: '*rich*' },
      ...extra,
    }),
  sendSticker: (tg, extra) => tg.sendSticker(42, 'sticker-id', extra),
  sendVenue: (tg, extra) => tg.sendVenue(42, 1, 2, 'Title', 'Address', extra),
  sendVideo: (tg, extra) => tg.sendVideo(42, 'video-id', extra),
  sendVideoNote: (tg, extra) => tg.sendVideoNote(42, 'note-id', extra),
  sendVoice: (tg, extra) => tg.sendVoice(42, 'voice-id', extra),
}

// Context helpers for the same methods; every one of them must have a Context helper
const contextEphemeralSendCalls = {
  sendAnimation: (ctx, extra) => ctx.replyWithAnimation('animation-id', extra),
  sendAudio: (ctx, extra) => ctx.replyWithAudio('audio-id', extra),
  sendContact: (ctx, extra) => ctx.replyWithContact('+100', 'Name', extra),
  sendDocument: (ctx, extra) => ctx.replyWithDocument('document-id', extra),
  sendLivePhoto: (ctx, extra) =>
    ctx.replyWithLivePhoto(
      'photo-id',
      Input.fromBuffer(Buffer.from('clip'), 'clip.mp4'),
      extra
    ),
  sendLocation: (ctx, extra) => ctx.replyWithLocation(1, 2, extra),
  sendMessage: (ctx, extra) => ctx.reply('text', extra),
  sendPhoto: (ctx, extra) => ctx.replyWithPhoto('photo-id', extra),
  sendRichMessage: (ctx, extra) =>
    ctx.replyWithRichMessage({ markdown: '*rich*' }, extra),
  sendSticker: (ctx, extra) => ctx.replyWithSticker('sticker-id', extra),
  sendVenue: (ctx, extra) =>
    ctx.replyWithVenue(1, 2, 'Title', 'Address', extra),
  sendVideo: (ctx, extra) => ctx.replyWithVideo('video-id', extra),
  sendVideoNote: (ctx, extra) => ctx.replyWithVideoNote('note-id', extra),
  sendVoice: (ctx, extra) => ctx.replyWithVoice('voice-id', extra),
}

test('Bot API 10.3 ephemeral message fields are typed', async (t) => {
  await compileTypeScript(
    'bot-api-10-3-ephemeral-message-fields-are-typed.ts',
    [
      `import { Context, Input, Telegraf, Telegram } from '${packageRoot}'`,
      `import * as T from '${packageRoot}/types'`,
      `import { bold } from '${packageRoot}/format'`,
      'declare const ctx: Context',
      'declare const telegram: Telegram',
      'declare const bot: Telegraf',
      'const parameters: T.EphemeralMessageParameters = { receiver_user_id: 99, replace_callback_query_message: true }',
      "const reply: T.ReplyParameters = { ephemeral_message_id: 1, poll_option_id: 'a', quote_entities: [] }",
      "const edit: T.Opts<'editEphemeralMessageText'> = { chat_id: 1, receiver_user_id: 99, ephemeral_message_id: 1, text: 'hi' }",
      "const caption: T.Opts<'editEphemeralMessageCaption'> = { chat_id: 1, receiver_user_id: 99, ephemeral_message_id: 1, show_caption_above_media: false }",
      'const id: number | undefined = ctx.ephemeralMessageId',
      '// @ts-expect-error receiver is required',
      "const missing: T.Opts<'deleteEphemeralMessage'> = { chat_id: 1, ephemeral_message_id: 1 }",
      '// @ts-expect-error IDs are integers, not strings',
      "const wrong: T.ReplyParameters = { ephemeral_message_id: 'eph' }",
      '// @ts-expect-error a reply must specify one message identifier',
      'const noTarget: T.ReplyParameters = {}',
    ].join('\n')
  )
  t.pass()
})

test('ephemeral_message_parameters coverage matches the Bot API types', (t) => {
  const typed = readMethodsAcceptingField('ephemeral_message_parameters')

  // fails when the types add or drop ephemeral support on a method
  t.deepEqual(Object.keys(telegramEphemeralSendCalls).sort(), typed)
  t.deepEqual(Object.keys(contextEphemeralSendCalls).sort(), typed)
  // methods that must never gain the parameter by accident
  for (const method of [
    'sendMediaGroup',
    'sendPaidMedia',
    'copyMessage',
    'forwardMessage',
    'sendPoll',
    'sendDice',
    'sendInvoice',
    'sendGame',
  ]) {
    t.false(typed.includes(method), method)
  }
  // the management methods identify messages by ephemeral id, not by message_id
  t.deepEqual(
    readMethodsAcceptingField('ephemeral_message_id').filter((method) =>
      EPHEMERAL_MANAGEMENT_METHODS.includes(method)
    ),
    [...EPHEMERAL_MANAGEMENT_METHODS].sort()
  )
})

test('Telegram send wrappers forward ephemeral_message_parameters', async (t) => {
  for (const [method, call] of Object.entries(telegramEphemeralSendCalls)) {
    const { telegram, calls } = recordingTelegram()
    await call(telegram, { ephemeral_message_parameters: ephemeralParams })
    await call(telegram)

    t.is(calls.length, 2, method)
    const [[withMethod, withPayload], [withoutMethod, withoutPayload]] = calls
    t.is(withMethod, method)
    t.is(withoutMethod, method)
    t.is(withPayload.chat_id, 42, method)
    t.deepEqual(
      withPayload.ephemeral_message_parameters,
      ephemeralParams,
      method
    )
    // backward compatibility: no key is injected when the caller omits it
    t.false('ephemeral_message_parameters' in withoutPayload, method)
  }
})

test('Context send helpers forward ephemeral_message_parameters', async (t) => {
  for (const [method, call] of Object.entries(contextEphemeralSendCalls)) {
    const { telegram, calls } = recordingTelegram()
    const ctx = new Context(callbackUpdate(ephemeralMessage), telegram, botInfo)
    await call(ctx, {
      ephemeral_message_parameters: {
        receiver_user_id: ctx.from.id,
        callback_query_id: ctx.callbackQuery.id,
      },
    })
    await call(ctx)

    t.is(calls.length, 2, method)
    const [[withMethod, withPayload], [, withoutPayload]] = calls
    t.is(withMethod, method)
    t.is(withPayload.chat_id, 42, method)
    t.deepEqual(
      withPayload.ephemeral_message_parameters,
      ephemeralParams,
      method
    )
    t.false('ephemeral_message_parameters' in withoutPayload, method)
  }
})

test('Context send helpers combine ephemeral and business parameters', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const ctx = new Context(
    {
      update_id: 6,
      business_message: {
        business_connection_id: 'biz-1',
        message_id: 12,
        date: 1,
        chat: privateChat,
        text: 'hello',
      },
    },
    telegram,
    botInfo
  )

  await ctx.reply('hi', { ephemeral_message_parameters: ephemeralParams })

  t.deepEqual(calls, [
    [
      'sendMessage',
      {
        chat_id: 42,
        message_thread_id: undefined,
        business_connection_id: 'biz-1',
        ephemeral_message_parameters: ephemeralParams,
        text: 'hi',
      },
    ],
  ])
})

test('pre-10.3 message methods keep their payloads', async (t) => {
  const { bold } = require('../format')
  const { telegram, calls } = recordingTelegram()
  const location = { type: 'location', latitude: 1, longitude: 2 }

  await telegram.sendMessage(42, 'hi')
  await telegram.sendPhoto(42, 'photo-id')
  await telegram.editMessageText(42, 12, undefined, 'edited')
  await telegram.editMessageCaption(42, 12, undefined, bold('caption'))
  await telegram.editMessageMedia(42, 12, undefined, {
    type: 'photo',
    media: 'photo-id',
    caption: bold('media'),
  })
  await telegram.editMessageMedia(42, 12, undefined, location)
  await telegram.editMessageReplyMarkup(42, 12, undefined, inlineMarkup)
  await telegram.deleteMessage(42, 12)

  const ctx = new Context(plainMessageUpdate, telegram, botInfo)
  await ctx.reply('reply')
  await ctx.deleteMessage()

  const message = {
    chat_id: 42,
    message_id: 12,
    inline_message_id: undefined,
  }
  t.deepEqual(calls, [
    ['sendMessage', { chat_id: 42, text: 'hi' }],
    ['sendPhoto', { chat_id: 42, photo: 'photo-id' }],
    [
      'editMessageText',
      {
        text: 'edited',
        entities: undefined,
        parse_mode: undefined,
        reply_markup: undefined,
        link_preview_options: undefined,
        business_connection_id: undefined,
        chat_id: 42,
        message_id: 12,
      },
    ],
    [
      'editMessageCaption',
      {
        ...message,
        caption: 'caption',
        caption_entities: boldEntities(7),
        parse_mode: undefined,
      },
    ],
    [
      'editMessageMedia',
      {
        ...message,
        media: {
          type: 'photo',
          media: 'photo-id',
          caption: 'media',
          caption_entities: boldEntities(5),
          parse_mode: undefined,
        },
      },
    ],
    ['editMessageMedia', { ...message, media: location }],
    ['editMessageReplyMarkup', { ...message, reply_markup: inlineMarkup }],
    ['deleteMessage', { chat_id: 42, message_id: 12 }],
    [
      'sendMessage',
      {
        chat_id: 42,
        message_thread_id: undefined,
        business_connection_id: undefined,
        text: 'reply',
      },
    ],
    ['deleteMessage', { chat_id: 42, message_id: 13 }],
  ])
  for (const [, payload] of calls) {
    t.false('ephemeral_message_id' in payload)
    t.false('ephemeral_message_parameters' in payload)
  }
})

test('ephemeral message APIs are typed for Telegram and Context', async (t) => {
  await compileTypeScript(
    'ephemeral-types.ts',
    [
      `import { Context, Telegram } from '${packageRoot}'`,
      `import { bold } from '${packageRoot}/format'`,
      `import type { Convenience, EphemeralMessageParameters } from '${packageRoot}/types'`,
      '',
      'declare const ctx: Context',
      'declare const telegram: Telegram',
      'const ephemeral_message_parameters: EphemeralMessageParameters = {',
      '    receiver_user_id: 7,',
      '    callback_query_id: "cbq",',
      '    replace_callback_query_message: true,',
      '}',
      '',
      '// send helpers accept ephemeral parameters',
      'const replyExtra: Convenience.ExtraReplyMessage = { ephemeral_message_parameters }',
      'const photoExtra: Convenience.ExtraPhoto = { caption: bold("hi"), ephemeral_message_parameters }',
      'void ctx.reply("hi", replyExtra)',
      'void ctx.replyWithPhoto("photo", photoExtra)',
      'void ctx.sendDocument("doc", { ephemeral_message_parameters })',
      'void telegram.sendSticker(1, "s", { ephemeral_message_parameters })',
      'void telegram.sendVenue(1, 0, 0, "t", "a", { ephemeral_message_parameters })',
      'void telegram.sendRichMessage({ chat_id: 1, rich_message: { markdown: "*hi*" }, ephemeral_message_parameters })',
      '// @ts-expect-error receiver_user_id is required',
      'const missingReceiver: EphemeralMessageParameters = { callback_query_id: "cbq" }',
      '',
      '// methods without ephemeral support reject the parameter',
      '// @ts-expect-error sendMediaGroup',
      'void telegram.sendMediaGroup(1, [], { ephemeral_message_parameters })',
      '// @ts-expect-error copyMessage',
      'void telegram.copyMessage(1, 2, 3, { ephemeral_message_parameters })',
      '// @ts-expect-error forwardMessage',
      'void telegram.forwardMessage(1, 2, 3, { ephemeral_message_parameters })',
      '',
      '// management methods on Telegram',
      'const t1: Promise<true> = telegram.editEphemeralMessageText(1, 99, 1, bold("x"), { link_preview_options: { is_disabled: true } })',
      'const t2: Promise<true> = telegram.editEphemeralMessageCaption("@channel", 99, 1, undefined, { show_caption_above_media: true })',
      'const t3: Promise<true> = telegram.editEphemeralMessageMedia(1, 99, 1, { type: "document", media: "file-id" })',
      'const t4: Promise<true> = telegram.editEphemeralMessageReplyMarkup(1, 99, 1, undefined)',
      'const t5: Promise<true> = telegram.deleteEphemeralMessage(1, 99, 1)',
      '// @ts-expect-error the ephemeral id is positional on Telegram',
      'void telegram.editEphemeralMessageText(1, 99, 1, "x", { ephemeral_message_id: 3 })',
      '// @ts-expect-error ephemeral message ids are numbers',
      'void telegram.deleteEphemeralMessage(1, 99, "eph")',
      '',
      '// management helpers on Context',
      'const c1: Promise<true> = ctx.editEphemeralMessageText(99, "x", { ephemeral_message_id: 3, parse_mode: "HTML" })',
      'const c2: Promise<true> = ctx.editEphemeralMessageCaption(99, bold("x"))',
      'const c3: Promise<true> = ctx.editEphemeralMessageMedia(99, { type: "photo", media: "id", caption: bold("x") })',
      'const c4: Promise<true> = ctx.editEphemeralMessageReplyMarkup(99, undefined, { ephemeral_message_id: 3 })',
      'const c5: Promise<true> = ctx.deleteEphemeralMessage(99)',
      'const currentId: number | undefined = ctx.ephemeralMessageId',
      '// @ts-expect-error text is positional',
      'void ctx.editEphemeralMessageText(99, "x", { text: "y" })',
      '',
      '// pre-10.3 signatures keep compiling',
      'const legacyReply: Convenience.ExtraReplyMessage = { reply_parameters: { message_id: 1 } }',
      'void telegram.sendMessage(1, "hi", legacyReply)',
      'void telegram.sendPhoto(1, "photo", { caption: bold("x") })',
      'void telegram.editMessageText(1, 2, undefined, "hi")',
      'void telegram.editMessageMedia(1, 2, undefined, { type: "photo", media: "id", caption: bold("x") })',
      'void ctx.editMessageMedia({ type: "video", media: "id" })',
      'void ctx.deleteMessage()',
      '',
      'void [missingReceiver, t1, t2, t3, t4, t5, c1, c2, c3, c4, c5, currentId]',
    ].join('\n')
  )
  t.pass()
})

// Bot API 10.3: rich messages and drafts

const { useNewReplies } = require('../future')

const richMarkdown = { markdown: '*rich*' }
const richButtons = [
  { text: 'Docs', url: 'https://example.test/docs' },
  { text: 'More', callback_data: 'more', style: 'primary' },
  { text: 'App', web_app: { url: 'https://example.test/app' } },
]
const richBlocks = {
  blocks: [
    { type: 'heading', text: 'Report', size: 1 },
    { type: 'paragraph', text: ['Totals ', { type: 'bold', text: '42' }] },
    { type: 'divider' },
    { type: 'buttons', buttons: richButtons, align: 'center' },
  ],
  is_rtl: false,
}

const topicMessageUpdate = {
  update_id: 20,
  message: {
    message_id: 5,
    date: 1,
    chat: privateChat,
    from: ephemeralUser,
    text: 'question',
    is_topic_message: true,
    message_thread_id: 9,
  },
}
const businessMessageUpdate = {
  update_id: 21,
  business_message: {
    business_connection_id: 'biz-1',
    message_id: 6,
    date: 1,
    chat: privateChat,
    from: ephemeralUser,
    text: 'question',
  },
}
const groupChat = { id: -100, type: 'supergroup', title: 'Group' }
const chatJoinRequestUpdate = {
  update_id: 22,
  chat_join_request: {
    chat: groupChat,
    from: ephemeralUser,
    user_chat_id: 99,
    date: 1,
  },
}
const inlineQueryUpdate = {
  update_id: 23,
  inline_query: { id: 'iq', from: ephemeralUser, query: '', offset: '' },
}
const inlineCallbackUpdate = {
  update_id: 24,
  callback_query: {
    id: 'cbq-inline',
    from: ephemeralUser,
    chat_instance: 'instance',
    inline_message_id: 'inline-1',
    data: 'more',
  },
}

/** Return type text of an `ApiMethods` member whose args are a plain object literal */
function getMethodReturnType(source, name) {
  const pattern = new RegExp(`\\b${name}\\(args\\??: \\{`)
  const match = pattern.exec(source)
  if (!match) return ''
  const args = getBlock(source, pattern)
  const rest = source.slice(source.indexOf(args, match.index) + args.length)
  const returned = /^\)\s*:\s*([^;]*);/.exec(rest)
  return returned ? compact(returned[1]).trim() : ''
}

/** Text of a (possibly multi-line) exported type alias */
function getTypeAlias(source, name) {
  const start = source.search(new RegExp(`\\btype ${name} =`))
  if (start === -1) return ''
  const end = source.indexOf('\nexport ', start)
  return compact(source.slice(start, end === -1 ? undefined : end))
}

/** Compacted argument type text of every overload of an `ApiMethods` member */
function getMethodArgTypes(name) {
  const source = ts.createSourceFile(
    'methods.d.ts',
    readTypeFile('methods'),
    ts.ScriptTarget.Latest,
    true
  )
  const overloads = []
  const visit = (node) => {
    if (
      ts.isInterfaceDeclaration(node) &&
      node.name.text === 'MethodDeclarations'
    ) {
      for (const member of node.members) {
        const args = member.parameters?.[0]?.type
        if (member.name?.text === name && args) {
          overloads.push(compact(args.getText(source)))
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return overloads
}

async function withNewReplies(ctx, fn) {
  await useNewReplies()(ctx, async () => fn(ctx))
}

/** Telegram client with a fake fetch recording each request as `[url, kind]` */
function fetchRecordingTelegram() {
  const requests = []
  const telegram = new Telegram('123:abc', {
    fetch: async (url, init) => {
      const contentType = init?.headers?.['content-type']
      requests.push([
        String(url).replace('https://api.telegram.org/bot123:abc/', ''),
        contentType ? contentType.split(';')[0] : 'download',
        contentType === 'application/json' ? JSON.parse(init.body) : undefined,
      ])
      return {
        status: 200,
        statusText: 'OK',
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(Buffer.from('file-bytes'))
            controller.close()
          },
        }),
        json: async () => ({ ok: true, result: true }),
      }
    },
  })
  return { telegram, requests }
}

test('Telegram.sendRichMessage passes rich message arguments through unchanged', async (t) => {
  const sentMessage = { message_id: 1, rich_message: { blocks: [] } }
  const { telegram, calls } = recordingTelegram(sentMessage)
  const withBlocks = {
    chat_id: 42,
    rich_message: richBlocks,
    reply_markup: inlineMarkup,
    protect_content: true,
  }
  const withHtmlAndMedia = {
    chat_id: '@channel',
    message_thread_id: 3,
    rich_message: {
      html: '<p><img src="tg://photo?id=p1"></p>',
      media: [{ id: 'p1', media: { type: 'photo', media: 'photo-id' } }],
    },
  }
  const withMarkdown = {
    chat_id: 42,
    business_connection_id: 'biz-1',
    rich_message: richMarkdown,
    ephemeral_message_parameters: ephemeralParams,
    reply_parameters: { message_id: 7 },
  }

  t.is(await telegram.sendRichMessage(withBlocks), sentMessage)
  await telegram.sendRichMessage(withHtmlAndMedia)
  await telegram.sendRichMessage(withMarkdown)

  t.deepEqual(calls, [
    ['sendRichMessage', withBlocks],
    ['sendRichMessage', withHtmlAndMedia],
    ['sendRichMessage', withMarkdown],
  ])
  // args are forwarded as-is, not rebuilt
  t.is(calls[0][1], withBlocks)
})

test('Telegram.sendRichMessageDraft passes draft arguments through unchanged', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const first = {
    chat_id: 42,
    draft_id: 1,
    rich_message: { markdown: 'Thinking' },
    can_stop: true,
  }
  const update = {
    chat_id: 42,
    message_thread_id: 9,
    draft_id: 1,
    rich_message: richBlocks,
    can_stop: true,
    keep_on_stop: true,
  }

  t.true(await telegram.sendRichMessageDraft(first))
  await telegram.sendRichMessageDraft(update)

  t.deepEqual(calls, [
    ['sendRichMessageDraft', first],
    ['sendRichMessageDraft', update],
  ])
  t.is(calls[1][1], update)
})

test('Telegram.editMessageText edits into rich messages', async (t) => {
  const { telegram, calls } = recordingTelegram({ message_id: 12 })
  const linkPreview = { is_disabled: true }

  t.deepEqual(
    await telegram.editMessageText(42, 12, undefined, undefined, {
      rich_message: richBlocks,
      reply_markup: inlineMarkup,
      business_connection_id: 'biz-1',
    }),
    { message_id: 12 }
  )
  await telegram.editMessageText(undefined, undefined, 'inline-1', undefined, {
    rich_message: richMarkdown,
    link_preview_options: linkPreview,
  })

  t.deepEqual(calls, [
    [
      'editMessageText',
      {
        entities: undefined,
        parse_mode: undefined,
        reply_markup: inlineMarkup,
        link_preview_options: undefined,
        business_connection_id: 'biz-1',
        rich_message: richBlocks,
        chat_id: 42,
        message_id: 12,
      },
    ],
    [
      'editMessageText',
      {
        entities: undefined,
        parse_mode: undefined,
        reply_markup: undefined,
        link_preview_options: linkPreview,
        business_connection_id: undefined,
        rich_message: richMarkdown,
        inline_message_id: 'inline-1',
      },
    ],
  ])
  t.is(calls[0][1].rich_message, richBlocks)
  for (const [, payload] of calls) t.false('text' in payload)
})

test('Telegram.editEphemeralMessageText edits into rich messages', async (t) => {
  const { telegram, calls } = recordingTelegram()

  t.true(
    await telegram.editEphemeralMessageText(42, 99, 1, undefined, {
      rich_message: richBlocks,
      reply_markup: inlineMarkup,
    })
  )

  t.deepEqual(calls, [
    [
      'editEphemeralMessageText',
      {
        receiver_user_id: 99,
        chat_id: 42,
        ephemeral_message_id: 1,
        reply_markup: inlineMarkup,
        rich_message: richBlocks,
      },
    ],
  ])
  t.false('text' in calls[0][1])
})

test('text edits require exactly one of text or rich_message', (t) => {
  const { bold } = require('../format')
  const { telegram, calls } = recordingTelegram()
  const cases = [
    [
      'editMessageText',
      (extra, text) => telegram.editMessageText(42, 12, undefined, text, extra),
    ],
    [
      'editMessageText',
      (extra, text) =>
        telegram.editMessageText(undefined, undefined, 'inline-1', text, extra),
    ],
    [
      'editEphemeralMessageText',
      (extra, text) =>
        telegram.editEphemeralMessageText(42, 99, 1, text, extra),
    ],
  ]

  for (const [method, call] of cases) {
    for (const text of ['text', '', bold('text')]) {
      t.throws(() => call({ rich_message: richMarkdown }, text), {
        message: `Telegram: ${method} accepts either text or extra.rich_message, not both`,
      })
    }
    for (const extra of [undefined, {}, { rich_message: undefined }]) {
      t.throws(() => call(extra, undefined), {
        message: `Telegram: ${method} requires either text or extra.rich_message`,
      })
    }
  }
  t.deepEqual(calls, [])
})

test('Context text edit helpers forward rich messages', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const fromMessage = new Context(
    callbackUpdate(ephemeralMessage),
    telegram,
    botInfo
  )
  const fromInline = new Context(inlineCallbackUpdate, telegram, botInfo)

  await fromMessage.editMessageText(undefined, { rich_message: richBlocks })
  await fromInline.editMessageText(undefined, {
    rich_message: richMarkdown,
    reply_markup: inlineMarkup,
  })
  await fromMessage.editEphemeralMessageText(99, undefined, {
    rich_message: richBlocks,
  })
  await fromMessage.editEphemeralMessageText(99, undefined, {
    rich_message: richMarkdown,
    ephemeral_message_id: 3,
  })
  // text edits keep working through the same helpers
  await fromMessage.editMessageText('plain', { parse_mode: 'HTML' })
  await fromMessage.editEphemeralMessageText(99, 'plain')

  const untouched = {
    entities: undefined,
    parse_mode: undefined,
    reply_markup: undefined,
    link_preview_options: undefined,
    business_connection_id: undefined,
  }
  t.deepEqual(calls, [
    [
      'editMessageText',
      {
        ...untouched,
        rich_message: richBlocks,
        chat_id: 42,
        message_id: 12,
      },
    ],
    [
      'editMessageText',
      {
        ...untouched,
        reply_markup: inlineMarkup,
        rich_message: richMarkdown,
        inline_message_id: 'inline-1',
      },
    ],
    [
      'editEphemeralMessageText',
      {
        receiver_user_id: 99,
        chat_id: 42,
        ephemeral_message_id: 1,
        rich_message: richBlocks,
      },
    ],
    [
      'editEphemeralMessageText',
      {
        receiver_user_id: 99,
        chat_id: 42,
        ephemeral_message_id: 3,
        rich_message: richMarkdown,
      },
    ],
    [
      'editMessageText',
      {
        ...untouched,
        parse_mode: 'HTML',
        text: 'plain',
        chat_id: 42,
        message_id: 12,
      },
    ],
    [
      'editEphemeralMessageText',
      {
        receiver_user_id: 99,
        chat_id: 42,
        ephemeral_message_id: 1,
        text: 'plain',
      },
    ],
  ])

  // invalid combinations are rejected before reaching the API
  t.throws(
    () =>
      fromMessage.editEphemeralMessageText(99, 'text', {
        rich_message: richMarkdown,
      }),
    {
      message:
        'Telegram: editEphemeralMessageText accepts either text or extra.rich_message, not both',
    }
  )
  t.throws(() => fromMessage.editMessageText(undefined), {
    message:
      'Telegram: editMessageText requires either text or extra.rich_message',
  })
  t.is(calls.length, 6)
})

test('rich messages and rich edits serialize to the Bot API as JSON', async (t) => {
  const { telegram, requests } = fetchRecordingTelegram()

  t.true(
    await telegram.sendRichMessage({
      chat_id: 42,
      message_thread_id: undefined,
      rich_message: richBlocks,
    })
  )
  await telegram.sendRichMessageDraft({
    chat_id: 42,
    draft_id: 5,
    rich_message: richMarkdown,
    can_stop: true,
  })
  await telegram.editMessageText(42, 12, undefined, undefined, {
    rich_message: richBlocks,
  })
  await telegram.editEphemeralMessageText(42, 99, 1, undefined, {
    rich_message: richMarkdown,
  })

  // undefined fields are dropped from the wire payload; URL and web app buttons stay plain JSON
  t.deepEqual(requests, [
    [
      'sendRichMessage',
      'application/json',
      { chat_id: 42, rich_message: richBlocks },
    ],
    [
      'sendRichMessageDraft',
      'application/json',
      {
        chat_id: 42,
        draft_id: 5,
        rich_message: richMarkdown,
        can_stop: true,
      },
    ],
    [
      'editMessageText',
      'application/json',
      { chat_id: 42, message_id: 12, rich_message: richBlocks },
    ],
    [
      'editEphemeralMessageText',
      'application/json',
      {
        receiver_user_id: 99,
        chat_id: 42,
        ephemeral_message_id: 1,
        rich_message: richMarkdown,
      },
    ],
  ])
})

test('Bot API objects with a url are not mistaken for URL files', async (t) => {
  const { telegram, requests } = fetchRecordingTelegram()
  const link = { type: 'link', url: 'https://example.test/link' }
  const webApp = { url: 'https://example.test/app' }

  await telegram.sendRichMessage({ chat_id: 1, rich_message: richBlocks })
  await telegram.sendPoll(1, 'Choose', [{ text: 'Link', media: link }])
  await telegram.sendChatJoinRequestWebApp({
    chat_join_request_query_id: 'q',
    web_app_url: webApp.url,
  })
  await telegram.setChatMenuButton({
    chatId: 1,
    menuButton: { type: 'web_app', text: 'App', web_app: webApp },
  })
  await telegram.sendMessage(1, 'hi', {
    entities: [
      {
        type: 'text_link',
        offset: 0,
        length: 2,
        url: 'https://example.test',
      },
    ],
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Docs', url: 'https://example.test/docs' },
          {
            text: 'Login',
            login_url: { url: 'https://example.test/login' },
          },
        ],
      ],
    },
  })

  t.deepEqual(
    requests.map(([method, kind]) => [method, kind]),
    [
      ['sendRichMessage', 'application/json'],
      ['sendPoll', 'application/json'],
      ['sendChatJoinRequestWebApp', 'application/json'],
      ['setChatMenuButton', 'application/json'],
      ['sendMessage', 'application/json'],
    ]
  )
  t.deepEqual(requests[1][2].options[0].media, link)
  t.is(requests[2][2].web_app_url, webApp.url)
})

test('URL files are still downloaded and uploaded', async (t) => {
  const { telegram, requests } = fetchRecordingTelegram()

  await telegram.sendPhoto(1, { url: 'https://example.test/plain.png' })
  await telegram.sendPhoto(
    1,
    Input.fromURLStream('https://example.test/stream.png', 'stream.png')
  )
  await telegram.sendMediaGroup(1, [
    { type: 'photo', media: { url: 'https://example.test/nested.png' } },
    { type: 'photo', media: 'photo-id' },
  ])
  await telegram.sendRichMessage({
    chat_id: 1,
    rich_message: {
      markdown: '![x](tg://photo?id=x)',
      media: [
        {
          id: 'x',
          media: {
            type: 'photo',
            media: Input.fromURLStream('https://example.test/rich.png'),
          },
        },
      ],
    },
  })

  t.deepEqual(
    requests.map(([method, kind]) => [method, kind]),
    [
      ['https://example.test/plain.png', 'download'],
      ['sendPhoto', 'multipart/form-data'],
      ['https://example.test/stream.png', 'download'],
      ['sendPhoto', 'multipart/form-data'],
      ['https://example.test/nested.png', 'download'],
      ['sendMediaGroup', 'multipart/form-data'],
      ['https://example.test/rich.png', 'download'],
      ['sendRichMessage', 'multipart/form-data'],
    ]
  )
})

test('rich message media uploads are sent as multipart attachments', async (t) => {
  const sent = await captureBotApiRequest((telegram) =>
    telegram.sendRichMessage({
      chat_id: 42,
      rich_message: {
        markdown: '![chart](tg://photo?id=chart)',
        media: [
          {
            id: 'chart',
            media: {
              type: 'photo',
              media: Input.fromBuffer(Buffer.from('chart-bytes'), 'chart.png'),
            },
          },
        ],
      },
      ephemeral_message_parameters: ephemeralParams,
    })
  )

  t.true(sent.result)
  t.is(sent.url, '/bot123:abc/sendRichMessage')
  t.regex(sent.headers['content-type'], /^multipart\/form-data/)
  t.is(getMultipartField(sent.body, 'chat_id'), '42')
  t.deepEqual(
    JSON.parse(getMultipartField(sent.body, 'ephemeral_message_parameters')),
    ephemeralParams
  )
  const richMessage = JSON.parse(getMultipartField(sent.body, 'rich_message'))
  t.is(richMessage.markdown, '![chart](tg://photo?id=chart)')
  t.is(richMessage.media[0].id, 'chart')
  t.is(richMessage.media[0].media.type, 'photo')
  const attachment = /^attach:\/\/([0-9a-f]+)$/.exec(
    richMessage.media[0].media.media
  )
  t.truthy(attachment)
  t.true(sent.body.includes(`name="${attachment[1]}"`))
  t.true(sent.body.includes('filename="chart.png"'))
  t.true(sent.body.includes('chart-bytes'))

  const edited = await captureBotApiRequest((telegram) =>
    telegram.editMessageText(42, 12, undefined, undefined, {
      rich_message: {
        blocks: [
          {
            type: 'photo',
            photo: {
              type: 'photo',
              media: Input.fromBuffer(Buffer.from('edit-bytes'), 'edit.png'),
            },
          },
          { type: 'buttons', buttons: richButtons },
        ],
      },
    })
  )
  t.is(edited.url, '/bot123:abc/editMessageText')
  t.regex(edited.headers['content-type'], /^multipart\/form-data/)
  t.is(getMultipartField(edited.body, 'message_id'), '12')
  const editedRich = JSON.parse(getMultipartField(edited.body, 'rich_message'))
  t.regex(editedRich.blocks[0].photo.media, /^attach:\/\/[0-9a-f]+$/)
  // buttons with a url survive the multipart packing untouched
  t.deepEqual(editedRich.blocks[1].buttons, richButtons)
  t.true(edited.body.includes('edit-bytes'))
  t.is(getMultipartField(edited.body, 'text'), null)
})

test('Context rich message helpers inherit chat, thread and business connection', async (t) => {
  const cases = [
    [
      'plain message',
      plainMessageUpdate,
      {
        chat_id: 42,
        message_thread_id: undefined,
        business_connection_id: undefined,
      },
    ],
    [
      'topic message',
      topicMessageUpdate,
      {
        chat_id: 42,
        message_thread_id: 9,
        business_connection_id: undefined,
      },
    ],
    [
      'business message',
      businessMessageUpdate,
      {
        chat_id: 42,
        message_thread_id: undefined,
        business_connection_id: 'biz-1',
      },
    ],
    [
      'callback query',
      callbackUpdate(ephemeralMessage),
      {
        chat_id: 42,
        message_thread_id: undefined,
        business_connection_id: undefined,
      },
    ],
    [
      'chat join request',
      chatJoinRequestUpdate,
      {
        chat_id: -100,
        message_thread_id: undefined,
        business_connection_id: undefined,
      },
    ],
  ]

  for (const [name, update, defaults] of cases) {
    const { telegram, calls } = recordingTelegram()
    const ctx = new Context(update, telegram, botInfo)

    await ctx.sendRichMessage(richBlocks)
    await ctx.replyWithRichMessage(richMarkdown, {
      disable_notification: true,
    })

    t.deepEqual(
      calls,
      [
        ['sendRichMessage', { ...defaults, rich_message: richBlocks }],
        [
          'sendRichMessage',
          {
            ...defaults,
            disable_notification: true,
            rich_message: richMarkdown,
          },
        ],
      ],
      name
    )
    t.is(calls[0][1].rich_message, richBlocks, name)
  }
})

test('Context rich message extras override defaults but not the rich message', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const ctx = new Context(topicMessageUpdate, telegram, botInfo)

  await ctx.replyWithRichMessage(richMarkdown, {
    message_thread_id: 10,
    business_connection_id: 'biz-override',
    ephemeral_message_parameters: ephemeralParams,
    reply_parameters: { message_id: 5 },
    reply_markup: inlineMarkup,
    // not allowed by the types; the positional argument must still win for JS callers
    rich_message: { markdown: 'ignored' },
  })

  t.deepEqual(calls, [
    [
      'sendRichMessage',
      {
        chat_id: 42,
        message_thread_id: 10,
        business_connection_id: 'biz-override',
        ephemeral_message_parameters: ephemeralParams,
        reply_parameters: { message_id: 5 },
        reply_markup: inlineMarkup,
        rich_message: richMarkdown,
      },
    ],
  ])
})

test('Context.sendRichMessageDraft streams drafts to the current chat', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const topic = new Context(topicMessageUpdate, telegram, botInfo)
  const business = new Context(businessMessageUpdate, telegram, botInfo)

  t.true(await topic.sendRichMessageDraft(7, { markdown: 'Thinking' }))
  await topic.sendRichMessageDraft(7, richBlocks, {
    can_stop: true,
    keep_on_stop: true,
    message_thread_id: 11,
    // not allowed by the types; positional arguments must still win for JS callers
    draft_id: 99,
    rich_message: { markdown: 'ignored' },
  })
  await business.sendRichMessageDraft(8, richMarkdown)

  t.deepEqual(calls, [
    [
      'sendRichMessageDraft',
      {
        chat_id: 42,
        message_thread_id: 9,
        draft_id: 7,
        rich_message: { markdown: 'Thinking' },
      },
    ],
    [
      'sendRichMessageDraft',
      {
        chat_id: 42,
        message_thread_id: 11,
        can_stop: true,
        keep_on_stop: true,
        draft_id: 7,
        rich_message: richBlocks,
      },
    ],
    [
      'sendRichMessageDraft',
      {
        chat_id: 42,
        message_thread_id: undefined,
        draft_id: 8,
        rich_message: richMarkdown,
      },
    ],
  ])
  // sendRichMessageDraft has no business_connection_id parameter
  t.false('business_connection_id' in calls[2][1])
})

test('Context rich message helpers throw without a chat and make no API call', (t) => {
  const { telegram, calls } = recordingTelegram()
  const ctx = new Context(inlineQueryUpdate, telegram, botInfo)

  for (const [call, method] of [
    [() => ctx.sendRichMessage(richMarkdown), 'sendRichMessage'],
    // replyWithRichMessage delegates to sendRichMessage, like reply does to sendMessage
    [() => ctx.replyWithRichMessage(richMarkdown), 'sendRichMessage'],
    [() => ctx.sendRichMessageDraft(1, richMarkdown), 'sendRichMessageDraft'],
  ]) {
    t.throws(call, {
      instanceOf: TypeError,
      message: `Telegraf: "${method}" isn't available for "inline_query"`,
    })
  }
  t.deepEqual(calls, [])
})

test('useNewReplies makes replyWithRichMessage reply to the incoming message', async (t) => {
  const cases = [
    ['plain message', plainMessageUpdate, 13],
    ['topic message', topicMessageUpdate, 5],
    ['business message', businessMessageUpdate, 6],
    ['callback query', callbackUpdate(ephemeralMessage), 12],
  ]

  for (const [name, update, messageId] of cases) {
    const { telegram, calls } = recordingTelegram()
    const ctx = new Context(update, telegram, botInfo)

    await ctx.sendRichMessage(richMarkdown)
    await withNewReplies(ctx, (replyCtx) =>
      replyCtx.replyWithRichMessage(richMarkdown)
    )

    const [[, plain], [method, reply]] = calls
    t.is(method, 'sendRichMessage', name)
    // same chat, thread and business connection as the regular helper, plus reply_parameters
    t.deepEqual(
      reply,
      { ...plain, reply_parameters: { message_id: messageId } },
      name
    )
  }
})

test('useNewReplies replyWithRichMessage honours reply options and non-message updates', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const topic = new Context(topicMessageUpdate, telegram, botInfo)
  const joinRequest = new Context(chatJoinRequestUpdate, telegram, botInfo)
  const inaccessible = new Context(
    callbackUpdate({ chat: privateChat, message_id: 12, date: 0 }),
    telegram,
    botInfo
  )

  await withNewReplies(topic, async (ctx) => {
    await ctx.replyWithRichMessage(richBlocks, {
      reply_parameters: { message_id: 3, quote: 'question' },
      message_thread_id: 10,
      business_connection_id: 'biz-override',
    })
    // sendRichMessage is not affected by useNewReplies
    await ctx.sendRichMessage(richMarkdown)
  })
  // nothing to reply to: sends a normal message
  await withNewReplies(joinRequest, (ctx) =>
    ctx.replyWithRichMessage(richMarkdown)
  )
  // inaccessible messages can still be replied to by id, but carry no thread
  await withNewReplies(inaccessible, (ctx) =>
    ctx.replyWithRichMessage(richMarkdown)
  )

  t.deepEqual(calls, [
    [
      'sendRichMessage',
      {
        chat_id: 42,
        message_thread_id: 10,
        business_connection_id: 'biz-override',
        reply_parameters: { message_id: 3, quote: 'question' },
        rich_message: richBlocks,
      },
    ],
    [
      'sendRichMessage',
      {
        chat_id: 42,
        message_thread_id: 9,
        business_connection_id: undefined,
        rich_message: richMarkdown,
      },
    ],
    [
      'sendRichMessage',
      {
        chat_id: -100,
        message_thread_id: undefined,
        business_connection_id: undefined,
        rich_message: richMarkdown,
      },
    ],
    [
      'sendRichMessage',
      {
        chat_id: 42,
        message_thread_id: undefined,
        business_connection_id: undefined,
        reply_parameters: { message_id: 12 },
        rich_message: richMarkdown,
      },
    ],
  ])

  const noChat = new Context(inlineQueryUpdate, telegram, botInfo)
  await withNewReplies(noChat, (ctx) => {
    t.throws(() => ctx.replyWithRichMessage(richMarkdown), {
      instanceOf: TypeError,
      message: `Telegraf: "replyWithRichMessage" isn't available for "inline_query"`,
    })
  })
  t.is(calls.length, 4)
})

test('useNewReplies preserves targets for every reply helper', async (t) => {
  const helpers = {
    reply: ['text'],
    replyWithAnimation: ['file'],
    replyWithAudio: ['file'],
    replyWithContact: ['+123', 'Name'],
    replyWithDice: [],
    replyWithDocument: ['file'],
    replyWithGame: ['game'],
    replyWithHTML: ['<b>text</b>'],
    replyWithInvoice: [
      {
        title: 'Item',
        description: 'Item',
        payload: 'item',
        currency: 'XTR',
        prices: [{ label: 'Item', amount: 1 }],
      },
    ],
    replyWithLocation: [1, 2],
    replyWithMarkdown: ['*text*'],
    replyWithMarkdownV2: ['*text*'],
    replyWithMediaGroup: [[{ type: 'photo', media: 'file' }]],
    replyWithPhoto: ['file'],
    replyWithPoll: ['Question', ['A', 'B']],
    replyWithRichMessage: [richMarkdown],
    replyWithLivePhoto: ['photo', 'video'],
    replyWithQuiz: ['Question', ['A', 'B']],
    replyWithSticker: ['file'],
    replyWithVenue: [1, 2, 'Place', 'Address'],
    replyWithVideo: ['file'],
    replyWithVideoNote: ['file'],
    replyWithVoice: ['file'],
  }
  const publicHelpers = Object.getOwnPropertyNames(Context.prototype).filter(
    (name) => name.startsWith('reply') && name !== 'replyWithChatAction'
  )
  t.deepEqual(Object.keys(helpers).sort(), publicHelpers.sort())

  for (const update of [
    topicMessageUpdate,
    businessMessageUpdate,
    chatJoinRequestUpdate,
  ]) {
    for (const [helper, args] of Object.entries(helpers)) {
      const { telegram, calls } = recordingTelegram()
      const ctx = new Context(update, telegram, botInfo)
      await ctx[helper](...args)
      await withNewReplies(ctx, (replyCtx) => replyCtx[helper](...args))
      const [plain, reply] = calls
      t.is(reply[0], plain[0], helper)
      t.deepEqual(
        reply[1],
        {
          ...plain[1],
          ...(ctx.msgId ? { reply_parameters: { message_id: ctx.msgId } } : {}),
        },
        helper
      )

      const extra = {
        message_thread_id: 77,
        reply_parameters: { message_id: 88, quote: 'Quote' },
        ...(helper === 'replyWithInvoice'
          ? {}
          : { business_connection_id: 'override' }),
      }
      await ctx[helper](...args, extra)
      t.is(calls[2][1].message_thread_id, 77, helper)
      t.deepEqual(calls[2][1].reply_parameters, extra.reply_parameters, helper)
      if (helper === 'replyWithInvoice') {
        t.false('business_connection_id' in calls[2][1])
      } else {
        t.is(calls[2][1].business_connection_id, 'override', helper)
      }
    }
  }
})

test('useNewReplies overrides every Context reply helper', async (t) => {
  const replyHelpers = Object.getOwnPropertyNames(Context.prototype).filter(
    (name) =>
      name.startsWith('reply') &&
      typeof Object.getOwnPropertyDescriptor(Context.prototype, name).value ===
        'function'
  )
  const ctx = new Context(
    plainMessageUpdate,
    recordingTelegram().telegram,
    botInfo
  )

  await withNewReplies(ctx, () => {})

  t.true(replyHelpers.includes('replyWithRichMessage'))
  // fails when a reply helper is added to Context without wiring it into useNewReplies
  t.deepEqual(
    replyHelpers.filter((name) => ctx[name] === Context.prototype[name]),
    []
  )
})

test('getChatAdministrators forwards return_bots', async (t) => {
  const { telegram, calls } = recordingTelegram([])
  const ctx = new Context(plainMessageUpdate, telegram, botInfo)

  await telegram.getChatAdministrators(42)
  await telegram.getChatAdministrators('@channel', { return_bots: true })
  await ctx.getChatAdministrators({ return_bots: false })

  t.deepEqual(calls, [
    ['getChatAdministrators', { chat_id: 42 }],
    ['getChatAdministrators', { chat_id: '@channel', return_bots: true }],
    ['getChatAdministrators', { chat_id: 42, return_bots: false }],
  ])
})

test('Bot API 10.3 rich message fields are typed', (t) => {
  const files = {
    markup: readTypeFile('markup'),
    message: readTypeFile('message'),
    methods: readTypeFile('methods'),
  }
  const send = getMethodArgs(files.methods, 'sendRichMessage')
  const draft = getMethodArgs(files.methods, 'sendRichMessageDraft')
  const inputRichMessage = getTypeAlias(
    files.methods,
    'InputRichMessage<F, Draft extends boolean = false>'
  )
  const textVariant = 'text: string; rich_message?: undefined;'
  const richVariant = 'text?: undefined; rich_message: InputRichMessage<F>;'
  const editMessageText = getMethodArgTypes('editMessageText')
  const editEphemeralMessageText = getMethodArgTypes('editEphemeralMessageText')
  const checks = {
    'sendRichMessage.chat_id': hasField(send, 'chat_id', 'number | string'),
    'sendRichMessage.rich_message': hasField(
      send,
      'rich_message',
      'InputRichMessage<F>'
    ),
    'sendRichMessage.business_connection_id': hasOptionalField(
      send,
      'business_connection_id',
      'string'
    ),
    'sendRichMessage.message_thread_id': hasOptionalField(
      send,
      'message_thread_id',
      'number'
    ),
    'sendRichMessage.ephemeral_message_parameters': hasOptionalField(
      send,
      'ephemeral_message_parameters',
      'EphemeralMessageParameters'
    ),
    'sendRichMessage returns RichMessageMessage':
      getMethodReturnType(files.methods, 'sendRichMessage') ===
      'Message.RichMessageMessage & Message.BusinessSentMessage',
    'sendRichMessageDraft.chat_id': hasField(draft, 'chat_id', 'number'),
    'sendRichMessageDraft.draft_id': hasField(draft, 'draft_id', 'number'),
    'sendRichMessageDraft.rich_message': hasField(
      draft,
      'rich_message',
      'InputRichMessageDraft<never>'
    ),
    'sendRichMessageDraft.can_stop/keep_on_stop':
      hasOptionalField(draft, 'can_stop', 'boolean') &&
      hasOptionalField(draft, 'keep_on_stop', 'boolean'),
    'sendRichMessageDraft.message_thread_id': hasOptionalField(
      draft,
      'message_thread_id',
      'number'
    ),
    'sendRichMessageDraft has no business_connection_id': !hasAnyField(
      draft,
      'business_connection_id'
    ),
    'sendRichMessageDraft returns true':
      getMethodReturnType(files.methods, 'sendRichMessageDraft') === 'true',
    'editMessageText text or rich_message (chat and inline overloads)':
      editMessageText.length === 2 &&
      editMessageText.every((args) => args.includes(textVariant)) &&
      editMessageText[0].includes(richVariant) &&
      editMessageText[1].includes(
        'text?: undefined; rich_message: InputRichMessage<never>;'
      ),
    'editEphemeralMessageText text or rich_message':
      editEphemeralMessageText.length === 1 &&
      editEphemeralMessageText[0].includes(textVariant) &&
      editEphemeralMessageText[0].includes(richVariant),
    'InputRichMessage content variants': [
      'blocks: ReadonlyArray<InputRichBlock<F, Draft>>;',
      'html: string;',
      'markdown: string;',
      'media?: ReadonlyArray<InputRichMessageMedia<F>>;',
    ].every((member) => inputRichMessage.includes(member)),
    'InputRichBlock includes buttons': hasTypeMember(
      files.methods,
      'InputRichBlock<F, Draft extends boolean = false>',
      'RichBlockButtons'
    ),
    'RichBlockButtons.buttons': hasField(
      getInterface(files.message, 'RichBlockButtons'),
      'buttons',
      'RichMessageButton[]'
    ),
    RichMessageButton: [
      'RichMessageButton.UrlButton',
      'RichMessageButton.CallbackButton',
      'RichMessageButton.WebAppButton',
    ].every((member) =>
      hasTypeMember(files.markup, 'RichMessageButton', member)
    ),
    'Message.rich_message': hasField(
      getInterface(files.message, 'RichMessageMessage'),
      'rich_message',
      'RichMessage'
    ),
    'RichMessage.blocks': hasField(
      getInterface(files.message, 'RichMessage'),
      'blocks',
      'RichBlock[]'
    ),
    'getChatAdministrators.return_bots': hasOptionalField(
      getMethodArgs(files.methods, 'getChatAdministrators'),
      'return_bots',
      'boolean'
    ),
  }
  const missing = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name)
  t.deepEqual(missing, [])
})

// Telegram entry points for every method whose Bot API args accept rich_message
const telegramRichMessageCalls = {
  editEphemeralMessageText: (tg, rich_message) =>
    tg.editEphemeralMessageText(42, 99, 1, undefined, { rich_message }),
  editMessageText: (tg, rich_message) =>
    tg.editMessageText(42, 12, undefined, undefined, { rich_message }),
  sendRichMessage: (tg, rich_message) =>
    tg.sendRichMessage({ chat_id: 42, rich_message }),
  sendRichMessageDraft: (tg, rich_message) =>
    tg.sendRichMessageDraft({ chat_id: 42, draft_id: 1, rich_message }),
}
// Context helpers reaching those methods, keyed by helper name
const contextRichMessageCalls = {
  editEphemeralMessageText: (ctx, rich_message) =>
    ctx.editEphemeralMessageText(99, undefined, { rich_message }),
  editMessageText: (ctx, rich_message) =>
    ctx.editMessageText(undefined, { rich_message }),
  replyWithRichMessage: (ctx, rich_message) =>
    ctx.replyWithRichMessage(rich_message),
  sendRichMessage: (ctx, rich_message) => ctx.sendRichMessage(rich_message),
  sendRichMessageDraft: (ctx, rich_message) =>
    ctx.sendRichMessageDraft(1, rich_message),
}

test('rich_message coverage matches the Bot API types', async (t) => {
  const typed = readMethodsAcceptingField('rich_message')

  // fails when the types add or drop rich_message support on a method
  t.deepEqual(Object.keys(telegramRichMessageCalls).sort(), typed)

  for (const [method, call] of Object.entries(telegramRichMessageCalls)) {
    const { telegram, calls } = recordingTelegram()
    await call(telegram, richBlocks)
    t.deepEqual(
      calls.map(([name]) => name),
      [method]
    )
    t.is(calls[0][1].rich_message, richBlocks, method)
    t.false('text' in calls[0][1], method)
  }

  const reached = new Set()
  for (const [helper, call] of Object.entries(contextRichMessageCalls)) {
    const { telegram, calls } = recordingTelegram()
    const ctx = new Context(callbackUpdate(ephemeralMessage), telegram, botInfo)
    await call(ctx, richBlocks)
    t.is(calls.length, 1, helper)
    t.is(calls[0][1].rich_message, richBlocks, helper)
    reached.add(calls[0][0])
  }
  // every rich_message method is reachable from Context
  t.deepEqual([...reached].sort(), typed)
})

test('thinking blocks are supported only by draft helpers', async (t) => {
  const richDraft = {
    blocks: [
      {
        type: 'details',
        summary: 'Progress',
        blocks: [{ type: 'thinking', text: 'Working' }],
      },
    ],
  }
  const { telegram, calls } = recordingTelegram()
  const ctx = new Context(callbackUpdate(ephemeralMessage), telegram, botInfo)
  t.true(await ctx.sendRichMessageDraft(7, richDraft))
  t.is(calls[0][0], 'sendRichMessageDraft')
  t.is(calls[0][1].draft_id, 7)
  t.is(calls[0][1].rich_message, richDraft)

  await compileTypeScript(
    'thinking-draft-types.ts',
    [
      `import { Context, Telegram } from '${packageRoot}'`,
      `import type { InputRichBlockDraft, InputRichMessageDraft } from '${packageRoot}/types'`,
      'declare const ctx: Context',
      'declare const telegram: Telegram',
      'const block: InputRichBlockDraft = { type: "thinking", text: "Working" }',
      'const direct: InputRichMessageDraft = { blocks: [block] }',
      `const nested: InputRichMessageDraft = ${JSON.stringify(richDraft)}`,
      'void ctx.sendRichMessageDraft(1, direct)',
      'void ctx.sendRichMessageDraft(1, nested)',
      'void telegram.sendRichMessageDraft({ chat_id: 1, draft_id: 1, rich_message: nested })',
      '// @ts-expect-error thinking is not valid in an ordinary message',
      'void ctx.sendRichMessage(direct)',
      '// @ts-expect-error nested thinking must not bypass the restriction',
      'void ctx.replyWithRichMessage(nested)',
      '// @ts-expect-error ordinary sends cannot contain draft blocks',
      'void telegram.sendRichMessage({ chat_id: 1, rich_message: nested })',
      '// @ts-expect-error edits cannot contain draft blocks',
      'void ctx.editMessageText(undefined, { rich_message: nested })',
    ].join('\n')
  )
})

test('rich message upload types distinguish chat edits, inline edits and drafts', async (t) => {
  await compileTypeScript(
    'rich-upload-types.ts',
    [
      `import { Context, Input, Telegraf, Telegram } from '${packageRoot}'`,
      `import type { Convenience, InputRichBlockDraft, InputRichMessageDraft, Opts, Update } from '${packageRoot}/types'`,
      'declare const telegram: Telegram',
      'declare const ctx: Context',
      'declare const chat: Context<Update.MessageUpdate>',
      'declare const inline: Context<Update.ChosenInlineResultUpdate>',
      'declare const callback: Context<Update.CallbackQueryUpdate>',
      'declare const inlineId: string | undefined',
      'const file = Input.fromBuffer(Buffer.from("image"))',
      'const url = Input.fromURLStream("https://example.test/image.png")',
      'const uploaded = { blocks: [{ type: "photo", photo: { type: "photo", media: file } }] } as const',
      'const media = { markdown: "![image](tg://photo?id=image)", media: [{ id: "image", media: { type: "photo", media: file } }] } as const',
      'const remote = { blocks: [{ type: "photo", photo: { type: "photo", media: url } }] } as const',
      'const cached = { blocks: [{ type: "photo", photo: { type: "photo", media: "file-id" } }] } as const',
      'void telegram.editMessageText(1, 2, undefined, undefined, { rich_message: uploaded })',
      'void telegram.editMessageText(1, 2, undefined, undefined, { rich_message: media })',
      'void telegram.editMessageText(1, 2, undefined, undefined, { rich_message: remote })',
      'void chat.editMessageText(undefined, { rich_message: uploaded })',
      'const extra = { rich_message: uploaded } satisfies Convenience.ExtraEditMessageText',
      'void chat.editMessageText(undefined, extra)',
      'const bot = new Telegraf("test-token")',
      'bot.on("message", ctx => ctx.editMessageText(undefined, { rich_message: uploaded }))',
      'bot.action("edit", ctx => {',
      '  // @ts-expect-error Inline callback targets must not accept uploads',
      '  return ctx.editMessageText(undefined, { rich_message: uploaded })',
      '})',
      'void ctx.sendRichMessage(uploaded)',
      'void ctx.editEphemeralMessageText(99, undefined, { rich_message: uploaded, ephemeral_message_id: 1 })',
      'void telegram.editMessageText(undefined, undefined, "inline", undefined, { rich_message: cached })',
      'void telegram.editMessageText(1, 2, inlineId, undefined, { rich_message: cached })',
      'void inline.editMessageText(undefined, { rich_message: cached })',
      'void callback.editMessageText(undefined, { rich_message: cached })',
      'void ctx.editMessageText(undefined, { rich_message: cached })',
      'void ctx.sendRichMessageDraft(1, cached)',
      'void telegram.sendRichMessageDraft({ chat_id: 1, draft_id: 1, rich_message: cached })',
      '// @ts-expect-error Inline edits cannot upload a block',
      'void telegram.editMessageText(undefined, undefined, "inline", undefined, { rich_message: uploaded })',
      '// @ts-expect-error Inline edits cannot upload explicit media',
      'void telegram.editMessageText(undefined, undefined, "inline", undefined, { rich_message: media })',
      '// @ts-expect-error URL InputFile objects are uploads too',
      'void telegram.editMessageText(undefined, undefined, "inline", undefined, { rich_message: remote })',
      '// @ts-expect-error An inline target wins even when chat IDs are supplied',
      'void telegram.editMessageText(1, 2, "inline", undefined, { rich_message: uploaded })',
      '// @ts-expect-error A possibly inline target must not accept uploads',
      'void telegram.editMessageText(1, 2, inlineId, undefined, { rich_message: uploaded })',
      '// @ts-expect-error An inline Context cannot upload',
      'void inline.editMessageText(undefined, { rich_message: uploaded })',
      '// @ts-expect-error Callback queries may originate from inline messages',
      'void callback.editMessageText(undefined, { rich_message: uploaded })',
      '// @ts-expect-error An un-narrowed Context may refer to an inline message',
      'void ctx.editMessageText(undefined, { rich_message: uploaded })',
      '// @ts-expect-error Draft helpers cannot upload a block',
      'void ctx.sendRichMessageDraft(1, uploaded)',
      '// @ts-expect-error Draft helpers cannot upload explicit media',
      'void ctx.sendRichMessageDraft(1, media)',
      '// @ts-expect-error Draft API calls cannot upload',
      'void telegram.sendRichMessageDraft({ chat_id: 1, draft_id: 1, rich_message: uploaded })',
      '// @ts-expect-error Draft block aliases cannot upload',
      'const block: InputRichBlockDraft = uploaded.blocks[0]',
      '// @ts-expect-error Draft message aliases cannot upload',
      'const draft: InputRichMessageDraft = media',
      '// @ts-expect-error Low-level callApi must preserve the draft restriction',
      'void telegram.callApi("sendRichMessageDraft", { chat_id: 1, draft_id: 1, rich_message: media })',
      '// @ts-expect-error Opts must preserve the inline restriction',
      'const opts: Opts<"editMessageText"> = { inline_message_id: "inline", rich_message: uploaded }',
      'void [block, draft, opts]',
    ].join('\n')
  )
  t.pass()
})

test('rich message APIs are typed for Telegram and Context', async (t) => {
  await compileTypeScript(
    'rich-message-types.ts',
    [
      `import { Context, Input, Telegram } from '${packageRoot}'`,
      `import type { Convenience, InputRichBlock, InputRichMessage, InputRichMessageContent, Message, RichMessage, RichMessageButton, Update } from '${packageRoot}/types'`,
      '',
      'declare const ctx: Context',
      'declare const telegram: Telegram',
      '',
      'const buttons: RichMessageButton[] = [',
      '    { text: "Docs", url: "https://example.test" },',
      '    { text: "More", callback_data: "more", style: "primary" },',
      '    { text: "App", web_app: { url: "https://example.test/app" } },',
      ']',
      'const blocks: InputRichBlock[] = [',
      '    { type: "heading", text: "Report", size: 1 },',
      '    { type: "paragraph", text: ["Totals ", { type: "bold", text: "42" }] },',
      '    { type: "divider" },',
      '    { type: "buttons", buttons, align: "center" },',
      '    { type: "photo", photo: { type: "photo", media: Input.fromBuffer(Buffer.from("x"), "x.png") } },',
      ']',
      'const rich: InputRichMessage = { blocks }',
      'const withMedia: InputRichMessage = {',
      '    markdown: "![chart](tg://photo?id=chart)",',
      '    media: [{ id: "chart", media: { type: "photo", media: Input.fromBuffer(Buffer.from("x")) } }],',
      '}',
      'const cached: InputRichMessageContent["rich_message"] = { blocks: [{ type: "photo", photo: { type: "photo", media: "file-id" } }] }',
      'declare const chat: Context<Update.MessageUpdate>',
      'const extra: Convenience.ExtraRichMessage = { protect_content: true, ephemeral_message_parameters: { receiver_user_id: 1 } }',
      'const draftExtra: Convenience.ExtraRichMessageDraft = { can_stop: true, keep_on_stop: true }',
      '',
      '// sending',
      'const sent: Promise<Message.RichMessageMessage & Message.BusinessSentMessage> = ctx.replyWithRichMessage(rich, extra)',
      'const sent2 = ctx.sendRichMessage(withMedia, { reply_markup: { inline_keyboard: [] } })',
      'const draft: Promise<true> = ctx.sendRichMessageDraft(1, { markdown: "partial" }, draftExtra)',
      'async function readBack() {',
      '    const content: RichMessage = (await sent2).rich_message',
      '    return content.blocks',
      '}',
      'const direct: Promise<Message.RichMessageMessage & Message.BusinessSentMessage> = telegram.sendRichMessage({ chat_id: "@channel", rich_message: { html: "<b>hi</b>" } })',
      'const directDraft: Promise<true> = telegram.sendRichMessageDraft({ chat_id: 1, draft_id: 2, rich_message: cached })',
      '',
      '// editing into rich messages',
      'void telegram.editMessageText(1, 2, undefined, undefined, { rich_message: rich, reply_markup: { inline_keyboard: [] } })',
      'void telegram.editMessageText(undefined, undefined, "inline", undefined, { rich_message: cached })',
      'void telegram.editEphemeralMessageText(1, 99, 1, undefined, { rich_message: rich })',
      'void ctx.editMessageText(undefined, { rich_message: cached })',
      'void chat.editMessageText(undefined, { rich_message: rich })',
      'void ctx.editEphemeralMessageText(99, undefined, { rich_message: rich, ephemeral_message_id: 1 })',
      '',
      '// text edits keep their signatures',
      'void telegram.editMessageText(1, 2, undefined, "hi", { parse_mode: "HTML" })',
      'void telegram.editEphemeralMessageText(1, 99, 1, "hi")',
      'void ctx.editMessageText("hi")',
      'void ctx.editEphemeralMessageText(99, "hi", { ephemeral_message_id: 1 })',
      '',
      '// return_bots',
      'void telegram.getChatAdministrators(1, { return_bots: true })',
      'void ctx.getChatAdministrators({ return_bots: true })',
      '',
      '// @ts-expect-error rich_message needs blocks, html or markdown',
      'void ctx.replyWithRichMessage({ is_rtl: true })',
      '// @ts-expect-error blocks and markdown are mutually exclusive',
      'void ctx.replyWithRichMessage({ blocks: [], markdown: "x" })',
      '// @ts-expect-error unknown block type',
      'void ctx.replyWithRichMessage({ blocks: [{ type: "not-a-block" }] })',
      '// @ts-expect-error rich_message is positional on Context',
      'void ctx.replyWithRichMessage(rich, { rich_message: rich })',
      '// @ts-expect-error draft_id is positional on Context',
      'void ctx.sendRichMessageDraft(1, cached, { draft_id: 2 })',
      '// @ts-expect-error drafts have no business connection',
      'void ctx.sendRichMessageDraft(1, cached, { business_connection_id: "biz" })',
      '// @ts-expect-error RichMessageButton is not any',
      'const notAButton: RichMessageButton = { nope: true }',
      '// @ts-expect-error drafts target private chats by numeric id',
      'void telegram.sendRichMessageDraft({ chat_id: "@channel", draft_id: 1, rich_message: cached })',
      '// @ts-expect-error sendRichMessage requires rich_message',
      'void telegram.sendRichMessage({ chat_id: 1 })',
      '// @ts-expect-error text and rich_message are mutually exclusive',
      'void ctx.editMessageText("hi", { rich_message: rich })',
      '// @ts-expect-error text and rich_message are mutually exclusive',
      'void telegram.editEphemeralMessageText(1, 99, 1, "hi", { rich_message: rich })',
      '// @ts-expect-error one of text or rich_message is required',
      'void ctx.editMessageText(undefined)',
      '// @ts-expect-error one of text or rich_message is required',
      'void telegram.editEphemeralMessageText(1, 99, 1, undefined, { parse_mode: "HTML" })',
      '',
      'void [sent, draft, readBack, direct, directDraft, notAButton]',
    ].join('\n')
  )
  t.pass()
})

// Bot API 10.3: guest mode, subscriptions, stopped generation and managed bots

const { Telegraf } = require('../')

const guestUser = { id: 99, is_bot: false, first_name: 'User' }
const managedBotUser = { id: 555, is_bot: true, first_name: 'Managed' }
const guestChat = { id: 1000, type: 'private' }
const guestMessage = {
  message_id: 1,
  date: 1,
  chat: guestChat,
  from: guestUser,
  text: 'hi from another bot',
  guest_query_id: 'gq-1',
}
const guestMessageUpdate = { update_id: 30, guest_message: guestMessage }
const subscriptionUpdate = {
  update_id: 31,
  subscription: {
    user: guestUser,
    invoice_payload: 'plan-pro',
    state: 'active',
  },
}
const stoppedGenerationUpdate = {
  update_id: 32,
  stopped_message_generation: {
    chat: privateChat,
    draft_id: 9,
    message_thread_id: 4,
  },
}
const managedBotUpdate = {
  update_id: 33,
  managed_bot: { user: guestUser, bot: managedBotUser },
}
const NEW_UPDATE_GETTERS = {
  guest_message: 'guestMessage',
  subscription: 'subscription',
  stopped_message_generation: 'stoppedMessageGeneration',
  managed_bot: 'managedBot',
}

/** `[interface, payload key]` for every member of the `Update` union in the installed types */
function readUpdateTypesFromTypes() {
  const source = ts.createSourceFile(
    'update.d.ts',
    readTypeFile('update'),
    ts.ScriptTarget.Latest,
    true
  )
  const interfaces = new Map()
  let unionMembers = []
  const visit = (node) => {
    if (ts.isInterfaceDeclaration(node)) {
      interfaces.set(
        node.name.text,
        node.members.map((member) => member.name?.text).filter(Boolean)
      )
    }
    if (
      ts.isTypeAliasDeclaration(node) &&
      node.name.text === 'Update' &&
      ts.isUnionTypeNode(node.type)
    ) {
      unionMembers = node.type.types.map((member) =>
        member.getText(source).replace(/^Update\./, '')
      )
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return unionMembers.map((name) => {
    const keys = interfaces.get(name) ?? []
    return [name, keys.length === 1 ? keys[0] : keys.join(',')]
  })
}

const toGetterName = (key) =>
  key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())

/** Telegraf whose requests go to a fake fetch; handleUpdate reuses these options, so nothing leaves the process */
function offlineTelegraf(results = {}) {
  const requests = []
  const bot = new Telegraf('123:abc', {
    telegram: {
      fetch: async (url, init) => {
        const method = String(url).split('/').pop()
        requests.push([method, JSON.parse(init.body)])
        return {
          status: 200,
          statusText: 'OK',
          json: async () => ({
            ok: true,
            result: method in results ? results[method] : true,
          }),
        }
      },
    },
  })
  bot.botInfo = { ...botInfo, username: 'bot' }
  return { bot, requests }
}

test('Telegram guest and managed bot wrappers pass arguments through unchanged', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const args = {
    answerGuestQuery: { guest_query_id: 'gq-1', result: guestResult('hi') },
    getManagedBotAccessSettings: { user_id: 555 },
    setManagedBotAccessSettings: {
      user_id: 555,
      is_access_restricted: false,
    },
    getUserPersonalChatMessages: { user_id: 555, limit: 20 },
  }
  for (const [method, payload] of Object.entries(args)) {
    await telegram[method](payload)
    t.is(calls.at(-1)[1], payload)
  }
  t.deepEqual(calls, Object.entries(args))
})

test('guest answers and access settings serialize to the Bot API as JSON', async (t) => {
  const { bot, requests } = offlineTelegraf({
    answerGuestQuery: { inline_message_id: 'guest-1' },
  })
  const result = guestResult('hi')
  t.deepEqual(
    await bot.telegram.answerGuestQuery({ guest_query_id: 'gq-1', result }),
    { inline_message_id: 'guest-1' }
  )
  t.true(
    await bot.telegram.setManagedBotAccessSettings({
      user_id: 555,
      is_access_restricted: true,
      added_user_ids: [99],
    })
  )
  t.deepEqual(requests, [
    ['answerGuestQuery', { guest_query_id: 'gq-1', result }],
    [
      'setManagedBotAccessSettings',
      { user_id: 555, is_access_restricted: true, added_user_ids: [99] },
    ],
  ])
})

test('Context.answerGuestQuery answers the guest query of the update', async (t) => {
  const { telegram, calls } = recordingTelegram({
    inline_message_id: 'guest-1',
  })
  const ctx = new Context(guestMessageUpdate, telegram, botInfo)
  const results = [
    guestResult('plain'),
    { type: 'photo', id: 'photo', photo_file_id: 'photo-id' },
    {
      type: 'article',
      id: 'rich',
      title: 'Rich',
      input_message_content: { rich_message: richMarkdown },
    },
  ]
  for (const result of results) {
    t.deepEqual(await ctx.answerGuestQuery(result), {
      inline_message_id: 'guest-1',
    })
  }
  t.deepEqual(
    calls,
    results.map((result) => [
      'answerGuestQuery',
      { guest_query_id: 'gq-1', result },
    ])
  )
})

test('Context.answerGuestQuery throws without a guest query and makes no API call', (t) => {
  const { telegram, calls } = recordingTelegram()
  const cases = [
    ['subscription', subscriptionUpdate],
    ['stopped_message_generation', stoppedGenerationUpdate],
    ['inline_query', inlineQueryUpdate],
    [
      'guest_message',
      {
        update_id: 34,
        guest_message: { ...guestMessage, guest_query_id: undefined },
      },
    ],
    // a regular message carrying guest_query_id is not a guest query
    ['message', { update_id: 35, message: guestMessage }],
  ]

  for (const [updateType, update] of cases) {
    const ctx = new Context(update, telegram, botInfo)
    t.throws(() => ctx.answerGuestQuery('hi'), {
      instanceOf: TypeError,
      message: `Telegraf: "answerGuestQuery" isn't available for "${updateType}"`,
    })
  }
  t.deepEqual(calls, [])
})

test('Context getters expose the new update payloads', (t) => {
  const updates = {
    guest_message: guestMessageUpdate,
    subscription: subscriptionUpdate,
    stopped_message_generation: stoppedGenerationUpdate,
    managed_bot: managedBotUpdate,
  }

  for (const [key, update] of Object.entries(updates)) {
    const ctx = new Context(update, {}, botInfo)
    t.is(ctx.updateType, key)
    for (const [otherKey, getter] of Object.entries(NEW_UPDATE_GETTERS)) {
      if (otherKey === key) t.is(ctx[getter], update[key], getter)
      else t.is(ctx[getter], undefined, `${getter} on ${key}`)
    }
  }

  const plain = new Context(plainMessageUpdate, {}, botInfo)
  for (const getter of Object.values(NEW_UPDATE_GETTERS)) {
    t.is(plain[getter], undefined, getter)
  }
})

test('Context derives chat and from for the new update types', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const subscription = new Context(subscriptionUpdate, telegram, botInfo)
  const managed = new Context(managedBotUpdate, telegram, botInfo)
  const stopped = new Context(stoppedGenerationUpdate, telegram, botInfo)
  const guest = new Context(guestMessageUpdate, telegram, botInfo)

  t.is(subscription.from, subscriptionUpdate.subscription.user)
  t.is(subscription.chat, undefined)
  // the creator of the managed bot, not the bot itself
  t.is(managed.from, guestUser)
  t.is(managed.chat, undefined)
  t.is(stopped.chat, privateChat)
  t.is(stopped.from, undefined)

  // guest messages belong to another bot's chat: nothing is derived from them
  t.is(guest.msg, undefined)
  t.is(guest.msgId, undefined)
  t.is(guest.chat, undefined)
  t.is(guest.from, undefined)
  t.throws(() => guest.reply('hi'), {
    instanceOf: TypeError,
    message: `Telegraf: "sendMessage" isn't available for "guest_message"`,
  })

  // chat-based helpers work after a user stops a generation
  await stopped.sendMessage('generation stopped')
  await stopped.sendRichMessageDraft(
    stoppedGenerationUpdate.stopped_message_generation.draft_id,
    richMarkdown,
    {
      message_thread_id:
        stoppedGenerationUpdate.stopped_message_generation.message_thread_id,
    }
  )
  t.deepEqual(calls, [
    [
      'sendMessage',
      {
        chat_id: 42,
        message_thread_id: undefined,
        business_connection_id: undefined,
        text: 'generation stopped',
      },
    ],
    [
      'sendRichMessageDraft',
      {
        chat_id: 42,
        message_thread_id: 4,
        draft_id: 9,
        rich_message: richMarkdown,
      },
    ],
  ])
})

test('Telegraf routes the new update types to their handlers', async (t) => {
  const { bot, requests } = offlineTelegraf({
    answerGuestQuery: { inline_message_id: 'guest-1' },
  })
  const seen = []

  bot.on('message', (ctx) => {
    seen.push(['message', ctx.updateType])
  })
  bot.on('guest_message', async (ctx) => {
    seen.push(['guest_message', ctx.guestMessage.text])
    t.deepEqual(await ctx.answerGuestQuery(guestResult('hello')), {
      inline_message_id: 'guest-1',
    })
  })
  bot.on('subscription', (ctx) => {
    seen.push(['subscription', ctx.subscription.state, ctx.from.id])
  })
  bot.on('stopped_message_generation', async (ctx) => {
    seen.push([
      'stopped_message_generation',
      ctx.stoppedMessageGeneration.draft_id,
    ])
    await ctx.sendMessage('stopped')
  })
  bot.on('managed_bot', (ctx) => {
    seen.push(['managed_bot', ctx.managedBot.bot.id])
  })
  bot.use((ctx) => {
    if (ctx.has(['guest_message', 'subscription'])) {
      seen.push(['unreachable', ctx.updateType])
    }
  })

  for (const update of [
    guestMessageUpdate,
    subscriptionUpdate,
    stoppedGenerationUpdate,
    managedBotUpdate,
  ]) {
    await bot.handleUpdate(update)
  }

  // guest messages are not delivered to message handlers
  t.deepEqual(seen, [
    ['guest_message', 'hi from another bot'],
    ['subscription', 'active', 99],
    ['stopped_message_generation', 9],
    ['managed_bot', 555],
  ])
  t.deepEqual(requests, [
    [
      'answerGuestQuery',
      { result: guestResult('hello'), guest_query_id: 'gq-1' },
    ],
    ['sendMessage', { chat_id: 42, text: 'stopped' }],
  ])
})

test('ctx.has narrows to the new update types', async (t) => {
  const { bot } = offlineTelegraf()
  const matched = []

  bot.use((ctx, next) => {
    if (ctx.has('guest_message'))
      matched.push(['guest', ctx.guestMessage.message_id])
    if (ctx.has(['subscription', 'managed_bot']))
      matched.push(['user', ctx.from.id])
    if (ctx.has('stopped_message_generation'))
      matched.push(['stopped', ctx.chat.id])
    return next()
  })

  for (const update of [
    guestMessageUpdate,
    subscriptionUpdate,
    stoppedGenerationUpdate,
    managedBotUpdate,
    plainMessageUpdate,
  ]) {
    await bot.handleUpdate(update)
  }

  t.deepEqual(matched, [
    ['guest', 1],
    ['user', 99],
    ['stopped', 42],
    ['user', 99],
  ])
})

test('Context has a getter for every update type in the Bot API types', (t) => {
  const updateTypes = readUpdateTypesFromTypes()

  // the Bot API 10.3 names, not "bot_subscription"
  for (const key of Object.keys(NEW_UPDATE_GETTERS)) {
    t.true(
      updateTypes.some(([, typed]) => typed === key),
      key
    )
  }
  t.false(updateTypes.some(([, typed]) => typed === 'bot_subscription'))

  // fails when the types add an update type without a Context getter
  t.deepEqual(
    updateTypes.filter(
      ([, key]) =>
        typeof Object.getOwnPropertyDescriptor(
          Context.prototype,
          toGetterName(key)
        )?.get !== 'function'
    ),
    []
  )

  for (const [name, key] of updateTypes) {
    const payload = { marker: key }
    const ctx = new Context({ update_id: 1, [key]: payload }, {}, botInfo)
    t.is(ctx.updateType, key, name)
    t.is(ctx[toGetterName(key)], payload, name)
  }
})

test('Bot API 10.3 guest mode, subscription and managed bot fields are typed', async (t) => {
  await compileTypeScript(
    'bot-api-10-3-guest-mode-subscription-and-managed-bot-fields-are-typed.ts',
    [
      `import { Context, Input, Telegraf, Telegram } from '${packageRoot}'`,
      `import * as T from '${packageRoot}/types'`,
      `import { bold } from '${packageRoot}/format'`,
      'declare const ctx: Context',
      'declare const telegram: Telegram',
      'declare const bot: Telegraf',
      "const result: T.InlineQueryResult = { type: 'article', id: 'a', title: 'Answer', input_message_content: { message_text: 'hi' } }",
      "const answer: T.Opts<'answerGuestQuery'> = { guest_query_id: 'q', result }",
      "const sent: T.SentGuestMessage = { inline_message_id: 'i' }",
      'const settings: T.BotAccessSettings = { is_access_restricted: true, added_users: [] }',
      "const set: T.Opts<'setManagedBotAccessSettings'> = { user_id: 1, is_access_restricted: true, added_user_ids: [2] }",
      "const community: T.Community = { id: 1, name: 'Community' }",
      'const added: T.CommunityChatAdded = { community }',
      'const joined: T.CommunityChatJoined = { community }',
      'const removed: T.CommunityChatRemoved = {}',
      '// @ts-expect-error guest answers are inline query results, not top-level text',
      "const wrong: T.Opts<'answerGuestQuery'> = { guest_query_id: 'q', text: 'hi' }",
      '// @ts-expect-error access settings fields are top-level parameters',
      "const wrongAccess: T.Opts<'setManagedBotAccessSettings'> = { user_id: 1, access_settings: settings }",
    ].join('\n')
  )
  t.pass()
})

test('guest mode, subscription and managed bot APIs are typed', async (t) => {
  await compileTypeScript(
    'guest-mode-subscription-and-managed-bot-apis-are-typed.ts',
    [
      `import { Context, Input, Telegraf, Telegram } from '${packageRoot}'`,
      `import * as T from '${packageRoot}/types'`,
      `import { bold } from '${packageRoot}/format'`,
      'declare const ctx: Context',
      'declare const telegram: Telegram',
      'declare const bot: Telegraf',
      "const result: T.InlineQueryResult = { type: 'article', id: 'a', title: 'Answer', input_message_content: { message_text: 'hi' } }",
      "bot.on('guest_message', async ctx => { const sent: T.SentGuestMessage = await ctx.answerGuestQuery(result); void sent })",
      "bot.on('subscription', ctx => { const user: T.User = ctx.from; const value: T.BotSubscriptionUpdated = ctx.subscription; void [user, value] })",
      "bot.on('stopped_message_generation', ctx => { const value: T.MessageGenerationStopped = ctx.stoppedMessageGeneration; void ctx.sendRichMessageDraft(value.draft_id, { markdown: 'stopped' }) })",
      "bot.on('managed_bot', async ctx => { const user: T.User = ctx.from; await ctx.telegram.setManagedBotAccessSettings({ user_id: ctx.managedBot.bot.id, is_access_restricted: true, added_user_ids: [user.id] }) })",
      "bot.on('purchased_paid_media', ctx => { const value: T.PaidMediaPurchased = ctx.purchasedPaidMedia; void value })",
      "void bot.launch({ allowedUpdates: ['guest_message', 'subscription', 'stopped_message_generation', 'managed_bot', 'purchased_paid_media'] })",
      '// @ts-expect-error guest query helper does not accept top-level text',
      "void ctx.answerGuestQuery('hello')",
      '// @ts-expect-error access restriction flag is required',
      'void telegram.setManagedBotAccessSettings({ user_id: 1 })',
      '// @ts-expect-error limit is required',
      'void telegram.getUserPersonalChatMessages({ user_id: 1 })',
    ].join('\n')
  )
  t.pass()
})

// Bot API 10.3: live photos, poll media, reaction removal and join request queries

const clipFile = () => Input.fromBuffer(Buffer.from('clip-bytes'), 'clip.mp4')
const reactionUpdate = {
  update_id: 40,
  message_reaction: {
    chat: privateChat,
    message_id: 7,
    user: ephemeralUser,
    date: 1,
    old_reaction: [],
    new_reaction: [{ type: 'emoji', emoji: '👍' }],
  },
}
const joinRequestQueryUpdate = {
  update_id: 41,
  chat_join_request: {
    chat: groupChat,
    from: ephemeralUser,
    user_chat_id: 99,
    date: 1,
    query_id: 'jrq-1',
  },
}
const catOption = {
  text: 'Cat',
  text_entities: [],
  media: { type: 'photo', media: 'cat-file-id' },
}

test('Telegram.sendLivePhoto passes arguments through and formats captions', async (t) => {
  const { bold } = require('../format')
  const sent = { message_id: 1, live_photo: {} }
  const { telegram, calls } = recordingTelegram(sent)
  const clip = clipFile()
  const plain = {
    chat_id: 42,
    photo: 'photo-id',
    live_photo: clip,
    caption: 'plain',
    parse_mode: 'HTML',
    show_caption_above_media: true,
    ephemeral_message_parameters: ephemeralParams,
  }
  const noCaption = { chat_id: '@channel', photo: clip, live_photo: clip }

  t.is(await telegram.sendLivePhoto(plain), sent)
  await telegram.sendLivePhoto(noCaption)
  await telegram.sendLivePhoto({
    chat_id: 42,
    photo: 'photo-id',
    live_photo: clip,
    caption: bold('formatted'),
    parse_mode: 'HTML',
  })

  t.deepEqual(calls, [
    ['sendLivePhoto', plain],
    ['sendLivePhoto', noCaption],
    [
      'sendLivePhoto',
      {
        chat_id: 42,
        photo: 'photo-id',
        live_photo: clip,
        caption: 'formatted',
        caption_entities: boldEntities(9),
        // entities from FmtString win over a parse_mode passed alongside
        parse_mode: undefined,
      },
    ],
  ])
  // arguments without a FmtString caption are forwarded as-is
  t.is(calls[0][1], plain)
  t.is(calls[1][1], noCaption)
  t.is(calls[2][1].live_photo, clip)
})

test('live photo and voice note uploads are sent as multipart attachments', async (t) => {
  const { bold } = require('../format')
  const photo = Input.fromBuffer(Buffer.from('still-bytes'), 'still.jpg')
  const video = Input.fromBuffer(Buffer.from('motion-bytes'), 'clip.mp4')
  const live = await captureBotApiRequest((tg) =>
    tg.sendLivePhoto({
      chat_id: 42,
      photo,
      live_photo: video,
      caption: bold('live'),
    })
  )
  t.regex(live.headers['content-type'], /^multipart\/form-data/)
  t.true(live.body.includes('name="photo"; filename="still.jpg"'))
  t.true(live.body.includes('name="live_photo"; filename="clip.mp4"'))
  t.deepEqual(
    JSON.parse(getMultipartField(live.body, 'caption_entities')),
    boldEntities(4)
  )
  const media = { type: 'live_photo', media: video, photo }
  const paid = await captureBotApiRequest((tg) =>
    tg.sendPaidMedia(42, [media], 25)
  )
  const paidMedia = JSON.parse(getMultipartField(paid.body, 'media'))[0]
  t.is(paidMedia.type, 'live_photo')
  t.regex(paidMedia.media, /^attach:\/\/[0-9a-f]+$/)
  t.regex(paidMedia.photo, /^attach:\/\/[0-9a-f]+$/)
  t.not(paidMedia.media, paidMedia.photo)
  t.true(paid.body.includes('motion-bytes'))
  t.true(paid.body.includes('still-bytes'))
  const edited = await captureBotApiRequest((tg) =>
    tg.editEphemeralMessageMedia(42, 99, 1, media)
  )
  t.is(getMultipartField(edited.body, 'receiver_user_id'), '99')
  t.regex(
    JSON.parse(getMultipartField(edited.body, 'media')).photo,
    /^attach:\/\//
  )
  const voice = await captureBotApiRequest((tg) =>
    tg.sendRichMessage({
      chat_id: 42,
      rich_message: {
        markdown: '![voice](tg://voice_note?id=voice)',
        media: [
          {
            id: 'voice',
            media: {
              type: 'voice_note',
              media: Input.fromBuffer(Buffer.from('voice-bytes'), 'voice.ogg'),
            },
          },
        ],
      },
    })
  )
  const rich = JSON.parse(getMultipartField(voice.body, 'rich_message'))
  t.is(rich.media[0].media.type, 'voice_note')
  t.regex(rich.media[0].media.media, /^attach:\/\//)
  t.true(voice.body.includes('voice-bytes'))
})

test('Context live photo helpers inherit chat, thread and business connection', async (t) => {
  const cases = [
    [
      'plain message',
      plainMessageUpdate,
      {
        chat_id: 42,
        message_thread_id: undefined,
        business_connection_id: undefined,
      },
    ],
    [
      'topic message',
      topicMessageUpdate,
      {
        chat_id: 42,
        message_thread_id: 9,
        business_connection_id: undefined,
      },
    ],
    [
      'business message',
      businessMessageUpdate,
      {
        chat_id: 42,
        message_thread_id: undefined,
        business_connection_id: 'biz-1',
      },
    ],
    [
      'callback query',
      callbackUpdate(ephemeralMessage),
      {
        chat_id: 42,
        message_thread_id: undefined,
        business_connection_id: undefined,
      },
    ],
  ]

  for (const [name, update, defaults] of cases) {
    const { telegram, calls } = recordingTelegram()
    const ctx = new Context(update, telegram, botInfo)
    const clip = clipFile()

    await ctx.sendLivePhoto('photo-id', clip)
    await ctx.replyWithLivePhoto('photo-id', clip, {
      protect_content: true,
    })

    t.deepEqual(
      calls,
      [
        ['sendLivePhoto', { ...defaults, photo: 'photo-id', live_photo: clip }],
        [
          'sendLivePhoto',
          {
            ...defaults,
            protect_content: true,
            photo: 'photo-id',
            live_photo: clip,
          },
        ],
      ],
      name
    )
  }
})

test('Context live photo extras override defaults but not the files', async (t) => {
  const { bold } = require('../format')
  const { telegram, calls } = recordingTelegram()
  const ctx = new Context(topicMessageUpdate, telegram, botInfo)
  const clip = clipFile()

  await ctx.replyWithLivePhoto('photo-id', clip, {
    message_thread_id: 10,
    business_connection_id: 'biz-override',
    caption: bold('caption'),
    reply_markup: inlineMarkup,
    ephemeral_message_parameters: ephemeralParams,
    // not allowed by the types; positional files must still win for JS callers
    photo: 'ignored-photo',
    live_photo: 'ignored-video',
  })

  t.deepEqual(calls, [
    [
      'sendLivePhoto',
      {
        chat_id: 42,
        message_thread_id: 10,
        business_connection_id: 'biz-override',
        caption: 'caption',
        caption_entities: boldEntities(7),
        parse_mode: undefined,
        reply_markup: inlineMarkup,
        ephemeral_message_parameters: ephemeralParams,
        photo: 'photo-id',
        live_photo: clip,
      },
    ],
  ])
})

test('useNewReplies makes replyWithLivePhoto reply to the incoming message', async (t) => {
  const cases = [
    ['plain message', plainMessageUpdate, 13],
    ['topic message', topicMessageUpdate, 5],
    ['business message', businessMessageUpdate, 6],
    ['callback query', callbackUpdate(ephemeralMessage), 12],
  ]
  for (const [name, update, messageId] of cases) {
    const { telegram, calls } = recordingTelegram()
    const ctx = new Context(update, telegram, botInfo)
    const clip = clipFile()

    await ctx.sendLivePhoto('photo-id', clip)
    await withNewReplies(ctx, (replyCtx) =>
      replyCtx.replyWithLivePhoto('photo-id', clip)
    )

    const [[, plain], [method, reply]] = calls
    t.is(method, 'sendLivePhoto', name)
    t.deepEqual(
      reply,
      { ...plain, reply_parameters: { message_id: messageId } },
      name
    )
  }

  const { telegram, calls } = recordingTelegram()
  const clip = clipFile()
  await withNewReplies(
    new Context(topicMessageUpdate, telegram, botInfo),
    (ctx) =>
      ctx.replyWithLivePhoto('photo-id', clip, {
        reply_parameters: { message_id: 3, quote: 'question' },
        message_thread_id: 10,
      })
  )
  // nothing to reply to: sends a normal live photo
  await withNewReplies(
    new Context(chatJoinRequestUpdate, telegram, botInfo),
    (ctx) => ctx.replyWithLivePhoto('photo-id', clip)
  )
  t.deepEqual(calls, [
    [
      'sendLivePhoto',
      {
        chat_id: 42,
        message_thread_id: 10,
        business_connection_id: undefined,
        reply_parameters: { message_id: 3, quote: 'question' },
        photo: 'photo-id',
        live_photo: clip,
      },
    ],
    [
      'sendLivePhoto',
      {
        chat_id: -100,
        message_thread_id: undefined,
        business_connection_id: undefined,
        photo: 'photo-id',
        live_photo: clip,
      },
    ],
  ])
})

test('Telegram reaction removal and join request wrappers pass arguments through', async (t) => {
  const results = {
    deleteMessageReaction: true,
    deleteAllMessageReactions: true,
    answerChatJoinRequestQuery: true,
    sendChatJoinRequestWebApp: true,
  }
  const calls = []
  const telegram = new Telegram('token')
  telegram.callApi = (method, payload) => {
    calls.push([method, payload])
    return results[method]
  }
  const args = {
    deleteMessageReaction: {
      chat_id: 42,
      message_id: 7,
      user_id: 99,
    },
    deleteAllMessageReactions: { chat_id: '@channel', user_id: 99 },
    answerChatJoinRequestQuery: {
      chat_join_request_query_id: 'jrq-1',
      result: 'approve',
    },
    sendChatJoinRequestWebApp: {
      chat_join_request_query_id: 'jrq-1',
      web_app_url: 'https://example.test/review',
    },
  }

  for (const [method, payload] of Object.entries(args)) {
    t.is(await telegram[method](payload), results[method], method)
  }
  t.deepEqual(calls, Object.entries(args))
  for (const [index, payload] of Object.values(args).entries()) {
    t.is(calls[index][1], payload)
  }
})

test('Context.deleteMessageReaction forwards user and chat actors', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const ctx = new Context(plainMessageUpdate, telegram, botInfo)
  await ctx.deleteMessageReaction({ user_id: 99 })
  await ctx.deleteMessageReaction({ actor_chat_id: -100 })
  t.deepEqual(calls, [
    ['deleteMessageReaction', { chat_id: 42, message_id: 13, user_id: 99 }],
    [
      'deleteMessageReaction',
      { chat_id: 42, message_id: 13, actor_chat_id: -100 },
    ],
  ])
})

test('Context reaction removal targets a message or the whole chat', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const reaction = new Context(reactionUpdate, telegram, botInfo)
  const callback = new Context(
    callbackUpdate(ephemeralMessage),
    telegram,
    botInfo
  )
  const join = new Context(chatJoinRequestUpdate, telegram, botInfo)
  await reaction.deleteMessageReaction({ user_id: 99 })
  await callback.deleteMessageReaction({ actor_chat_id: -100 }, 98)
  await callback.deleteAllMessageReactions({ user_id: 99 })
  await join.deleteAllMessageReactions({ actor_chat_id: -200 })
  t.deepEqual(calls, [
    ['deleteMessageReaction', { chat_id: 42, message_id: 7, user_id: 99 }],
    [
      'deleteMessageReaction',
      { chat_id: 42, message_id: 98, actor_chat_id: -100 },
    ],
    ['deleteAllMessageReactions', { chat_id: 42, user_id: 99 }],
    ['deleteAllMessageReactions', { chat_id: -100, actor_chat_id: -200 }],
  ])
})

test('Context reaction removal rejects missing targets without sending', (t) => {
  const { telegram, calls } = recordingTelegram()
  const noChat = new Context(inlineQueryUpdate, telegram, botInfo)
  const noMessage = new Context(chatJoinRequestUpdate, telegram, botInfo)
  t.throws(() => noChat.deleteMessageReaction({ user_id: 99 }, 5), {
    instanceOf: TypeError,
  })
  t.throws(() => noChat.deleteAllMessageReactions({ user_id: 99 }), {
    instanceOf: TypeError,
  })
  t.throws(() => noMessage.deleteMessageReaction({ user_id: 99 }), {
    instanceOf: TypeError,
  })
  t.deepEqual(calls, [])
})

test('Context join request query helpers use the query of the update', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const ctx = new Context(joinRequestQueryUpdate, telegram, botInfo)
  t.true(await ctx.sendChatJoinRequestWebApp('https://example.test/review'))
  for (const result of ['approve', 'decline', 'queue'])
    t.true(await ctx.answerChatJoinRequestQuery(result))
  t.deepEqual(calls, [
    [
      'sendChatJoinRequestWebApp',
      {
        chat_join_request_query_id: 'jrq-1',
        web_app_url: 'https://example.test/review',
      },
    ],
    ...['approve', 'decline', 'queue'].map((result) => [
      'answerChatJoinRequestQuery',
      { chat_join_request_query_id: 'jrq-1', result },
    ]),
  ])
})

test('Context join request query helpers throw without a query', (t) => {
  const { telegram, calls } = recordingTelegram()
  const cases = [
    // a join request from a chat without join request queries
    ['chat_join_request', chatJoinRequestUpdate],
    ['message', plainMessageUpdate],
    ['inline_query', inlineQueryUpdate],
  ]

  for (const [updateType, update] of cases) {
    const ctx = new Context(update, telegram, botInfo)
    t.throws(() => ctx.answerChatJoinRequestQuery('approve'), {
      instanceOf: TypeError,
      message: `Telegraf: "answerChatJoinRequestQuery" isn't available for "${updateType}"`,
    })
    t.throws(() => ctx.sendChatJoinRequestWebApp('https://example.test'), {
      instanceOf: TypeError,
      message: `Telegraf: "sendChatJoinRequestWebApp" isn't available for "${updateType}"`,
    })
  }
  t.deepEqual(calls, [])
})

test('reaction removal and join request queries serialize to the Bot API as JSON', async (t) => {
  const { bot, requests } = offlineTelegraf()
  bot.on('message_reaction', async (ctx) => {
    await ctx.deleteMessageReaction({ user_id: 99 })
    await ctx.deleteAllMessageReactions({ actor_chat_id: -100 })
  })
  bot.on('chat_join_request', async (ctx) => {
    t.true(await ctx.sendChatJoinRequestWebApp('https://example.test/review'))
    await ctx.answerChatJoinRequestQuery('queue')
  })
  await bot.handleUpdate(reactionUpdate)
  await bot.handleUpdate(joinRequestQueryUpdate)
  t.deepEqual(requests, [
    ['deleteMessageReaction', { chat_id: 42, message_id: 7, user_id: 99 }],
    ['deleteAllMessageReactions', { chat_id: 42, actor_chat_id: -100 }],
    [
      'sendChatJoinRequestWebApp',
      {
        chat_join_request_query_id: 'jrq-1',
        web_app_url: 'https://example.test/review',
      },
    ],
    [
      'answerChatJoinRequestQuery',
      { chat_join_request_query_id: 'jrq-1', result: 'queue' },
    ],
  ])
})

test('Telegram polls accept option objects with media', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const pollMedia = { type: 'photo', media: 'photo-id' }
  const mapOption = {
    text: 'Map',
    media: { type: 'location', latitude: 1, longitude: 2 },
  }

  await telegram.sendPoll(42, 'Which?', ['Dog', catOption, mapOption], {
    media: pollMedia,
  })
  await telegram.sendQuiz(42, 'Q?', [catOption, 'Dog'], {
    correct_option_ids: [0],
    explanation: 'Cats',
    explanation_media: { type: 'photo', media: 'photo-id' },
  })
  // string-only options keep their pre-10.3 payload
  await telegram.sendPoll(42, 'Legacy?', ['yes', 'no'])

  t.deepEqual(calls, [
    [
      'sendPoll',
      {
        chat_id: 42,
        type: 'regular',
        question: 'Which?',
        options: [{ text: 'Dog' }, catOption, mapOption],
        media: pollMedia,
      },
    ],
    [
      'sendPoll',
      {
        chat_id: 42,
        type: 'quiz',
        question: 'Q?',
        options: [catOption, { text: 'Dog' }],
        correct_option_ids: [0],
        explanation: 'Cats',
        explanation_media: { type: 'photo', media: 'photo-id' },
      },
    ],
    [
      'sendPoll',
      {
        chat_id: 42,
        type: 'regular',
        question: 'Legacy?',
        options: [{ text: 'yes' }, { text: 'no' }],
      },
    ],
  ])
  // option objects are forwarded as-is
  t.is(calls[0][1].options[1], catOption)
  t.is(calls[1][1].options[0], catOption)
})

test('Context poll helpers accept option objects with media', async (t) => {
  const { telegram, calls } = recordingTelegram()
  const ctx = new Context(topicMessageUpdate, telegram, botInfo)
  const defaults = {
    chat_id: 42,
    message_thread_id: 9,
    business_connection_id: undefined,
  }

  await ctx.sendPoll('Which?', ['Dog', catOption])
  await ctx.replyWithPoll('Which?', [catOption, 'Dog'], {
    media: { type: 'photo', media: 'poll-photo-id' },
  })
  await ctx.sendQuiz('Q?', ['Dog', catOption], { correct_option_ids: [1] })
  await ctx.replyWithQuiz('Q?', [catOption, 'Dog'])
  await withNewReplies(ctx, (replyCtx) =>
    replyCtx.replyWithPoll('Reply?', ['Dog', catOption])
  )

  t.deepEqual(calls, [
    [
      'sendPoll',
      {
        ...defaults,
        type: 'regular',
        question: 'Which?',
        options: [{ text: 'Dog' }, catOption],
      },
    ],
    [
      'sendPoll',
      {
        ...defaults,
        type: 'regular',
        question: 'Which?',
        options: [catOption, { text: 'Dog' }],
        media: { type: 'photo', media: 'poll-photo-id' },
      },
    ],
    [
      'sendPoll',
      {
        ...defaults,
        type: 'quiz',
        question: 'Q?',
        options: [{ text: 'Dog' }, catOption],
        correct_option_ids: [1],
      },
    ],
    [
      'sendPoll',
      {
        ...defaults,
        type: 'quiz',
        question: 'Q?',
        options: [catOption, { text: 'Dog' }],
      },
    ],
    [
      'sendPoll',
      {
        ...defaults,
        type: 'regular',
        question: 'Reply?',
        options: [{ text: 'Dog' }, catOption],
        reply_parameters: { message_id: 5 },
      },
    ],
  ])
})

test('Bot API 10.3 live photo, poll media, reaction and join request fields are typed', async (t) => {
  await compileTypeScript(
    'bot-api-10-3-live-photo-poll-media-reaction-and-join-request-fields-are-typed.ts',
    [
      `import { Context, Input, Telegraf, Telegram } from '${packageRoot}'`,
      `import * as T from '${packageRoot}/types'`,
      `import { bold } from '${packageRoot}/format'`,
      'declare const ctx: Context',
      'declare const telegram: Telegram',
      'declare const bot: Telegraf',
      "const file = Input.fromBuffer(Buffer.from('media'))",
      "const live: T.InputMediaLivePhoto = { type: 'live_photo', media: file, photo: 'still-id' }",
      "const paid: T.InputPaidMediaLivePhoto = { type: 'live_photo', media: 'motion-id', photo: file }",
      "const option: T.InputPollOption = { text: 'answer', media: { type: 'link', url: 'https://example.test' } }",
      "const send: T.Opts<'sendPoll'> = { chat_id: 1, question: 'Q', options: [option], media: live, explanation_media: { type: 'document', media: file } }",
      "const group: T.Opts<'sendMediaGroup'> = { chat_id: 1, media: [live] }",
      "const remove: T.Opts<'deleteAllMessageReactions'> = { chat_id: 1, actor_chat_id: -1 }",
      "const web: T.Opts<'sendChatJoinRequestWebApp'> = { chat_join_request_query_id: 'q', web_app_url: 'https://example.test' }",
      "const reply: T.Opts<'answerChatJoinRequestQuery'> = { chat_join_request_query_id: 'q', result: 'queue' }",
      '// @ts-expect-error voice notes are not editable InputMedia',
      "const voice: T.InputMedia = { type: 'voice_note', media: file }",
      '// @ts-expect-error bulk reaction removal targets an actor, not a message',
      "const wrong: T.Opts<'deleteAllMessageReactions'> = { chat_id: 1, message_id: 5 }",
      '// @ts-expect-error links are option media, not poll-level media',
      "const badPoll: T.Opts<'sendPoll'> = { chat_id: 1, question: 'Q', options: [], media: { type: 'link', url: 'https://example.test' } }",
    ].join('\n')
  )
  t.pass()
})

// Context helpers for the Bot API 10.3 chat management methods, keyed by the method they call
const contextChatManagementCalls = {
  answerChatJoinRequestQuery: (ctx) =>
    ctx.answerChatJoinRequestQuery('approve'),
  deleteAllMessageReactions: (ctx) =>
    ctx.deleteAllMessageReactions({ user_id: 99 }),
  deleteMessageReaction: (ctx) => ctx.deleteMessageReaction({ user_id: 99 }),
  sendChatJoinRequestWebApp: (ctx) =>
    ctx.sendChatJoinRequestWebApp('https://example.test'),
  sendLivePhoto: (ctx) => ctx.replyWithLivePhoto('photo-id', clipFile()),
}

test('Bot API 10.3 chat management methods are wrapped and reachable from Context', async (t) => {
  const typed = readMethodsFromTypes()
  for (const method of Object.keys(contextChatManagementCalls)) {
    t.true(typed.includes(method), method)
  }
  // join request queries need a join request update; the others need a message
  const updateFor = (method) =>
    method.includes('ChatJoinRequest') ? joinRequestQueryUpdate : reactionUpdate

  for (const [method, call] of Object.entries(contextChatManagementCalls)) {
    const { telegram, calls } = recordingTelegram()
    await call(new Context(updateFor(method), telegram, botInfo))
    t.deepEqual(
      calls.map(([name]) => name),
      [method],
      method
    )
  }

  // every query_id-based method of the types reads it from the join request update
  t.deepEqual(
    readMethodsAcceptingField('chat_join_request_query_id').filter((method) =>
      method.includes('ChatJoinRequest')
    ),
    ['answerChatJoinRequestQuery', 'sendChatJoinRequestWebApp']
  )
  // every option-taking poll helper accepts option objects
  t.deepEqual(readMethodsAcceptingField('explanation_media'), ['sendPoll'])
})

test('live photo, poll media, reaction and join request APIs are typed', async (t) => {
  await compileTypeScript(
    'live-photo-poll-media-reaction-and-join-request-apis-are-typed.ts',
    [
      `import { Context, Input, Telegraf, Telegram } from '${packageRoot}'`,
      `import * as T from '${packageRoot}/types'`,
      `import { bold } from '${packageRoot}/format'`,
      'declare const ctx: Context',
      'declare const telegram: Telegram',
      'declare const bot: Telegraf',
      "const file = Input.fromBuffer(Buffer.from('media'))",
      "void ctx.sendLivePhoto('photo-id', 'video-id', { has_spoiler: true, caption: bold('hi') })",
      'void telegram.sendLivePhoto({ chat_id: 1, photo: file, live_photo: file })',
      'void ctx.deleteMessageReaction({ user_id: 99 })',
      'void ctx.deleteMessageReaction({ actor_chat_id: -1 }, 5)',
      'const removed: Promise<true> = ctx.deleteAllMessageReactions({ user_id: 99 })',
      "const answer: Promise<true> = ctx.answerChatJoinRequestQuery('queue')",
      "const web: Promise<true> = ctx.sendChatJoinRequestWebApp('https://example.test')",
      "const option: T.InputPollOption = { text: 'A', media: { type: 'photo', media: file } }",
      "void ctx.sendPoll('Q', [option, 'B'])",
      "void ctx.sendQuiz('Q', [option], { correct_option_ids: [0] })",
      "void ctx.sendMediaGroup([{ type: 'live_photo', media: file, photo: file }])",
      "void telegram.sendPaidMedia(1, [{ type: 'live_photo', media: file, photo: file }], 1)",
      "void telegram.editEphemeralMessageMedia(1, 99, 2, { type: 'live_photo', media: file, photo: file, caption: bold('live') })",
      '// @ts-expect-error old video field is not part of sendLivePhoto',
      'void telegram.sendLivePhoto({ chat_id: 1, photo: file, video: file })',
      '// @ts-expect-error reaction deletion requires an actor object',
      "void ctx.deleteMessageReaction('emoji')",
      '// @ts-expect-error result must be approve, decline or queue',
      'void ctx.answerChatJoinRequestQuery(true)',
      '// @ts-expect-error Mini App URL is a string',
      "void ctx.sendChatJoinRequestWebApp({ url: 'https://example.test' })",
    ].join('\n')
  )
  t.pass()
})

test('Bot API 9.4-9.6 changelog fields are typed', (t) => {
  const files = {
    manage: readTypeFile('manage'),
    markup: readTypeFile('markup'),
    message: readTypeFile('message'),
    methods: readTypeFile('methods'),
    update: readTypeFile('update'),
  }
  const blocks = {
    chatAdministratorRights: getInterface(
      files.manage,
      'ChatAdministratorRights'
    ),
    chatMemberAdministrator: getInterface(
      files.manage,
      'ChatMemberAdministrator'
    ),
    chatMemberMember: getInterface(files.manage, 'ChatMemberMember'),
    chatMemberRestricted: getInterface(files.manage, 'ChatMemberRestricted'),
    chatPermissions: getInterface(files.manage, 'ChatPermissions'),
    keyboardButtonRequestManagedBot: getInterface(
      files.markup,
      'KeyboardButtonRequestManagedBot'
    ),
    keyboardButtonRequestManagedBotVariant: getInterface(
      files.markup,
      'RequestManagedBot'
    ),
    managedBotCreated: getInterface(files.manage, 'ManagedBotCreated'),
    managedBotCreatedMessage: getInterface(
      files.message,
      'ManagedBotCreatedMessage'
    ),
    managedBotUpdated: getInterface(files.manage, 'ManagedBotUpdated'),
    messageCommon: getInterface(files.message, 'CommonMessage'),
    messageEntityDateTime: getInterface(files.message, 'DateTime'),
    poll: getInterface(files.message, 'Poll'),
    pollAnswer: getInterface(files.message, 'PollAnswer'),
    pollOption: getInterface(files.message, 'PollOption'),
    pollOptionAdded: getInterface(files.message, 'PollOptionAdded'),
    pollOptionAddedMessage: getInterface(
      files.message,
      'PollOptionAddedMessage'
    ),
    pollOptionDeleted: getInterface(files.message, 'PollOptionDeleted'),
    pollOptionDeletedMessage: getInterface(
      files.message,
      'PollOptionDeletedMessage'
    ),
    preparedKeyboardButton: getInterface(
      files.markup,
      'PreparedKeyboardButton'
    ),
    replyParameters: getTypeAlias(files.message, 'ReplyParameters'),
    textQuote: getInterface(files.message, 'TextQuote'),
    updateManagedBot: getInterface(files.update, 'ManagedBotUpdate'),
    user: getInterface(files.manage, 'User'),
    userFromGetMe: getInterface(files.manage, 'UserFromGetMe'),
  }
  const methods = {
    getManagedBotToken: getMethodArgs(files.methods, 'getManagedBotToken'),
    getUserProfileAudios: getMethodArgs(files.methods, 'getUserProfileAudios'),
    giftPremiumSubscription: getMethodArgs(
      files.methods,
      'giftPremiumSubscription'
    ),
    promoteChatMember: getMethodArgs(files.methods, 'promoteChatMember'),
    replaceManagedBotToken: getMethodArgs(
      files.methods,
      'replaceManagedBotToken'
    ),
    savePreparedKeyboardButton: getMethodArgs(
      files.methods,
      'savePreparedKeyboardButton'
    ),
    sendGift: getMethodArgs(files.methods, 'sendGift'),
    sendPoll: getMethodArgs(files.methods, 'sendPoll'),
    setChatMemberTag: getMethodArgs(files.methods, 'setChatMemberTag'),
    setMyProfilePhoto: getMethodArgs(files.methods, 'setMyProfilePhoto'),
  }
  const checks = {
    'User.can_manage_bots': hasOptionalField(
      blocks.user,
      'can_manage_bots',
      'boolean'
    ),
    'UserFromGetMe.can_manage_bots': hasOptionalField(
      blocks.userFromGetMe,
      'can_manage_bots',
      'boolean'
    ),
    'UserFromGetMe.allows_users_to_create_topics': hasOptionalField(
      blocks.userFromGetMe,
      'allows_users_to_create_topics',
      'boolean'
    ),
    KeyboardButtonRequestManagedBot:
      hasField(
        blocks.keyboardButtonRequestManagedBot,
        'request_id',
        'number'
      ) &&
      hasOptionalField(
        blocks.keyboardButtonRequestManagedBot,
        'suggested_name',
        'string'
      ) &&
      hasOptionalField(
        blocks.keyboardButtonRequestManagedBot,
        'suggested_username',
        'string'
      ),
    'KeyboardButton.request_managed_bot': hasField(
      blocks.keyboardButtonRequestManagedBotVariant,
      'request_managed_bot',
      'KeyboardButtonRequestManagedBot'
    ),
    ManagedBotCreated: hasField(blocks.managedBotCreated, 'bot', 'User'),
    'Message.managed_bot_created': hasField(
      blocks.managedBotCreatedMessage,
      'managed_bot_created',
      'ManagedBotCreated'
    ),
    ManagedBotUpdated:
      hasField(blocks.managedBotUpdated, 'user', 'User') &&
      hasField(blocks.managedBotUpdated, 'bot', 'User'),
    'Update.managed_bot': hasField(
      blocks.updateManagedBot,
      'managed_bot',
      'ManagedBotUpdated'
    ),
    PreparedKeyboardButton: hasField(
      blocks.preparedKeyboardButton,
      'id',
      'string'
    ),
    'getManagedBotToken.user_id': hasField(
      methods.getManagedBotToken,
      'user_id',
      'number'
    ),
    'replaceManagedBotToken.user_id': hasField(
      methods.replaceManagedBotToken,
      'user_id',
      'number'
    ),
    'savePreparedKeyboardButton.button': compact(
      methods.savePreparedKeyboardButton
    ).includes(
      'button: KeyboardButton.RequestUsers | KeyboardButton.RequestChat | KeyboardButton.RequestManagedBot;'
    ),
    'Poll.correct_option_ids': hasOptionalField(
      blocks.poll,
      'correct_option_ids',
      'number[]'
    ),
    'sendPoll.correct_option_ids': hasOptionalField(
      methods.sendPoll,
      'correct_option_ids',
      'number[]'
    ),
    'sendPoll.allows_revoting': hasOptionalField(
      methods.sendPoll,
      'allows_revoting',
      'boolean'
    ),
    'sendPoll.shuffle_options': hasOptionalField(
      methods.sendPoll,
      'shuffle_options',
      'boolean'
    ),
    'sendPoll.allow_adding_options': hasOptionalField(
      methods.sendPoll,
      'allow_adding_options',
      'boolean'
    ),
    'sendPoll.hide_results_until_closes': hasOptionalField(
      methods.sendPoll,
      'hide_results_until_closes',
      'boolean'
    ),
    'sendPoll.description':
      hasOptionalField(methods.sendPoll, 'description', 'string') &&
      hasOptionalField(
        methods.sendPoll,
        'description_entities',
        'MessageEntity[]'
      ),
    'PollOption.persistent_id': hasField(
      blocks.pollOption,
      'persistent_id',
      'string'
    ),
    'PollAnswer.option_persistent_ids': hasField(
      blocks.pollAnswer,
      'option_persistent_ids',
      'string[]'
    ),
    'PollOption.added_by_user':
      hasOptionalField(blocks.pollOption, 'added_by_user', 'User') &&
      hasOptionalField(blocks.pollOption, 'added_by_chat', 'Chat') &&
      hasOptionalField(blocks.pollOption, 'addition_date', 'number'),
    PollOptionAdded:
      hasOptionalField(
        blocks.pollOptionAdded,
        'poll_message',
        'MaybeInaccessibleMessage'
      ) && hasField(blocks.pollOptionAdded, 'option_persistent_id', 'string'),
    'Message.poll_option_added': hasField(
      blocks.pollOptionAddedMessage,
      'poll_option_added',
      'PollOptionAdded'
    ),
    PollOptionDeleted:
      hasOptionalField(
        blocks.pollOptionDeleted,
        'poll_message',
        'MaybeInaccessibleMessage'
      ) && hasField(blocks.pollOptionDeleted, 'option_persistent_id', 'string'),
    'Message.poll_option_deleted': hasField(
      blocks.pollOptionDeletedMessage,
      'poll_option_deleted',
      'PollOptionDeleted'
    ),
    'ReplyParameters.poll_option_id': hasOptionalField(
      blocks.replyParameters,
      'poll_option_id',
      'string'
    ),
    'Message.reply_to_poll_option_id': hasOptionalField(
      blocks.messageCommon,
      'reply_to_poll_option_id',
      'string'
    ),
    'MessageEntity.date_time':
      hasField(blocks.messageEntityDateTime, 'type', '"date_time"') &&
      hasOptionalField(blocks.messageEntityDateTime, 'unix_time', 'number') &&
      hasOptionalField(
        blocks.messageEntityDateTime,
        'date_time_format',
        'string'
      ) &&
      hasTypeMember(files.message, 'MessageEntity', 'MessageEntity.DateTime'),
    'TextQuote date_time entities': hasOptionalField(
      blocks.textQuote,
      'entities',
      'MessageEntity[]'
    ),
    'ReplyParameters date_time entities': hasOptionalField(
      blocks.replyParameters,
      'quote_entities',
      'MessageEntity[]'
    ),
    'Gift text date_time entities':
      hasOptionalField(methods.sendGift, 'text_entities', 'MessageEntity[]') &&
      hasOptionalField(
        methods.giftPremiumSubscription,
        'text_entities',
        'MessageEntity[]'
      ),
    'Checklist date_time entities':
      hasTypeMember(files.message, 'MessageEntity', 'MessageEntity.DateTime') &&
      getInterface(files.message, 'InputChecklistTask').includes(
        'MessageEntity.DateTime'
      ) &&
      getInterface(files.message, 'InputChecklist').includes(
        'MessageEntity.DateTime'
      ),
    'ChatMemberMember.tag': hasOptionalField(
      blocks.chatMemberMember,
      'tag',
      'string'
    ),
    'ChatMemberRestricted.tag': hasOptionalField(
      blocks.chatMemberRestricted,
      'tag',
      'string'
    ),
    'ChatMemberRestricted.can_edit_tag': hasField(
      blocks.chatMemberRestricted,
      'can_edit_tag',
      'boolean'
    ),
    'ChatPermissions.can_edit_tag': hasOptionalField(
      blocks.chatPermissions,
      'can_edit_tag',
      'boolean'
    ),
    'ChatAdministratorRights.can_manage_tags': hasOptionalField(
      blocks.chatAdministratorRights,
      'can_manage_tags',
      'boolean'
    ),
    'ChatMemberAdministrator.can_manage_tags': hasOptionalField(
      blocks.chatMemberAdministrator,
      'can_manage_tags',
      'boolean'
    ),
    'promoteChatMember.can_manage_tags': hasOptionalField(
      methods.promoteChatMember,
      'can_manage_tags',
      'boolean'
    ),
    'setChatMemberTag.tag':
      hasField(methods.setChatMemberTag, 'chat_id', 'number | string') &&
      hasField(methods.setChatMemberTag, 'user_id', 'number') &&
      hasOptionalField(methods.setChatMemberTag, 'tag', 'string'),
    'Message.sender_tag': hasOptionalField(
      blocks.messageCommon,
      'sender_tag',
      'string'
    ),
    'KeyboardButton icon and style':
      hasOptionalField(
        getInterface(files.markup, 'AbstractInlineKeyboardButton'),
        'icon_custom_emoji_id',
        'string'
      ) &&
      hasOptionalField(
        getInterface(files.markup, 'Common'),
        'style',
        '"danger" | "success" | "primary"'
      ),
    'ChatOwnerLeft/Changed':
      hasField(
        getInterface(files.message, 'ChatOwnerLeftMessage'),
        'chat_owner_left',
        'ChatOwnerLeft'
      ) &&
      hasField(
        getInterface(files.message, 'ChatOwnerChangedMessage'),
        'chat_owner_changed',
        'ChatOwnerChanged'
      ),
    VideoQuality:
      hasField(
        getInterface(files.message, 'VideoQuality'),
        'codec',
        'string'
      ) &&
      hasOptionalField(
        getInterface(files.message, 'Video'),
        'qualities',
        'VideoQuality[]'
      ),
    'ChatFullInfo.first_profile_audio': hasOptionalField(
      files.manage,
      'first_profile_audio',
      'Audio'
    ),
    UserProfileAudios:
      hasField(
        getInterface(files.manage, 'UserProfileAudios'),
        'audios',
        'Audio[]'
      ) && hasField(methods.getUserProfileAudios, 'user_id', 'number'),
    'setMyProfilePhoto.photo': hasField(
      methods.setMyProfilePhoto,
      'photo',
      'InputProfilePhoto<F>'
    ),
    'UniqueGiftModel.rarity': hasOptionalField(
      getInterface(files.manage, 'UniqueGiftModel'),
      'rarity',
      '"uncommon" | "rare" | "epic" | "legendary"'
    ),
    'UniqueGift.is_burned': hasOptionalField(
      getInterface(files.manage, 'UniqueGift'),
      'is_burned',
      'true'
    ),
  }
  const missing = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name)
  t.deepEqual(missing, [])
})

test('multipart form data serializes nested input files', async (t) => {
  let resolveRequest
  const request = new Promise((resolve) => {
    resolveRequest = resolve
  })
  const server = http.createServer((req, res) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      resolveRequest({
        url: req.url,
        headers: req.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      })
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ ok: true, result: true }))
      server.close()
    })
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  const telegram = new Telegram('123:abc', {
    apiRoot: `http://127.0.0.1:${port}`,
  })

  await telegram.setMyProfilePhoto({
    photo: {
      type: 'static',
      photo: Input.fromBuffer(Buffer.from('avatar-bytes'), 'avatar.png'),
    },
  })

  const captured = await request
  t.is(captured.url, '/bot123:abc/setMyProfilePhoto')
  t.regex(captured.headers['content-type'], /^multipart\/form-data/)
  const attachment = captured.body.match(/"photo":"attach:\/\/([0-9a-f]+)"/)
  t.truthy(attachment)
  t.true(captured.body.includes(`name="${attachment[1]}"`))
  t.true(captured.body.includes('filename="avatar.png"'))
  t.true(captured.body.includes('avatar-bytes'))
})

test('custom fetch is used for Bot API calls', async (t) => {
  let captured
  const telegram = new Telegram('123:abc', {
    fetch: async (url, init) => {
      captured = { url, init }
      return {
        status: 200,
        statusText: 'OK',
        json: async () => ({
          ok: true,
          result: { id: 42, is_bot: true, first_name: 'Bot' },
        }),
      }
    },
  })

  const result = await telegram.getMe()

  t.is(String(captured.url), 'https://api.telegram.org/bot123:abc/getMe')
  t.is(captured.init.method, 'POST')
  t.deepEqual(JSON.parse(captured.init.body), {})
  t.deepEqual(result, { id: 42, is_bot: true, first_name: 'Bot' })
})

test('custom fetch is used for URL attachments', async (t) => {
  const calls = []
  let botApiInit
  const telegram = new Telegram('123:abc', {
    fetch: async (url, init) => {
      calls.push(String(url))
      if (String(url) === 'https://example.test/avatar.png') {
        return {
          status: 200,
          statusText: 'OK',
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(Buffer.from('image-bytes'))
              controller.close()
            },
          }),
          json: async () => ({ ok: true, result: true }),
        }
      }
      botApiInit = init
      return {
        status: 200,
        statusText: 'OK',
        json: async () => ({ ok: true, result: true }),
      }
    },
  })

  await telegram.sendPhoto(
    1,
    Input.fromURLStream('https://example.test/avatar.png')
  )

  t.deepEqual(calls, [
    'https://example.test/avatar.png',
    'https://api.telegram.org/bot123:abc/sendPhoto',
  ])
  t.is(botApiInit.method, 'POST')
  t.is(botApiInit.duplex, 'half')
  t.regex(botApiInit.headers['content-type'], /^multipart\/form-data/)
})

test('request timeout aborts fetch calls', async (t) => {
  const telegram = new Telegram('123:abc', {
    requestTimeout: 1,
    fetch: async (_url, init) =>
      await new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          const err = new Error('aborted')
          err.name = 'AbortError'
          reject(err)
        })
      }),
  })

  const err = await t.throwsAsync(telegram.getMe())
  t.true(err instanceof TelegrafNetworkError)
  t.is(err.code, undefined)
  t.is(err.errorName, 'AbortError')
  t.false(err.transient)
  t.is(err.cause.name, 'AbortError')
})

test('fetch errors use safe network error boundary', async (t) => {
  class FetchLikeError extends Error {
    constructor(message, options) {
      super(message, options)
      this.name = 'FetchLikeError'
      this.code = 'ECONNRESET'
    }
  }

  const cause = new Error('root cause')
  const err = new FetchLikeError(
    'request to https://api.telegram.org/bot123:secret/getMe failed',
    { cause }
  )
  err.stack = `${err.name}: ${err.message}\n    at userland.js:1:1`

  const telegram = new Telegram('123:secret', {
    fetch: async () => {
      throw err
    },
  })

  const thrown = await t.throwsAsync(telegram.getMe())
  t.true(thrown instanceof TelegrafNetworkError)
  t.false(thrown instanceof FetchLikeError)
  t.is(thrown.name, 'TelegrafNetworkError')
  t.is(thrown.code, 'ECONNRESET')
  t.is(thrown.errorName, 'FetchLikeError')
  t.true(thrown.transient)
  t.is(thrown.method, 'getMe')
  t.deepEqual(thrown.request, {
    method: 'getMe',
    apiRoot: 'https://api.telegram.org',
    apiMode: 'bot',
    testEnv: false,
  })
  t.true(thrown.message.includes('[REDACTED]'))
  t.false(thrown.message.includes('secret'))
  t.false(thrown.stack.includes('secret'))
  t.is(thrown.cause.name, 'FetchLikeError')
  t.is(thrown.cause.code, 'ECONNRESET')
  thrown.cause.code = 'CHANGED'
  t.is(thrown.cause.code, 'CHANGED')
  t.true(thrown.cause.message.includes('[REDACTED]'))
  t.false(thrown.cause.message.includes('secret'))
  t.false(thrown.cause.stack.includes('secret'))
  t.is(thrown.cause.cause.message, cause.message)
  t.true(err.message.includes('secret'))

  const inspected = util.inspect(thrown, { depth: 5 })
  t.false(inspected.includes('secret'))
})

test('native fetch errors use safe network error boundary', async (t) => {
  const err = new DOMException(
    'request to https://api.telegram.org/bot123:secret/getMe failed',
    'AbortError'
  )

  const telegram = new Telegram('123:secret', {
    fetch: async () => {
      throw err
    },
  })

  const thrown = await t.throwsAsync(telegram.getMe())
  t.true(thrown instanceof TelegrafNetworkError)
  t.false(thrown instanceof DOMException)
  t.is(thrown.name, 'TelegrafNetworkError')
  t.is(thrown.code, 20)
  t.is(thrown.errorName, 'AbortError')
  t.false(thrown.transient)
  t.true(thrown.message.includes('[REDACTED]'))
  t.false(thrown.message.includes('secret'))
  t.false(thrown.stack.includes('secret'))
  t.is(thrown.cause.name, 'AbortError')
  t.true(thrown.cause.message.includes('[REDACTED]'))
  t.false(thrown.cause.message.includes('secret'))
  t.false(thrown.cause.stack.includes('secret'))
  t.true(err.message.includes('secret'))

  const inspected = util.inspect(thrown, { depth: 5 })
  t.false(inspected.includes('secret'))
})

test('plain object fetch errors are sanitized before exposure', async (t) => {
  const err = {
    message: 'request to https://api.telegram.org/bot123:secret/getMe failed',
    stack: 'Error: https://api.telegram.org/bot123:secret/getMe',
    details: {
      url: 'https://api.telegram.org/bot123:secret/getMe',
    },
    self: undefined,
  }
  err.self = err

  const telegram = new Telegram('123:secret', {
    fetch: async () => {
      throw err
    },
  })

  const thrown = await t.throwsAsync(telegram.getMe())
  t.true(thrown instanceof TelegrafNetworkError)
  t.true(thrown.message.includes('[REDACTED]'))
  t.false(thrown.message.includes('secret'))
  t.true(thrown.cause.message.includes('[REDACTED]'))
  t.true(thrown.cause.details.url.includes('[REDACTED]'))
  t.is(thrown.cause.self, '[Circular]')

  const inspected = util.inspect(thrown, { depth: 5 })
  t.false(inspected.includes('secret'))
})

test('native fetch is accepted as telegram fetch type', async (t) => {
  await compileTypeScript(
    'native-fetch.ts',
    [
      `import { Telegraf } from '${packageRoot}'`,
      '',
      'new Telegraf("token", {',
      '  telegram: {',
      '    fetch: globalThis.fetch,',
      '  },',
      '})',
    ].join('\n')
  )
  t.pass()
})

test('scene helper types are exported and infer state', async (t) => {
  await compileTypeScript(
    'scene-types.ts',
    [
      `import { Context, Scenes } from '${packageRoot}'`,
      '',
      'interface MySceneSession extends Scenes.SceneSessionData {',
      '  state?: { lastMessageId?: number }',
      '}',
      '',
      'interface MyContext extends Context {',
      '  session: Scenes.SceneSession<MySceneSession>',
      '  scene: Scenes.SceneContextScene<MyContext, MySceneSession>',
      '}',
      '',
      'class CustomSceneContext extends Scenes.SceneContextScene<',
      '  MyContext,',
      '  MySceneSession',
      '> {',
      '  get ttl() {',
      '    return this.options.ttl',
      '  }',
      '}',
      '',
      'const options: Scenes.SceneOptions<MyContext> = {',
      '  handlers: [],',
      '  enterHandlers: [],',
      '  leaveHandlers: [],',
      '}',
      'void options',
      '',
      'declare const ctx: MyContext',
      'ctx.scene.state.lastMessageId = 1',
      'ctx.scene.enter("next", { lastMessageId: 2 })',
      'void CustomSceneContext',
    ].join('\n')
  )
  t.pass()
})
