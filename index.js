module.exports = require('./lib/telegraf')
Object.assign(module.exports, {
  Telegram: require('./lib/telegram/client'),
  TelegramError: require('./lib/telegram/error'),
  Extra: require('./lib/telegram/extra'),
  Markup: require('./lib/telegram/reply-markup'),
  memorySession: require('./lib/session'),
  Composer: require('./lib/composer'),
  Router: require('./lib/router')
})
