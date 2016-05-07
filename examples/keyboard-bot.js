var debug = require('debug')('telegraf:keyboard-bot')
var Telegraf = require('../lib/telegraf')

var telegraf = new Telegraf(process.env.BOT_TOKEN)

telegraf.on('text', function * () {
  // Very smart bot ;)
  this.reply('Coke or Pepsi?', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Coke', callback_data: 'Coke' },
        { text: 'Pepsi', callback_data: 'Pepsi' }
      ]]
    }
  })
})

telegraf.on('callback_query', function * () {
  yield telegraf.answerCallbackQuery(this.callbackQuery.id)
  yield this.reply(`Oh, ${this.callbackQuery.data}! Great choise`)
})

telegraf.startPolling()
