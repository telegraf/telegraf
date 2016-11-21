const fs = require('fs')
const Telegraf = require('../')

const bot = new Telegraf(process.env.BOT_TOKEN)

const downloadPhotoMiddleware = (ctx, next) => {
  return bot.getFileLink(ctx.message.photo[0].file_id)
    .then((link) => {
      ctx.state.fileLink = link
      return next()
    })
}

bot.on('photo', downloadPhotoMiddleware, (ctx, next) => {
  return ctx.replyWithPhoto({ source: '/directory/file.jpeg' })
})

bot.on('text', (ctx) => {
  return Promise.all([
    // file
    ctx.replyWithPhoto({
      source: '/example/cat.jpeg'
    }),

    // Stream
    ctx.replyWithPhoto({
      source: fs.createReadStream('/example/cat2.jpeg')
    }),

    // Buffer
    ctx.replyWithPhoto({
      source: fs.readFileSync('/example/cat3.jpeg')
    }),

    // url
    ctx.replyWithPhoto({
      url: 'http://lorempixel.com/400/200/cats/'
    }),

    // url via Telegram servers
    ctx.replyWithPhoto('http://lorempixel.com/400/200/cats/')
  ])
})

bot.startPolling()
