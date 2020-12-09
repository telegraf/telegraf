import { Context } from './context'
import { Middleware } from './types'

export interface Storage<T> {
  makeKey: (ctx: Context) => Promise<string | undefined>
  getItem: (name: string) => Promise<T | undefined>
  setItem: (name: string, value: T) => Promise<void>
  deleteItem: (name: string) => Promise<void>
}

export class MemorySessionStorage<T> implements Storage<T> {
  private readonly ttl: number
  private readonly store = new Map<string, { session: T; expires: number }>()

  constructor(ttl = Infinity) {
    this.ttl = ttl * 1000
  }

  async makeKey(ctx: Context): Promise<string | undefined> {
    const fromId = ctx.callbackQuery?.from?.id ?? ctx.from?.id ?? null
    const chatId = ctx.callbackQuery?.message?.chat.id ?? ctx.chat?.id ?? null
    if (fromId == null || chatId == null) {
      return undefined
    }
    return `${fromId}:${chatId}`
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

export function session<SessionData extends object>(
  storage: Storage<SessionData> = new MemorySessionStorage<SessionData>()
): Middleware.ExtFn<Context, { session?: SessionData }> {
  return async (ctx, next) => {
    const key = await storage.makeKey(ctx)
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
