import { Context } from './context'
import { MaybePromise } from './util'
import { MiddlewareFn } from './middleware'

export interface SessionStore<T> {
  get: (name: string) => MaybePromise<T | undefined>
  set: (name: string, value: T) => MaybePromise<void>
  delete: (name: string) => MaybePromise<void>
}

interface SessionOptions<S extends object> {
  getSessionKey?: (ctx: Context) => Promise<string | undefined>
  store?: SessionStore<S>
}

export interface SessionContext<S extends object> extends Context {
  session?: S
}

/**
 * Returns middleware that adds `ctx.session` for storing arbitrary state per session key.
 *
 * The default `getSessionKey` is <code>\`${ctx.from.id}:${ctx.chat.id}\`</code>.
 * If either `ctx.from` or `ctx.chat` is `undefined`, default session key and thus `ctx.session` are also `undefined`.
 *
 * Session data is kept only in memory by default,
 * which means that all data will be lost when the process is terminated.
 * If you want to store data across restarts, or share it among workers,
 * you can [install persistent session middleware from npm](https://www.npmjs.com/search?q=telegraf-session),
 * or pass custom `storage`.
 *
 * @example https://github.com/telegraf/telegraf/blob/develop/docs/examples/session-bot.ts
 * @deprecated https://github.com/telegraf/telegraf/issues/1372#issuecomment-782668499
 */
export function session<S extends object>(
  options?: SessionOptions<S>
): MiddlewareFn<SessionContext<S>> {
  const getSessionKey = options?.getSessionKey ?? defaultGetSessionKey
  const store = options?.store ?? new MemorySessionStore()
  return async (ctx, next) => {
    const key = await getSessionKey(ctx)
    if (key == null) {
      return await next()
    }
    ctx.session = await store.get(key)
    await next()
    if (ctx.session == null) {
      await store.delete(key)
    } else {
      await store.set(key, ctx.session)
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
