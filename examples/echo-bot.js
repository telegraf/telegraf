const https = require('https')
const Telegraf = require('../lib/telegraf')

const replyOptions = {
  reply_markup: {
    inline_keyboard: [[{text: '❤️', url: 'http://telegraf.js.org'}]]
  }
}

const telegrafOptions = {
  telegram: {
    agent: new https.Agent({
      keepAlive: true, // ✨ Magic here!
      keepAliveMsecs: 5000
    })
  }
}

const bot = new Telegraf(process.env.BOT_TOKEN, telegrafOptions)

bot.on('message', (ctx) => ctx.telegram.sendCopy(ctx.from.id, ctx.message, replyOptions))

bot.startPolling()
