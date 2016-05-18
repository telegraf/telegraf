var debug = require('debug')('telegraf:media-bot')
var Telegraf = require('../lib/telegraf')

var telegraf = new Telegraf(process.env.BOT_TOKEN)

// Download middleware
var downloadPhotoMiddleware = function * (next) {
  debug(`Downloading photo ${this.message.photo[0].file_id}...`)
  var link = yield telegraf.getFileLink(this.message.photo[0].file_id)
  this.state.fileLink = link
  yield next
  debug('Cleanup downloads...')
}

// Middlewares, widdlewares everwhere
telegraf.on('photo', downloadPhotoMiddleware, function * (next) {
  yield this.reply('Awesome!\n' + this.state.fileLink)
  // this.replyWithPhoto({ source: '/directory/file.jpeg' })
})

telegraf.startPolling()
