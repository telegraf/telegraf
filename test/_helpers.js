// @ts-check

const { Telegraf } = require('..')

/** @type {import("../types").Message['from']} */
const from = {
  id: 1,
  is_bot: false,
  first_name: 'Enrico',
  last_name: 'Fermi',
}

/** @type {import("../types").Message['chat']} */
const chat = {
  id: 1,
  type: 'private',
  first_name: 'Enrico',
  last_name: 'Fermi',
}

let update_id = 1
let message_id = 1

/** @type { { message: { text:() => import("../types").Update.MessageUpdate<import("../types").Message.TextMessage> } } } */
const Fixtures = {
  message: {
    text: () => ({
      update_id: update_id++,
      message: {
        message_id: message_id++,
        date: Date.now(),
        from: { ...from },
        chat: { ...chat },
        text: 'foo',
      },
    }),
  },
}

const SyncStore = () => {
  const map = new Map()

  return {
    map,
    store: {
      get: (name) => map.get(name),
      set: (name, value) => void map.set(name, value),
      delete: (name) => void map.delete(name),
    },
  }
}

const AsyncStore = () => {
  const map = new Map()

  return {
    map,
    store: {
      async get(name) {
        // API requests take time!
        await randSleep(50)
        return map.get(name)
      },
      async set(name, value) {
        // API requests take time!
        await randSleep(50)
        map.set(name, value)
      },
      async delete(name) {
        // API requests take time!
        await randSleep(50)
        map.delete(name)
      },
    },
  }
}

const genericAsyncMiddleware = async (ctx, next) => {
  await randSleep(200)
  return await next()
}

/** @returns {any} */
function createBot() {
  const bot = new Telegraf('')
  bot.botInfo = {
    id: 42,
    is_bot: true,
    username: 'bot',
    first_name: 'Bot',
    can_join_groups: true,
    can_read_all_group_messages: true,
    supports_inline_queries: true,
  }
  return bot
}

/** @type {(n: number) => Promise<void>} */
const sleep = (t) => new Promise((r) => setTimeout(r, t))

/** @type {(n: number) => number} */
const rand = (n) => Math.ceil(Math.random() * n)

/** @type {(n: number) => Promise<void>} */
const randSleep = (n) => sleep(rand(n))

module.exports = {
  SyncStore,
  AsyncStore,
  Fixtures,
  rand,
  sleep,
  createBot,
  randSleep,
  genericAsyncMiddleware,
}
