const test = require('ava')
const { Telegraf, session } = require('../')
const { fixtures } = require('./_helpers')

// Every warning issued in this file.
const warnings = []
process.emitWarning = (message, type, code) =>
  warnings.push({ message, type, code })

const TOKEN = '123456:SECRET-abc_DEF'

function createBot(...args) {
  const bot = new Telegraf(...args)
  bot.botInfo = { id: 42, is_bot: true, username: 'bot', first_name: 'Bot' }
  return bot
}

const BaseTextMessage = {
  chat: { id: 1 },
  text: 'foo',
}

test('should provide chat and sender info', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.on(['text', 'message'], (ctx) => {
        t.is(ctx.from.id, 42)
        t.is(ctx.chat.id, 1)
        resolve()
      })
      bot.handleUpdate({ message: { ...BaseTextMessage, from: { id: 42 } } })
    })
  ))

test('should share state', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.on(
        'message',
        (ctx, next) => {
          ctx.state.answer = 41
          return next()
        },
        (ctx, next) => {
          ctx.state.answer++
          return next()
        },
        (ctx) => {
          t.is(ctx.state.answer, 42)
          resolve()
        }
      )
      bot.handleUpdate({ message: BaseTextMessage })
    })
  ))

test('should store session state', (t) => {
  const bot = createBot()
  bot.use(session())
  bot.hears('calc', (ctx) => {
    t.true('session' in ctx)
    t.true('counter' in ctx.session)
    t.is(ctx.session.counter, 2)
  })
  bot.on('message', (ctx) => {
    t.true('session' in ctx)
    if (ctx.session == null) ctx.session = { counter: 0 }
    ctx.session.counter++
  })
  return bot
    .handleUpdate({
      message: { ...BaseTextMessage, from: { id: 42 }, chat: { id: 42 } },
    })
    .then(() =>
      bot.handleUpdate({
        message: { ...BaseTextMessage, from: { id: 42 }, chat: { id: 42 } },
      })
    )
    .then(() =>
      bot.handleUpdate({
        message: { ...BaseTextMessage, from: { id: 100500 }, chat: { id: 42 } },
      })
    )
    .then(() =>
      bot.handleUpdate({
        message: {
          ...BaseTextMessage,
          from: { id: 42 },
          chat: { id: 42 },
          text: 'calc',
        },
      })
    )
})

test('should store session state with custom store', (t) => {
  const bot = createBot()
  const dummyStore = {}
  bot.use(
    session({
      store: {
        get: (key) =>
          new Promise((resolve) => setTimeout(resolve, 25, dummyStore[key])),
        set: (key, value) =>
          new Promise((resolve) => setTimeout(resolve, 25)).then(
            () => (dummyStore[key] = value)
          ),
      },
    })
  )
  bot.hears('calc', (ctx) => {
    t.true('session' in ctx)
    t.true('counter' in ctx.session)
    t.is(dummyStore['42:42'].counter, 2)
  })
  bot.on('message', (ctx) => {
    t.true('session' in ctx)
    if (ctx.session == null) {
      ctx.session = { counter: 0 }
    }
    ctx.session.counter++
  })
  return bot
    .handleUpdate({
      message: { ...BaseTextMessage, from: { id: 42 }, chat: { id: 42 } },
    })
    .then(() =>
      bot.handleUpdate({
        message: { ...BaseTextMessage, from: { id: 42 }, chat: { id: 42 } },
      })
    )
    .then(() =>
      bot.handleUpdate({
        message: { ...BaseTextMessage, from: { id: 100500 }, chat: { id: 42 } },
      })
    )
    .then(() =>
      bot.handleUpdate({
        message: {
          ...BaseTextMessage,
          from: { id: 42 },
          chat: { id: 42 },
          text: 'calc',
        },
      })
    )
})

