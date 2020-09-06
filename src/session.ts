import { Context } from './context'
import { Middleware } from './types'

export function session<SessionData extends object>({
  ttl = Infinity,
  store = new Map<string, { expires: number; session: SessionData }>(),
  getSessionKey = (ctx: Context) =>
    ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`,
} = {}): Middleware.ExtFn<Context, { session?: SessionData }> {
  const ttlMs = ttl * 1000

  return async (ctx, next) => {
    const key = getSessionKey(ctx)
    if (key == null) {
      return await next(ctx)
    }
    const now = Date.now()
    const entry = store.get(key)
    const ctx2 = Object.assign(ctx, {
      session: entry == null || entry.expires < now ? undefined : entry.session,
    })
    await next(ctx2)
    if (ctx2.session == null) {
      store.delete(key)
    } else {
      store.set(key, { session: ctx2.session, expires: now + ttlMs })
    }
  }
}
