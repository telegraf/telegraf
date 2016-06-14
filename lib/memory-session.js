var debug = require('debug')('telegraf:session-memory')

module.exports = function (opts) {
  var db = {}

  opts = Object.assign({
    getSessionKey: function (ctx) {
      return `${ctx.from.id}:${ctx.chat.id}`
    }
  }, opts)

  return (ctx, next) => {
    var key = opts.getSessionKey(ctx)
    if (!key) {
      return next()
    }
    var session = {}
    ctx.__defineGetter__('session', function () {
      return session
    })
    ctx.__defineSetter__('session', function (val) {
      session = Object.assign({}, val)
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
