var Telegraf = require('../lib/telegraf')
var telegraf = new Telegraf(process.env.BOT_TOKEN)

telegraf.on('text', function * () {
  yield this.reply('Coke or Pepsi?', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: 'Coke', callback_data: 'Coke' },
        { text: 'Pepsi', callback_data: 'Pepsi' }
      ]]
    }
  })
})

telegraf.on('callback_query', function * () {
  yield this.answerCallbackQuery(`Oh, ${this.callbackQuery.data}! Great choise`, true)
})

telegraf.startPolling()
