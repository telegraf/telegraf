var debug = require('debug')('telegraf:keyboard-bot')
var Telegraf = require('../lib/app')

var app = new Telegraf(process.env.BOT_TOKEN)

app.on('text', function * () {
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

app.on('callback_query', function * () {
  this.reply(`Oh, ${this.callbackQuery.data}! Great choise`)
})

app.startPolling(10)
