const https = require('https')
const Telegraf = require('../')
const { Markup } = require('../')

const telegrafOptions = {
  telegram: {
    agent: new https.Agent({
      keepAlive: true, // ✨ Perfomance magic here!
      keepAliveMsecs: 5000
    })
  }
}

const bot = new Telegraf(process.env.BOT_TOKEN, telegrafOptions)

const replyOptions = Markup.inlineKeyboard([
  Markup.urlButton('❤️', 'http://telegraf.js.org')
]).extra()

bot.on('message', (ctx) => ctx.telegram.sendCopy(ctx.from.id, ctx.message, replyOptions))

bot.startPolling(60)
