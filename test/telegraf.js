const test = require('ava')
const { Telegraf, session } = require('../')

function createBot (...args) {
  const bot = new Telegraf(...args)
  bot.botInfo = { id: 42, is_bot: true, username: 'bot', first_name: 'Bot' }
  return bot
}

const BaseTextMessage = {
  chat: { id: 1 },
  text: 'foo'
}

test.cb('should provide chat and sender info', (t) => {
  const bot = createBot()
  bot.on(['text', 'message'], (ctx) => {
    t.is(ctx.from.id, 42)
    t.is(ctx.chat.id, 1)
    t.end()
  })
  bot.handleUpdate({ message: { ...BaseTextMessage, from: { id: 42 } } })
})

test.cb('should share state', (t) => {
  const bot = createBot()
  bot.on('message', (ctx, next) => {
    ctx.state.answer = 41
    return next()
  }, (ctx, next) => {
    ctx.state.answer++
    return next()
  }, (ctx) => {
    t.is(ctx.state.answer, 42)
    t.end()
  })
  bot.handleUpdate({ message: BaseTextMessage })
})

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
  return bot.handleUpdate({ message: { ...BaseTextMessage, from: { id: 42 }, chat: { id: 42 } } })
    .then(() => bot.handleUpdate({ message: { ...BaseTextMessage, from: { id: 42 }, chat: { id: 42 } } }))
    .then(() => bot.handleUpdate({ message: { ...BaseTextMessage, from: { id: 100500 }, chat: { id: 42 } } }))
    .then(() => bot.handleUpdate({ message: { ...BaseTextMessage, from: { id: 42 }, chat: { id: 42 }, text: 'calc' } }))
})

test('should store session state with custom store', (t) => {
  const bot = createBot()
  const dummyStore = {}
  bot.use(session({
    store: {
      get: (key) => new Promise((resolve) => setTimeout(resolve, 25, dummyStore[key])),
      set: (key, value) => new Promise((resolve) => setTimeout(resolve, 25)).then(() => (dummyStore[key] = value))
    }
  }))
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
  return bot.handleUpdate({ message: { ...BaseTextMessage, from: { id: 42 }, chat: { id: 42 } } })
    .then(() => bot.handleUpdate({ message: { ...BaseTextMessage, from: { id: 42 }, chat: { id: 42 } } }))
    .then(() => bot.handleUpdate({ message: { ...BaseTextMessage, from: { id: 100500 }, chat: { id: 42 } } }))
    .then(() => bot.handleUpdate({ message: { ...BaseTextMessage, from: { id: 42 }, chat: { id: 42 }, text: 'calc' } }))
})

test.cb('should work with context extensions', (t) => {
  const bot = createBot()
  bot.context.db = {
    getUser: () => undefined
  }
  bot.on('message', (ctx) => {
    t.true('db' in ctx)
    t.true('getUser' in ctx.db)
    t.end()
  })
  bot.handleUpdate({ message: BaseTextMessage })
})

class MockResponse {
  constructor () {
    this.writableEnded = false
  }

  setHeader () {}
  end (body) {
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
  t.deepEqual(JSON.parse(res.body), { method: 'sendChatAction', chat_id: 1, action: 'typing' })
})

test('should respect webhookReply option', async (t) => {
  const bot = createBot(null, { telegram: { webhookReply: false } })
  bot.catch((err) => { throw err }) // Disable log
  bot.on('message', async (ctx) => ctx.replyWithChatAction('typing'))
  const res = new MockResponse()
  await t.throwsAsync(bot.handleUpdate({ message: BaseTextMessage }, res))
  t.true(res.writableEnded)
  t.is(res.body, undefined)
})

test('should respect webhookReply runtime change', async (t) => {
  const bot = createBot()
  bot.webhookReply = false
  bot.catch((err) => { throw err }) // Disable log
  bot.on('message', async (ctx) => ctx.replyWithChatAction('typing'))

  const res = new MockResponse()
  // Throws cause Bot Token is required for http call'
  await t.throwsAsync(bot.handleUpdate({ message: BaseTextMessage }, res))
  t.true(res.writableEnded)
  t.is(res.body, undefined)
})

test('should respect webhookReply runtime change (per request)', async (t) => {
  const bot = createBot()
  bot.catch((err) => { throw err }) // Disable log
  bot.on('message', async (ctx) => {
    ctx.webhookReply = false
    return ctx.replyWithChatAction('typing')
  })
  const res = new MockResponse()
  await t.throwsAsync(bot.handleUpdate({ message: BaseTextMessage }, res))
  t.true(res.writableEnded)
  t.is(res.body, undefined)
})
