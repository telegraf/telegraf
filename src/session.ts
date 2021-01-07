import { Context } from './context'
import { MaybePromise } from './composer'
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

export class MemorySessionStore<T> implements SessionStore<T> {
  private readonly ttl: number
  private readonly store = new Map<string, { session: T; expires: number }>()

  constructor(ttl = Infinity) {
    this.ttl = ttl * 1000
  }

  async get(name: string): Promise<T | undefined> {
    const entry = this.store.get(name)
    if (entry == null) {
      return undefined
    } else if (entry.expires < Date.now()) {
      await this.delete(name)
      return undefined
    }
    return entry.session
  }

  async set(name: string, value: T): Promise<void> {
    const now = Date.now()
    this.store.set(name, { session: value, expires: now + this.ttl })
  }

  async delete(name: string): Promise<void> {
    this.store.delete(name)
  }
}

export function isSessionContext<S extends object>(
  ctx: Context
): ctx is SessionContext<S> {
  return 'session' in ctx
}
