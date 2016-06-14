const fs = require('fs')
const Telegraf = require('../lib/telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

// Download middleware
const downloadPhotoMiddleware = (ctx, next) => {
  return bot.getFileLink(ctx.message.photo[0].file_id).then((link) => {
    ctx.state.fileLink = link
    return next()
  })
}

// Middlewares, widdlewares everwhere
bot.on('photo', downloadPhotoMiddleware, (ctx, next) => {
  return ctx.replyWithPhoto({ source: '/directory/file.jpeg' })
})

// Answer with cats
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
    })
  ])
})

bot.startPolling()
