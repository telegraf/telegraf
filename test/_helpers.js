// @ts-check

const { Duplex, Readable } = require('stream')
const { Telegraf } = require('..')
const { InputFile } = require('../lib/core/network/payload')

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

const fixtures = {
  /** @type { { message: { text:() => import("../types").Update.MessageUpdate<import("../types").Message.TextMessage> } } } */
  update: {
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
  },
  fetch: {
    // A fetch that records its calls and passes them to `send`.
    // Without `send`, a call is not sent and is answered with `{ ok: true, result: true }`.
    recorder(send) {
      const calls = []
      const fetch = async (url, init) => {
        calls.push({ url, init })
        if (send !== undefined) return send(url, init)
        return new Response(JSON.stringify({ ok: true, result: true }))
      }
      return { calls, fetch }
    },
    // A fetch that never responds. On abort it rejects with its own error rather than
    // the signal's reason, as some runtimes do.
    hanging() {
      return (url, init) =>
        new Promise((resolve, reject) => {
          const fail = () => reject(new TypeError('the request was cancelled'))
          if (init.signal.aborted) return fail()
          init.signal.addEventListener('abort', fail)
        })
    },
  },
  stream: {
    // A stream that never ends on its own.
    infinite() {
      let sent = false
      return new Readable({
        read() {
          if (!sent) this.push('start')
          sent = true
        },
      })
    },
    // A stream that is read to its end and can still be written to, like a socket.
    duplex() {
      /** @type {string[]} */
      const written = []
      const stream = new Duplex({
        read() {
          this.push('DATA')
          this.push(null)
        },
        write(chunk, encoding, done) {
          written.push(String(chunk))
          done()
        },
      })
      return { stream, written }
    },
  },
  signal: {
    // A signal that records its current listeners.
    recorder() {
      const controller = new AbortController()
      const { signal } = controller
      const listeners = new Set()
      const { addEventListener, removeEventListener } = signal
      signal.addEventListener = (type, listener, options) => {
        listeners.add(listener)
        addEventListener.call(signal, type, listener, options)
      }
      signal.removeEventListener = (type, listener) => {
        listeners.delete(listener)
        removeEventListener.call(signal, type, listener)
      }
      return { controller, signal, listeners }
    },
  },
  file: {
    failing(error) {
      return new InputFile(async function* () {
        yield new TextEncoder().encode('part')
        throw error
      })
    },
  },
}

/** `Promise.withResolvers()`, which Node 20 doesn't have. */
function withResolvers() {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
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
  fixtures,
  withResolvers,
  rand,
  sleep,
  createBot,
  randSleep,
  genericAsyncMiddleware,
}
