module.exports = Object.assign(
  require('./lib/telegraf'),
  require('./lib/utils'),
  {
    Composer: require('./lib/composer'),
    Extra: require('./lib/extra'),
    Markup: require('./lib/reply-markup'),
    memorySession: require('./lib/memory-session'),
    platform: require('./lib/platform'),
    Router: require('./lib/router'),
    Telegram: require('./lib/telegram')
  }
)
