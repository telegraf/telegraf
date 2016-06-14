const Telegraf = require('../lib/telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('text', (ctx) => {
  return ctx.replyWithHTML('<b>Coke</b> or <i>Pepsi?</i>', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Coke', callback_data: 'Coke' },
        { text: 'Pepsi', callback_data: 'Pepsi' }
      ]]
    }
  })
})

bot.on('callback_query', (ctx) => {
  return ctx.answerCallbackQuery(`Oh, ${ctx.callbackQuery.data}! Great choise`, true)
})

bot.startPolling()
