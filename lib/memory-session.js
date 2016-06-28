const debug = require('debug')('telegraf:session-memory')

module.exports = function (opts) {
  opts = Object.assign({
    getSessionKey: function (ctx) {
      return `${ctx.from.id}:${ctx.chat.id}`
    }
  }, opts)

  const db = new Map()
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
    session = db.get(key) || {}
    try {
      return next()
    } finally {
      debug('save session', session)
      db.set(key, session)
    }
  }
}
