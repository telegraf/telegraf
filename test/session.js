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

      Promise.all(
        Array
          // create 100 text updates and fire them all at once
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

      Promise.all(
        Array
          // create 100 text updates and fire them all at once
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

/*

This test is the same as above, but a defaultSession is passed.
It tests that defaultSession is not erraneously stored in the db when it's not used.

*/
test('must not write default session back if session not touched', (t) =>
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

      Promise.all(
        Array
          // create 100 text message updates and fire them all at once
          .from({ length: 100 }, Fixtures.message.text)
          .map((fixture) => bot.handleUpdate(fixture))
      ).then(() => {
        const entries = [...map.entries()]
        t.deepEqual(entries.length, 0)
        resolve(true)
      })
    })
  ))

/*

This test is the same as above, but a defaultSession is passed.
It tests that defaultSession is not erraneously stored in the db when it's not used.

*/
test('must write default session back if session was touched', (t) =>
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

      Promise.all(
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
