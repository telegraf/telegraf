// @ts-check

const test = require('ava').default
const { session } = require('..')

const {
  SyncStore,
  AsyncStore,
  Fixtures,
  createBot,
  randSleep,
  genericAsyncMiddleware,
} = require('./_helpers')

/** @typedef {import('..').Context & { session: { count: number } }} MyCtx */

/*

This is testing essentially the following logic:

Setup:
* store is sync, but middlewares aren't
* fire all updates simultaneously

If racing were to occur, ctx.session would repeatedly get overwritten

We test that it did not in fact get overwritten, and many updates were
able to concurrently read and write to session asynchronously without racing

*/
test('must resist session racing (with sync store)', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      /** @type {import('..').Telegraf<MyCtx>} */
      const bot = createBot()

      const { store, map } = SyncStore()
      bot.use(session({ store }))

      // pretend there are other middlewares that slow down by a random amount
      bot.use(genericAsyncMiddleware)

      bot.on('message', async (ctx) => {
        if (ctx.session === undefined) {
          ctx.session = { count: 1 }
        } else {
          ctx.session.count++
        }

        // pretend we make an API call, etc
        await randSleep(200)
      })

      // pretend there are other middlewares that slow down by a random amount
      bot.use(genericAsyncMiddleware)

      return Promise.all(
        Array
          // create 100 text updates and fire them all at once
          .from({ length: 100 }, Fixtures.message.text)
          .map((fixture) => bot.handleUpdate(fixture))
      )
        .then(() => {
          t.deepEqual(map.size, 1)
          t.deepEqual(map.get('1:1'), { count: 100 })
        })
        .then(() => resolve(true))
    })
  ))

/*

This is testing essentially the following logic:

Setup:
* everything is async - store, and middlewares
* fire all updates simultaneously

If racing were to occur, ctx.session would repeatedly get overwritten

We test that it did not in fact get overwritten, and many updates were
able to concurrently read and write to session asynchronously without racing

*/
test('must resist session racing (with async store)', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      /** @type {import('..').Telegraf<MyCtx>} */
      const bot = createBot()

      const { store, map } = AsyncStore()
      bot.use(session({ store }))

      bot.on('message', async (ctx) => {
        if (ctx.session === undefined) {
          ctx.session = { count: 1 }
        } else {
          ctx.session.count++
        }

        // pretend we make an API call, etc
        await randSleep(200)
      })

      // pretend there are other middlewares that slow down by a random amount
      bot.use(genericAsyncMiddleware)

      return Promise.all(
        Array
          // create 100 text updates and fire them all at once
          .from({ length: 100 }, Fixtures.message.text)
          .map((fixture) => bot.handleUpdate(fixture))
      )
        .then(() => {
          t.deepEqual(map.size, 1)
          t.deepEqual(map.get('1:1'), { count: 100 })
        })
        .then(() => resolve(true))
    })
  ))

test('must not write session back if session not touched after defaultSession was passed', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      /** @type {import('..').Telegraf<MyCtx>} */
      const bot = createBot()

      const { store, map } = AsyncStore()
      bot.use(session({ store, defaultSession: () => ({ count: 0 }) }))

      bot.on('message', async (ctx) => {
        // pretend we make an API call, etc
        await randSleep(200)

        // ctx.session is not touched
      })

      return Promise.all(
        Array
          // create 100 text message updates and fire them all at once
          .from({ length: 100 }, Fixtures.message.text)
          .map((fixture) => bot.handleUpdate(fixture))
      )
        .then(() => t.deepEqual(map.size, 0))
        .then(() => resolve(true))
    })
  ))

test('must write session back if session was touched after defaultSession is passed', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      /** @type {import('..').Telegraf<MyCtx>} */
      const bot = createBot()

      const { store, map } = AsyncStore()
      bot.use(session({ store, defaultSession: () => ({ count: 0 }) }))

      bot.on('message', async (ctx) => {
        ctx.session.count++
        // pretend we make an API call, etc
        await randSleep(200)
      })

      return Promise.all(
        Array
          // create 100 text message updates and fire them all at once
          .from({ length: 100 }, Fixtures.message.text)
          .map((fixture) => bot.handleUpdate(fixture))
      ).then(() => {
        const entries = [...map.entries()]
        t.deepEqual(entries.length, 1)
        const [key, value] = entries[0]
        t.deepEqual(key, '1:1')
        t.deepEqual(value, { count: 100 })
        resolve(true)
      })
    })
  ))

test('multiple sessions can be used independently without conflict', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      /** @type {import('..').Telegraf<MyCtx & { chatSession: { chatCount: number } }>} */
      const bot = createBot()

      const { store, map } = SyncStore()

      // first session, ctx.session
      bot.use(
        session({
          store,
          defaultSession: () => ({ count: 0 }),
        })
      )

      const { store: chatStore, map: chatStoreMap } = SyncStore()

      // second session, ctx.chatSession
      bot.use(
        session({
          property: 'chatSession',
          getSessionKey: (ctx) => ctx.chat && String(ctx.chat.id),
          store: chatStore,
          defaultSession: () => ({ chatCount: 0 }),
        })
      )

      bot.on('message', async (ctx) => {
        ctx.session.count++
        ctx.chatSession.chatCount++
        // pretend we make an API call, etc
        await randSleep(200)
      })

      return Promise.all(
        Array
          // create 100 text message updates and fire them all at once
          .from({ length: 100 }, Fixtures.message.text)
          // get different chatIds
          .map((fixture, id) => ((fixture.message.chat.id = id), fixture))
          .map((fixture) => bot.handleUpdate(fixture))
      )
        .then(() => {
          t.deepEqual(map.size, 100)
          for (let chatId = 0; chatId < 100; chatId++)
            t.deepEqual(map.get(`1:${chatId}`), { count: 1 })
        })
        .then(() => {
          t.deepEqual(chatStoreMap.size, 100)
          for (let chatId = 0; chatId < 100; chatId++)
            t.deepEqual(chatStoreMap.get(String(chatId)), { chatCount: 1 })
        })
        .then(() => resolve(true))
    })
  ))
