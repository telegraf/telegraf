module.exports = require('./lib/telegraf')
Object.assign(module.exports, {
  Telegram: require('./lib/telegram'),
  TelegramError: require('./lib/network/error'),
  Extra: require('./lib/helpers/extra'),
  Markup: require('./lib/helpers/reply-markup'),
  memorySession: require('./lib/core/session'),
  Composer: require('./lib/core/composer'),
  Router: require('./lib/core/router')
})
