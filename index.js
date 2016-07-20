const { compose, mount, hears } = require('./lib/utils')

module.exports = require('./lib/telegraf')
module.exports.Telegram = require('./lib/telegram')
module.exports.Router = require('./lib/router')
module.exports.Extra = require('./lib/extra')
module.exports.Markup = require('./lib/reply-markup')
module.exports.memorySession = require('./lib/memory-session')
module.exports.platform = require('./lib/platform')
module.exports.compose = compose
module.exports.mount = mount
module.exports.hears = hears
