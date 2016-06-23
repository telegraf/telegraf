const https = require('https')
const Telegraf = require('../lib/telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    agent: new https.Agent({
      keepAlive: true, // ✨ Magic here!
      keepAliveMsecs: 5000
    })
  }
})

bot.telegram.removeWebHook()

bot.on(['text', 'sticker'], (ctx) => {
  return ctx.telegram.sendCopy(ctx.from.id, ctx.message, {
    reply_markup: {
      inline_keyboard: [[{text: '❤️', url: 'http://telegraf.js.org'}]]
    }
  })
})

bot.startPolling(10, 50, 50)
