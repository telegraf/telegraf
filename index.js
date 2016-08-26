module.exports = Object.assign(
  require('./lib/telegraf'),
  {
    Telegram: require('./lib/telegram/client'),
    Extra: require('./lib/telegram/extra'),
    Markup: require('./lib/telegram/reply-markup'),
    platform: require('./lib/telegram/platform'),
    memorySession: require('./lib/memory-session'),
    Composer: require('./lib/composer'),
    Router: require('./lib/router')
  }
)
