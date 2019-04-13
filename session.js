module.exports = function (opts) {
  const options = Object.assign({
    property: 'session',
    store: new Map(),
    getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`
  }, opts)

  const ttlMs = options.ttl && options.ttl * 1000

  return (ctx, next) => {
    const key = options.getSessionKey(ctx)
    if (!key) {
      return next(ctx)
    }
    const now = new Date().getTime()
    return Promise.resolve(options.store.get(key))
      .then((state) => state || { session: {} })
      .then(({ session, expires }) => {
        if (expires && expires < now) {
          session = {}
        }
        Object.defineProperty(ctx, options.property, {
          get: function () { return session },
          set: function (newValue) { session = Object.assign({}, newValue) }
        })
        return next(ctx).then(() => options.store.set(key, {
          session,
          expires: ttlMs ? now + ttlMs : null
        }))
      })
  }
}
