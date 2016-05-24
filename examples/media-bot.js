var fs = require('fs')
var Telegraf = require('../lib/telegraf')

var telegraf = new Telegraf(process.env.BOT_TOKEN)

// Download middleware
var downloadPhotoMiddleware = function * (next) {
  var link = yield telegraf.getFileLink(this.message.photo[0].file_id)
  this.state.fileLink = link
  yield next
}

// Middlewares, widdlewares everwhere
telegraf.on('photo', downloadPhotoMiddleware, function * (next) {
  yield this.reply('Awesome!\n' + this.state.fileLink)
  yield this.replyWithPhoto({ source: '/directory/file.jpeg' })
})

// Answer with cats
telegraf.on('text', function * () {
  // file
  yield this.replyWithPhoto({
    source: '/example/cat.jpeg'
  })

  // Stream
  yield this.replyWithPhoto({
    source: fs.createReadStream('/example/cat2.jpeg')
  })

  // Buffer
  yield this.replyWithPhoto({
    source: fs.readFileSync('/example/cat3.jpeg')
  })

  // url
  yield this.replyWithPhoto({
    url: 'http://lorempixel.com/400/200/cats/'
  })
})

telegraf.startPolling()
