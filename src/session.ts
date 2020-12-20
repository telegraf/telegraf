import { Context } from './context'
import { Middleware } from './types'

export interface Storage<T> {
  getItem: (name: string) => Promise<T | undefined>
  setItem: (name: string, value: T) => Promise<void>
  deleteItem: (name: string) => Promise<void>
}

interface SessionOptions<S extends object> {
  makeKey?: (ctx: Context) => Promise<string | undefined>
  storage?: Storage<S>
}

interface SessionContainer<S extends object> {
  session: S
}

export interface SessionContext<S extends object>
  extends Context,
    SessionContainer<S> {}

/**
 * session middleware
 *
 * more 3rd-party session middlware
 *
 * see https://npm.im/search?q=telegraf-session
 */
export function session<S extends object>(
  options?: SessionOptions<S>
): Middleware.ExtFn<Context, Partial<SessionContainer<S>>> {
  const makeKey = options?.makeKey ?? makeDefaultKey
  const storage = options?.storage ?? new MemorySessionStorage()
  return async (ctx, next) => {
    const key = await makeKey(ctx)
    if (key == null) {
      return await next(ctx)
    }
    const entry = await storage.getItem(key)
    const ctx2 = Object.assign(ctx, { session: entry })
    await next(ctx2)
    if (ctx2.session == null) {
      await storage.deleteItem(key)
    } else {
      await storage.setItem(key, ctx2.session)
    }
  }
}

async function makeDefaultKey(ctx: Context): Promise<string | undefined> {
  const fromId = ctx.from?.id
  const chatId = ctx.chat?.id
  if (fromId == null || chatId == null) {
    return undefined
  }
  return `${fromId}:${chatId}`
}

export class MemorySessionStorage<T> implements Storage<T> {
  private readonly ttl: number
  private readonly store = new Map<string, { session: T; expires: number }>()

  constructor(ttl = Infinity) {
    this.ttl = ttl * 1000
  }

  async getItem(name: string): Promise<T | undefined> {
    const entry = this.store.get(name)
    if (entry == null) {
      return undefined
    } else if (entry.expires < Date.now()) {
      await this.deleteItem(name)
      return undefined
    }
    return entry.session
  }

  async setItem(name: string, value: T): Promise<void> {
    const now = Date.now()
    this.store.set(name, { session: value, expires: now + this.ttl })
  }

  async deleteItem(name: string): Promise<void> {
    this.store.delete(name)
  }
}

export function isSessionContext<S extends object>(
  ctx: Context
): ctx is SessionContext<S> {
  return 'session' in ctx
}
