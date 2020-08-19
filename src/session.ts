import TelegrafContext from './context'
import { Middleware } from './types'

export = function <TContext extends TelegrafContext, O>(opts: {
  property?: string
  store?: Map<string, unknown>
  getSessionKey?: (ctx: TContext) => string
  ttl?: number
}): Middleware.Fn<TContext> {
  const options = {
    property: 'session',
    store: new Map(),
    getSessionKey: (ctx: TContext) =>
      ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`,
    ...opts,
  }

  const ttlMs = options.ttl && options.ttl * 1000

  return async (ctx, next) => {
    const key = options.getSessionKey(ctx)
    if (!key) {
      return await (next as (ctx: TContext) => Promise<void>)(ctx)
    }
    const now = Date.now()
    const state = await Promise.resolve(options.store.get(key))
    let { session, expires } = state || { session: {} }
    if (expires && expires < now) {
      session = {}
    }
    Object.defineProperty(ctx, options.property, {
      get: function () {
        return session
      },
      set: function (newValue) {
        session = { ...newValue }
      },
    })
    await next()
    options.store.set(key, {
      session,
      expires: ttlMs ? now + ttlMs : null,
    })
  }
}
