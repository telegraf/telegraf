const http = require('http')
const { execFileSync } = require('child_process')
const os = require('os')
const fs = require('fs')
const path = require('path')
const ts = require('typescript')
const test = require('ava').default
const { Input, Telegram } = require('../')

function readTypeFile(name) {
  const typesRoot = path.dirname(require.resolve('@telegraf/types/package.json'))
  return fs
    .readFileSync(path.join(typesRoot, `${name}.d.ts`), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

function readMethodsFromTypes() {
  const methods = readTypeFile('methods')
  const source = ts.createSourceFile(
    'methods.d.ts',
    methods,
    ts.ScriptTarget.Latest,
    true
  )
  const names = []
  const getName = (name) =>
    ts.isIdentifier(name) || ts.isStringLiteral(name)
      ? name.text
      : undefined
  const visit = (node) => {
    if (
      ts.isTypeAliasDeclaration(node) &&
      node.name.text === 'ApiMethods' &&
      ts.isTypeLiteralNode(node.type)
    ) {
      for (const member of node.type.members) {
        const name = member.name && getName(member.name)
        if (name) names.push(name)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return [...new Set(names)]
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

function compileTypeScript(name, source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'telegraf-types-'))
  const file = path.join(dir, name)
  fs.writeFileSync(file, source)
  execFileSync(
    path.join(process.cwd(), 'node_modules/.bin/tsc'),
    [
      '--noEmit',
      '--strict',
      '--module',
      'node16',
      '--moduleResolution',
      'node16',
      '--target',
      'es2022',
      '--skipLibCheck',
      '--ignoreConfig',
      file,
    ],
    { stdio: 'pipe' }
  )
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
    [...source.matchAll(/callApi\('([a-zA-Z0-9]+)'/g)].map(
      (match) => match[1]
    )
  )
  const aliases = new Set(
    [...source.matchAll(/get ([a-zA-Z0-9]+)\(\) \{\n {4}return this\./g)].map(
      (match) => match[1]
    )
  )
  const missing = readMethodsFromTypes().filter(
    (method) => !wrapped.has(method) && !aliases.has(method)
  )
  t.deepEqual(missing, [])
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
    chatAdministratorRights: getInterface(files.manage, 'ChatAdministratorRights'),
    chatMemberAdministrator: getInterface(files.manage, 'ChatMemberAdministrator'),
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
    pollOptionAddedMessage: getInterface(files.message, 'PollOptionAddedMessage'),
    pollOptionDeleted: getInterface(files.message, 'PollOptionDeleted'),
    pollOptionDeletedMessage: getInterface(
      files.message,
      'PollOptionDeletedMessage'
    ),
    preparedKeyboardButton: getInterface(files.markup, 'PreparedKeyboardButton'),
    replyParameters: getInterface(files.message, 'ReplyParameters'),
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
    replaceManagedBotToken: getMethodArgs(files.methods, 'replaceManagedBotToken'),
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
    'User.can_manage_bots absent': !hasAnyField(blocks.user, 'can_manage_bots'),
    'UserFromGetMe.can_manage_bots': hasOptionalField(
      blocks.userFromGetMe,
      'can_manage_bots',
      'boolean'
    ),
    'UserFromGetMe.allows_users_to_create_topics':
      hasOptionalField(
        blocks.userFromGetMe,
        'allows_users_to_create_topics',
        'boolean'
      ),
    KeyboardButtonRequestManagedBot:
      hasField(blocks.keyboardButtonRequestManagedBot, 'request_id', 'number') &&
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
    PreparedKeyboardButton: hasField(blocks.preparedKeyboardButton, 'id', 'string'),
    'getManagedBotToken.user_id':
      hasField(methods.getManagedBotToken, 'user_id', 'number'),
    'replaceManagedBotToken.user_id':
      hasField(methods.replaceManagedBotToken, 'user_id', 'number'),
    'savePreparedKeyboardButton.button':
      compact(methods.savePreparedKeyboardButton).includes(
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
    'sendPoll.shuffle_options':
      hasOptionalField(methods.sendPoll, 'shuffle_options', 'boolean'),
    'sendPoll.allow_adding_options':
      hasOptionalField(methods.sendPoll, 'allow_adding_options', 'boolean'),
    'sendPoll.hide_results_until_closes':
      hasOptionalField(
        methods.sendPoll,
        'hide_results_until_closes',
        'boolean'
      ),
    'sendPoll.description':
      hasOptionalField(methods.sendPoll, 'description', 'string') &&
      hasOptionalField(methods.sendPoll, 'description_entities', 'MessageEntity[]'),
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
      ) &&
      hasField(blocks.pollOptionAdded, 'option_persistent_id', 'string'),
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
      ) &&
      hasField(blocks.pollOptionDeleted, 'option_persistent_id', 'string'),
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
    'TextQuote date_time entities':
      hasOptionalField(blocks.textQuote, 'entities', 'MessageEntity[]'),
    'ReplyParameters date_time entities':
      hasOptionalField(blocks.replyParameters, 'quote_entities', 'MessageEntity[]'),
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
    'promoteChatMember.can_manage_tags':
      hasOptionalField(methods.promoteChatMember, 'can_manage_tags', 'boolean'),
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
      hasField(getInterface(files.message, 'VideoQuality'), 'codec', 'string') &&
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
      hasField(getInterface(files.manage, 'UserProfileAudios'), 'audios', 'Audio[]') &&
      hasField(methods.getUserProfileAudios, 'user_id', 'number'),
    'setMyProfilePhoto.photo':
      hasField(methods.setMyProfilePhoto, 'photo', 'InputProfilePhoto<F>'),
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

  await telegram.sendPhoto(1, Input.fromURLStream(
    'https://example.test/avatar.png'
  ))

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
  t.is(err.name, 'AbortError')
})

test('fetch errors redact token and preserve metadata', async (t) => {
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
  t.is(thrown, err)
  t.true(thrown instanceof FetchLikeError)
  t.is(thrown.name, 'FetchLikeError')
  t.is(thrown.code, 'ECONNRESET')
  t.is(thrown.cause, cause)
  t.true(thrown.message.includes('[REDACTED]'))
  t.false(thrown.message.includes('secret'))
  t.false(thrown.stack.includes('secret'))
})

test('fetch errors redact token on getter-only native errors', async (t) => {
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
  t.is(thrown, err)
  t.true(thrown instanceof DOMException)
  t.is(thrown.name, 'AbortError')
  t.true(thrown.message.includes('[REDACTED]'))
  t.false(thrown.message.includes('secret'))
  t.false(thrown.stack.includes('secret'))
})

test('native fetch is accepted as telegram fetch type', (t) => {
  compileTypeScript(
    'native-fetch.ts',
    [
      `import { Telegraf } from '${process.cwd()}'`,
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

test('scene helper types are exported and infer state', (t) => {
  compileTypeScript(
    'scene-types.ts',
    [
      `import { Context, Scenes } from '${process.cwd()}'`,
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
