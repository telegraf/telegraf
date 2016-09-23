module.exports = require('./lib/telegraf')
Object.assign(module.exports, {
  Telegram: require('./lib/telegram/client'),
  Extra: require('./lib/telegram/extra'),
  Markup: require('./lib/telegram/reply-markup'),
  memorySession: require('./lib/memory-session'),
  Composer: require('./lib/composer'),
  Router: require('./lib/router')
})