test('should work with context extensions', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.context.db = {
        getUser: () => undefined,
      }
      bot.on('message', (ctx) => {
        t.true('db' in ctx)
        t.true('getUser' in ctx.db)
        resolve()
      })
      bot.handleUpdate({ message: BaseTextMessage })
    })
  ))

class MockResponse {
  constructor() {
    this.writableEnded = false
  }

  setHeader() {}
  end(body) {
    this.writableEnded = true
    this.body = body
  }
}

test('should handle webhook response', async (t) => {
  const bot = createBot()
  bot.on('message', async (ctx) => {
    ctx.telegram.webhookReply = true
    const result = await ctx.replyWithChatAction('typing')
    t.true(result)
  })
  const res = new MockResponse()
  await bot.handleUpdate({ message: BaseTextMessage }, res)
  t.true(res.writableEnded)
  t.deepEqual(JSON.parse(res.body), {
    method: 'sendChatAction',
    chat_id: 1,
    action: 'typing',
  })
})

test('should respect webhookReply option', async (t) => {
  const bot = createBot(null, { webhookReply: false })
  bot.catch((err) => {
    throw err
  }) // Disable log
  bot.on('message', async (ctx) => ctx.replyWithChatAction('typing'))
  const res = new MockResponse()
  await t.throwsAsync(bot.handleUpdate({ message: BaseTextMessage }, res))
  t.true(res.writableEnded)
  t.is(res.body, undefined)
})

test('should send calls through the fetch option', async (t) => {
  const { calls, fetch } = fixtures.fetch.recorder()
  const bot = createBot(TOKEN, { fetch })
  bot.on('message', (ctx) => ctx.reply('bar'))

  t.true(await bot.telegram.getMe())
  await bot.handleUpdate({ message: BaseTextMessage })

  t.deepEqual(
    calls.map(({ url }) => url),
    [
      `https://api.telegram.org/bot${TOKEN}/getMe`,
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
    ]
  )
})

test('should send calls to the server in the api option', async (t) => {
  const { calls, fetch } = fixtures.fetch.recorder()
  const api = {
    root: 'http://localhost:8081',
    mode: 'user',
    environment: 'test',
  }
  const bot = createBot(TOKEN, { fetch, api })

  await bot.telegram.getMe()

  t.is(calls[0].url, `http://localhost:8081/user${TOKEN}/test/getMe`)
})

// Serial, and before any other test that passes `telegram`: the warning is issued
// once in a process.
test.serial('should warn once about the telegram option', (t) => {
  const deprecations = () =>
    warnings.filter(({ code }) => code === 'TELEGRAF_TELEGRAM_OPTION')

  createBot(TOKEN, { api: { root: 'http://localhost:8081' } })
  t.deepEqual(deprecations(), [])

  createBot(TOKEN, { telegram: { apiRoot: 'http://localhost:8081' } })
  createBot(TOKEN, { telegram: {} })
  t.is(deprecations().length, 1)
  t.is(deprecations()[0].type, 'DeprecationWarning')
  t.regex(deprecations()[0].message, /the `telegram` option is deprecated/)
})

test('should prefer api and webhookReply to the telegram option', (t) => {
  const bot = createBot(TOKEN, {
    api: { root: 'http://localhost:1', mode: 'bot', environment: 'prod' },
    webhookReply: false,
    telegram: {
      apiRoot: 'http://localhost:2',
      apiMode: 'user',
      testEnv: true,
      webhookReply: true,
    },
  })

  t.like(bot.telegram.options, {
    apiRoot: 'http://localhost:1',
    apiMode: 'bot',
    testEnv: false,
    webhookReply: false,
  })
})

test('should keep the telegram options that are not set outside it', (t) => {
  const bot = createBot(TOKEN, {
    api: { root: 'http://localhost:1' },
    telegram: { apiMode: 'user', testEnv: true, webhookReply: false },
  })

  t.like(bot.telegram.options, {
    apiRoot: 'http://localhost:1',
    apiMode: 'user',
    testEnv: true,
    webhookReply: false,
  })
})

