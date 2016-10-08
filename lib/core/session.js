module.exports = function (opts) {
  opts = Object.assign({
    sessionName: 'session',
    getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`
  }, opts)

  const store = new Map()
  return (ctx, next) => {
    const key = opts.getSessionKey(ctx)
    if (!key) {
      return next()
    }
    let session = store.get(key) || {}
    Object.defineProperty(ctx, opts.sessionName, {
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
