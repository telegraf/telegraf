module.exports = function (opts) {
  opts = Object.assign({
    property: 'session',
    getSessionKey: function (ctx) {
      if (!ctx.from || !ctx.chat) {
        return
      }
      return `${ctx.from.id}:${ctx.chat.id}`
    }
  }, opts)

  const store = new Map()
  return (ctx, next) => {
    const key = opts.getSessionKey(ctx)
    if (!key) {
      return next()
    }
    var session = store.get(key) || {}
    Object.defineProperty(ctx, opts.property, {
      get: function () { return session },
      set: function (newValue) { session = Object.assign({}, newValue) }
    })
    try {
      return next()
    } finally {
      store.set(key, session)
    }
  }
}
