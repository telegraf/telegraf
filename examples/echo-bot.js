const Telegraf = require('../lib/telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('message', (ctx) => {
  return ctx.telegraf.sendCopy(ctx.from.id, ctx.message, {
    reply_markup: {
      inline_keyboard: [[{text: '❤️', url: 'http://telegraf.js.org'}]]
    }
  })
})

bot.startPolling()
