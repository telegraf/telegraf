const debug = require('debug')('telegraf:session-memory')

module.exports = function (opts) {
  opts = Object.assign({
    getSessionKey: function (ctx) {
      return `${ctx.from.id}:${ctx.chat.id}`
    }
  }, opts)

  const db = {}
  return (ctx, next) => {
    var key = opts.getSessionKey(ctx)
    if (!key) {
      return next()
    }
    var session = {}
    Object.defineProperty(ctx, 'session', {
      get: function () { return session },
      set: function (newValue) { session = Object.assign({}, newValue) }
    })
    debug('session key %s', key)
    try {
      session = db[key] || {}
      return next()
    } finally {
      debug('save session', session)
      db[key] = session
    }
  }
}
