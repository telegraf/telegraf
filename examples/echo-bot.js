const https = require('https')
const Telegraf = require('../')
const { Extra } = require('../')

const telegrafOptions = {
  telegram: {
    agent: new https.Agent({
      keepAlive: true, // ✨ Perfomance magic here!
      keepAliveMsecs: 5000
    })
  }
}

const bot = new Telegraf(process.env.BOT_TOKEN, telegrafOptions)

const replyOptions = Extra.markup((m) => m.inlineKeyboard([m.urlButton('❤️', 'http://telegraf.js.org')]))
bot.on('message', (ctx) => ctx.telegram.sendCopy(ctx.from.id, ctx.message, replyOptions))

bot.startPolling()
