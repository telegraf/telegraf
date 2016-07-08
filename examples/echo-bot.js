const https = require('https')
const Telegraf = require('../lib/telegraf')
const Extra = Telegraf.Extra

const telegrafOptions = {
  telegram: {
    agent: new https.Agent({
      keepAlive: true, // ✨ Magic here!
      keepAliveMsecs: 5000
    })
  }
}

const bot = new Telegraf(process.env.BOT_TOKEN, telegrafOptions)
const replyOptions = Extra.markup((m) => m.inlineKeyboard([{text: '❤️', url: 'http://telegraf.js.org'}]))

bot.on('message', (ctx) => ctx.telegram.sendCopy(ctx.from.id, ctx.message, replyOptions))
bot.startPolling()
