const https = require('https')
const Telegraf = require('../')
const { Markup } = require('../')

const config = {
  telegram: {
    agent: new https.Agent({
      keepAlive: true, // ✨ Perfomance magic!
      keepAliveMsecs: 5000
    })
  }
}

const replyOptions = Markup.inlineKeyboard([
  Markup.urlButton('❤️', 'http://telegraf.js.org')
]).extra()

const bot = new Telegraf(process.env.BOT_TOKEN, config)
bot.on('message', (ctx) => ctx.telegram.sendCopy(ctx.from.id, ctx.message, replyOptions))
bot.startPolling(60)
