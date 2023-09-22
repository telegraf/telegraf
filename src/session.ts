import { Context } from './context'
import { ExclusiveKeys, MaybePromise } from './core/helpers/util'
import { MiddlewareFn } from './middleware'
import d from 'debug'
const debug = d('telegraf:session')

export interface SyncSessionStore<T> {
  get: (name: string) => T | undefined
  set: (name: string, value: T) => void
  delete: (name: string) => void
}

export interface AsyncSessionStore<T> {
  get: (name: string) => Promise<T | undefined>
  set: (name: string, value: T) => Promise<unknown>
  delete: (name: string) => Promise<unknown>
}

export type SessionStore<T> = SyncSessionStore<T> | AsyncSessionStore<T>

interface SessionOptions<S, C extends Context, P extends string> {
  /** Customise the session prop. Defaults to "session" and is available as ctx.session. */
  property?: P
  getSessionKey?: (ctx: C) => MaybePromise<string | undefined>
  store?: SessionStore<S>
  defaultSession?: (ctx: C) => S
}

/** @deprecated session can use custom properties now. Construct this type directly. */
export interface SessionContext<S extends object> extends Context {
  session?: S
}

/**
 * Returns middleware that adds `ctx.session` for storing arbitrary state per session key.
 *
 * The default `getSessionKey` is `${ctx.from.id}:${ctx.chat.id}`.
 * If either `ctx.from` or `ctx.chat` is `undefined`, default session key and thus `ctx.session` are also `undefined`.
 *
 * > ⚠️ Session data is kept only in memory by default,  which means that all data will be lost when the process is terminated.
 * >
 * > If you want to persist data across process restarts, or share it among multiple instances, you should use
 * [@telegraf/session](https://www.npmjs.com/package/@telegraf/session), or pass custom `storage`.
 *
 * @see {@link https://github.com/feathers-studio/telegraf-docs/blob/b694bcc36b4f71fb1cd650a345c2009ab4d2a2a5/guide/session.md Telegraf Docs | Session}
 * @see {@link https://github.com/feathers-studio/telegraf-docs/blob/master/examples/session-bot.ts Example}
 */
export function session<
  S extends NonNullable<C[P]>,
  C extends Context & { [key in P]?: C[P] },
  P extends (ExclusiveKeys<C, Context> & string) | 'session' = 'session',
  // ^ Only allow prop names that aren't keys in base Context.
  // At type level, this is cosmetic. To not get cluttered with all Context keys.
>(options?: SessionOptions<S, C, P>): MiddlewareFn<C> {
  const prop = options?.property ?? ('session' as P)
  const getSessionKey = options?.getSessionKey ?? defaultGetSessionKey
  const store = options?.store ?? new MemorySessionStore()
  // caches value from store in-memory while simultaneous updates share it
  // when counter reaches 0, the cached ref will be freed from memory
  const cache = new Map<string, { ref?: S; counter: number }>()
  // temporarily stores concurrent requests
  const concurrents = new Map<string, MaybePromise<S | undefined>>()

  // this function must be handled with care
  // read full description on the original PR: https://github.com/telegraf/telegraf/pull/1713
  // make sure to update the tests in test/session.js if you make any changes or fix bugs here
  return async (ctx, next) => {
    const updId = ctx.update.update_id

    // because this is async, requests may still race here, but it will get autocorrected at (1)
    // v5 getSessionKey should probably be synchronous to avoid that
    const key = await getSessionKey(ctx)
    if (!key) {
      // Leaving this here could be useful to check for `prop in ctx` in future middleware
      ctx[prop] = undefined as unknown as S
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
      if (c) {
        // another request did beat us to the punch
        c.counter++
        // (1) preserve cached reference; in-memory reference is always newer than from store
        cached = c
      } else {
        // we're the first, so we must cache the reference
        cached = { ref: upstream ?? options?.defaultSession?.(ctx), counter: 1 }
        cache.set(key, cached)
      }
    }

    // TS already knows cached is always defined by this point, but does not guard cached.
    // It will, however, guard `c` here.
    const c = cached

    let touched = false

    Object.defineProperty(ctx, prop, {
      get() {
        touched = true
        return c.ref
      },
      set(value: S) {
        touched = true
        c.ref = value
      },
    })

    try {
      await next()
    } finally {
      if (--c.counter === 0) {
        // decrement to avoid memory leak
        debug(`(${updId}) refcounter reached 0, removing cached`)
        cache.delete(key)
      }
      debug(`(${updId}) middlewares completed, checking session`)

      // only update store if ctx.session was touched
      if (touched)
        if (ctx[prop] == null) {
          debug(`(${updId}) ctx.${prop} missing, removing from store`)
          await store.delete(key)
        } else {
          debug(`(${updId}) ctx.${prop} found, updating store`)
          await store.set(key, ctx[prop] as S)
        }
    }
  }
}

function defaultGetSessionKey(ctx: Context): string | undefined {
  const fromId = ctx.from?.id
  const chatId = ctx.chat?.id
  if (fromId == null || chatId == null) return undefined
  return `${fromId}:${chatId}`
}

/** @deprecated Use `Map` */
export class MemorySessionStore<T> implements SyncSessionStore<T> {
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

/** @deprecated session can use custom properties now. Directly use `'session' in ctx` instead */
export function isSessionContext<S extends object>(
  ctx: Context
): ctx is SessionContext<S> {
  return 'session' in ctx
}
