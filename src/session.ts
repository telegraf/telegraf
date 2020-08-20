import Context from './context'
import { Middleware } from './types'

interface Options<SessionData extends object, Prop extends string = 'session'> {
  getSessionKey?: (ctx: Context) => string | undefined
  property?: Prop
  store?: Map<string, { session: SessionData | {}; expires: number }>
  ttl?: number
}

function session<SessionData extends object, Prop extends string = 'session'>(
  opts: Options<SessionData, Prop> = {}
): Middleware.Ext<Record<Prop, SessionData | {}>> {
  const options: Required<Options<SessionData, Prop>> = {
    // @ts-expect-error
    property: 'session',
    store: new Map(),
    ttl: Infinity,
    getSessionKey: (ctx) =>
      ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`,
    ...opts,
  }

  const ttlMs = options.ttl * 1000

  return (ctx, next) => {
    const key = options.getSessionKey(ctx)
    if (key == null) {
      return next(ctx)
    }
    const now = Date.now()
    return Promise.resolve(options.store.get(key))
      .then((state) => state ?? { expires: -Infinity, session: {} })
      .then(({ session, expires }) => {
        if (expires < now) {
          session = {}
        }
        // prettier-ignore
        Object.defineProperty(ctx, options.property, {
          get: function () { return session },
          set: function (newValue) { session = { ...newValue } }
        })
        return next(ctx as any).then(() => {
          options.store.set(key, { session, expires: now + ttlMs })
        })
      })
  }
}

export = session
