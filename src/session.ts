import { Context } from './context'
import { MaybePromise } from './util'
import { MiddlewareFn } from './middleware'
import d from 'debug'

export interface SessionStore<T> {
  get: (name: string) => MaybePromise<T | undefined>
  set: (name: string, value: T) => MaybePromise<void>
  delete: (name: string) => MaybePromise<void>
}

interface SessionOptions<S extends object> {
  initial?: () => S
  store?: SessionStore<S>
  getSessionKey?: (ctx: Context) => Promise<string | undefined>
}

export interface SessionContext<S extends object> extends Context {
  session?: S
}

/**
 * Returns middleware that adds `ctx.session` for storing arbitrary state per session key.
 *
 * The default `getSessionKey` is `${ctx.from.id}:${ctx.chat.id}`.
 * If either `ctx.from` or `ctx.chat` is `undefined`, default session key and thus `ctx.session` are also `undefined`.
 *
 * Session data is kept only in memory by default,
 * which means that all data will be lost when the process is terminated.
 * If you want to store data across restarts, or share it among workers,
 * you can [install persistent session middleware from npm](https://www.npmjs.com/search?q=telegraf-session),
 * or pass custom `storage`.
 *
 * @example https://github.com/feathers-studio/telegraf-docs/blob/master/examples/session-bot.ts
 */
export function session<S extends object>(
  options?: SessionOptions<S>
): MiddlewareFn<SessionContext<S>> {
  const getSessionKey = options?.getSessionKey ?? defaultGetSessionKey
  const store = options?.store ?? new MemorySessionStore()
  // caches value from store in-memory while simultaneous updates share it
  // when counter reaches 0, the cached ref will be freed from memory
  const cache = new Map<string, { ref?: S; counter: number }>()
  // temporarily stores concurrent requests
  const concurrents = new Map<string, MaybePromise<S | undefined>>()

  // this function must be handled with care
  return async (ctx, next) => {
    const updId = ctx.update.update_id

    const debug = d('telegraf:session')

    // because this is async, requests may still race here, but it will get autocorrected at (1)
    // v5 getSessionKey should probably be synchronous to avoid that
    const key = await getSessionKey(ctx)
    if (!key) {
      ctx.session = undefined
      return await next()
    }

    let cached = cache.get(key)
    if (cached) {
      debug(`(${updId}) found cached session, reusing from cache`)
      ++cached.counter
    } else {
      debug(`(${updId}) did not find cached session`)
      // if another concurrent request has already sent a store request, fetch that instead
      let promise = concurrents.get(key)
      if (promise)
        debug(`(${updId}) found a concurrent request, reusing promise`)
      else {
        debug(`(${updId}) fetching from upstream store`)
        promise = store.get(key)
      }
      // synchronously store promise so concurrent requests can share response
      concurrents.set(key, promise)
      const upstream = await promise
      // all concurrent awaits will have promise in their closure, safe to remove now
      concurrents.delete(key)
      debug(`(${updId}) updating cache`)
      // another request may have beaten us to the punch
      const c = cache.get(key)
      // (1) preserve cached reference using Object.assign, or create new object if it doesn't exist
      cached = Object.assign(c || {}, {
        ref: upstream,
        counter: (c?.counter || 0) + 1,
      })
      cache.set(key, cached)
    }

    Object.defineProperty(ctx, 'session', {
      get() {
        return cached?.ref
      },
      set(value: S) {
        if (cached) cached.ref = value
      },
    })

    try {
      await next()
    } finally {
      if (cached && --cached.counter === 0) {
        // decrement to avoid memory leak
        debug(`(${updId}) refcounter reached 0, removing cached`)
        cache.delete(key)
      }
      debug(`(${updId}) middlewares completed, checking session`)
      if (ctx.session == null) {
        debug(`(${updId}) ctx.session missing, removing from store`)
        await store.delete(key)
      } else {
        debug(`(${updId}) ctx.session found, updating store`)
        await store.set(key, ctx.session)
      }
    }
  }
}

async function defaultGetSessionKey(ctx: Context): Promise<string | undefined> {
  const fromId = ctx.from?.id
  const chatId = ctx.chat?.id
  if (fromId == null || chatId == null) {
    return undefined
  }
  return `${fromId}:${chatId}`
}

/** @deprecated https://github.com/telegraf/telegraf/issues/1372#issuecomment-782668499 */
export class MemorySessionStore<T> implements SessionStore<T> {
  private readonly store = new Map<string, { session: T; expires: number }>()

  constructor(private readonly ttl = Infinity) {}

  get(name: string): T | undefined {
    const entry = this.store.get(name)
    if (entry == null) {
      return undefined
    } else if (entry.expires < Date.now()) {
      this.delete(name)
      return undefined
    }
    return entry.session
  }

  set(name: string, value: T): void {
    const now = Date.now()
    this.store.set(name, { session: value, expires: now + this.ttl })
  }

  delete(name: string): void {
    this.store.delete(name)
  }
}

export function isSessionContext<S extends object>(
  ctx: Context
): ctx is SessionContext<S> {
  return 'session' in ctx
}
