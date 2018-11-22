module.exports = function (opts) {
  opts = Object.assign({
    property: 'session',
    getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`
  }, opts)

  const ttlMs = opts.ttl && opts.ttl * 1000
  const store = new Map()

  return (ctx, next) => {
    const key = opts.getSessionKey(ctx)
    if (!key) {
      return next(ctx)
    }
    const now = new Date().getTime()
    let { session, expires } = store.get(key) || { session: {} }
    if (expires && expires < now) {
      session = {}
    }
    Object.defineProperty(ctx, opts.property, {
      get: function () { return session },
      set: function (newValue) { session = Object.assign({}, newValue) }
    })
    return next(ctx).then(() => store.set(key, {
      session,
      expires: ttlMs ? now + ttlMs : null
    }))
  }
}