test('should respect webhookReply runtime change', async (t) => {
  const bot = createBot()
  bot.webhookReply = false
  bot.catch((err) => {
    throw err
  }) // Disable log
  bot.on('message', async (ctx) => ctx.replyWithChatAction('typing'))

  const res = new MockResponse()
  // Throws cause Bot Token is required for http call'
  await t.throwsAsync(bot.handleUpdate({ message: BaseTextMessage }, res))
  t.true(res.writableEnded)
  t.is(res.body, undefined)
})

test('should respect webhookReply runtime change (per request)', async (t) => {
  const bot = createBot()
  bot.catch((err) => {
    throw err
  }) // Disable log
  bot.on('message', async (ctx) => {
    ctx.webhookReply = false
    return ctx.replyWithChatAction('typing')
  })
  const res = new MockResponse()
  await t.throwsAsync(bot.handleUpdate({ message: BaseTextMessage }, res))
  t.true(res.writableEnded)
  t.is(res.body, undefined)
})

test('should deterministically generate `secretPathComponent`', (t) => {
  const foo = createBot('foo')
  const bar = createBot('bar')
  t.deepEqual(foo.secretPathComponent(), foo.secretPathComponent())
  t.deepEqual(bar.secretPathComponent(), bar.secretPathComponent())
  t.notDeepEqual(foo.secretPathComponent(), bar.secretPathComponent())
})

test('ctx.entities() should return entities from message', (t) => {
  const bot = createBot()
  bot.on('message', (ctx) => {
    t.deepEqual(ctx.entities(), [
      { type: 'bot_command', offset: 0, length: 6, fragment: '/start' },
      { type: 'code', offset: 7, length: 4, fragment: 'test' },
    ])
  })
  return bot.handleUpdate({
    message: {
      chat: { id: 1 },
      text: '/start test',
      entities: [
        { type: 'bot_command', offset: 0, length: 6 },
        { type: 'code', offset: 7, length: 4 },
      ],
    },
  })
})

test('ctx.entities() should return only requested entities', (t) => {
  const bot = createBot()
  bot.on('message', (ctx) => {
    t.deepEqual(ctx.entities('bold', 'code'), [
      { type: 'bold', offset: 7, length: 4, fragment: 'bold' },
      { type: 'code', offset: 12, length: 4, fragment: 'code' },
    ])
  })
  return bot.handleUpdate({
    message: {
      chat: { id: 1 },
      text: '/start bold code',
      entities: [
        { type: 'bot_command', offset: 0, length: 6 },
        { type: 'bold', offset: 7, length: 4 },
        { type: 'code', offset: 12, length: 4 },
      ],
    },
  })
})

// Webhook status code tests
test('webhookCallback should return 405 for non-POST requests', async (t) => {
  const bot = createBot()
  const callback = bot.webhookCallback('/webhook')
  const req = {
    method: 'GET',
    url: '/webhook',
    headers: {},
  }
  const res = new MockResponse()
  await callback(req, res)
  t.is(res.statusCode, 405)
})

test('webhookCallback should return 404 for path mismatch', async (t) => {
  const bot = createBot()
  const callback = bot.webhookCallback('/webhook')
  const req = {
    method: 'POST',
    url: '/wrong-path',
    headers: {},
  }
  const res = new MockResponse()
  await callback(req, res)
  t.is(res.statusCode, 404)
})

test('webhookCallback should return 403 for secret token mismatch', async (t) => {
  const bot = createBot()
  const callback = bot.webhookCallback('/webhook', { secretToken: 'mysecret' })
  const req = {
    method: 'POST',
    url: '/webhook',
    headers: {
      'x-telegram-bot-api-secret-token': 'wrongsecret',
    },
  }
  const res = new MockResponse()
  await callback(req, res)
  t.is(res.statusCode, 403)
})
