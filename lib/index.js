const Telegraf = require('./telegraf')
Object.assign(Telegraf, {
  Telegram: require('./telegram'),
  TelegramError: require('./network/error'),
  Extra: require('./helpers/extra'),
  Markup: require('./helpers/markup'),
  memorySession: require('./core/session'),
  Composer: require('./core/composer'),
  Router: require('./core/router')
})
module.exports = Telegraf
