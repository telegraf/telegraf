const test = require('ava').default
const { Telegraf, TelegramError, session } = require('../')

function createBot(...args) {
  const bot = new Telegraf(...args)
  bot.botInfo = { id: 42, is_bot: true, username: 'bot', first_name: 'Bot' }
  return bot
}

function abortError() {
  const err = new Error('aborted')
  err.name = 'AbortError'
  return err
}

function stubPollingApi(bot, { conflictOnce = false, onUpdateCall } = {}) {
  let updateCalls = 0
  bot.telegram.callApi = async (method, payload, abortController) => {
    if (method === 'getMe') {
      return { id: 42, is_bot: true, username: 'bot', first_name: 'Bot' }
    }
    if (method === 'deleteWebhook') {
      return true
    }
    if (method !== 'getUpdates') {
      return true
    }
    if (payload.limit === 1) {
      return []
    }
    updateCalls++
    onUpdateCall?.(updateCalls)
    if (conflictOnce && updateCalls === 1) {
      throw new TelegramError({
        error_code: 409,
        description: 'Conflict',
      })
    }
    if (abortController?.signal?.aborted) {
      throw abortError()
    }
    await new Promise((resolve) => setTimeout(resolve, 5))
    if (abortController?.signal?.aborted) {
      throw abortError()
    }
    return []
  }
  return () => updateCalls
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
    if (ctx.session.counter == null) ctx.session.counter = 0
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
    if (ctx.session.counter == null) ctx.session.counter = 0
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
    this.headers = {}
  }

  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value
  }

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
  const bot = createBot(null, { telegram: { webhookReply: false } })
  bot.catch((err) => {
    throw err
  }) // Disable log
  bot.on('message', async (ctx) => ctx.replyWithChatAction('typing'))
  const res = new MockResponse()
  await t.throwsAsync(bot.handleUpdate({ message: BaseTextMessage }, res))
  t.true(res.writableEnded)
  t.is(res.body, undefined)
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

test('should enforce handler timeout', async (t) => {
  const bot = createBot('token', { handlerTimeout: 1 })
  bot.catch((err) => {
    throw err
  })
  bot.on('message', () => new Promise(() => undefined))

  const err = await t.throwsAsync(
    bot.handleUpdate({ message: BaseTextMessage })
  )
  t.regex(err.message, /timed out|timeout/i)
})

test('launch callback runs after polling is initialized', async (t) => {
  const bot = createBot('token')
  stubPollingApi(bot)

  await t.notThrowsAsync(bot.launch(() => bot.stop('test')))
})

test('polling can retry one conflict when configured', async (t) => {
  const bot = createBot('token')
  const updateCalls = stubPollingApi(bot, {
    conflictOnce: true,
    onUpdateCall: (count) => {
      if (count === 2) bot.stop('test')
    },
  })

  await t.notThrowsAsync(
    bot.launch(
      {
        polling: {
          retryOnConflict: true,
          conflictRetryDelay: 1,
          maxConflictRetryDelay: 1,
        },
      },
      () => undefined
    )
  )
  t.is(updateCalls(), 2)
})

test('polling conflict stays fatal by default', async (t) => {
  const bot = createBot('token')
  const updateCalls = stubPollingApi(bot, { conflictOnce: true })

  const err = await t.throwsAsync(bot.launch())

  t.true(err instanceof TelegramError)
  t.is(err.code, 409)
  t.is(updateCalls(), 1)
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
  t.is(res.headers.allow, 'POST')
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
