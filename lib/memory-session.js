module.exports = function (opts) {
  opts = Object.assign({
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
    var session = {}
    Object.defineProperty(ctx, 'session', {
      get: function () { return session },
      set: function (newValue) { session = Object.assign({}, newValue) }
    })
    session = store.get(key) || {}
    try {
      return next()
    } finally {
      store.set(key, session)
    }
  }
}
