var debug = require('debug')('telegraf:keyboard-bot')
var Telegraf = require('../lib/app')

var app = new Telegraf(process.env.BOT_TOKEN)

app.hears('/start', function * () {
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
  this.reply(`Oh, ${this.callbackQuery.data}! Great choise\nWhat about smartphones?`, {
    reply_markup: {
      one_time_keyboard: true,
      keyboard: [
        ['iPhone', 'Android'],
        ['Blackberry']
      ]
    }
  })
})

app.hears(/(iPhone)|(Android)|(Blackberry)/, function * () {
  this.reply(`Yeah, ${this.match[1]} is pretty good.`)
})

app.startPolling(10)
