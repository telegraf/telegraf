const Telegraf = require('./telegraf')
Object.assign(Telegraf, {
  Telegram: require('./telegram'),
  TelegramError: require('./network/error'),
  Extra: require('./extra'),
  Markup: require('./markup'),
  memorySession: require('./core/session'),
  Composer: require('./composer'),
  Router: require('./router'),
  Flow: require('./flow')
})
module.exports = Telegraf
