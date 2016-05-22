var debug = require('debug')('telegraf:keyboard-bot')
var Telegraf = require('../lib/telegraf')

var telegraf = new Telegraf(process.env.BOT_TOKEN)
telegraf.use(Telegraf.memorySession())

telegraf.on('text', function * () {
  this.reply('Coke or Pepsi?', {
    reply_markup: {
      inline_keyboard: [[
        { text: `Coke - ${this.session.Coke || 0}`, callback_data: 'Coke' },
        { text: `Pepsi - ${this.session.Pepsi || 0}`, callback_data: 'Pepsi' }
      ]]
    }
  })
})

telegraf.on('callback_query', function * () {
  yield this.answerCallbackQuery()
  this.session[this.callbackQuery.data] = this.session[this.callbackQuery.data] || 0
  this.session[this.callbackQuery.data]++
  yield this.reply(`Oh, ${this.callbackQuery.data}! Great choise`)
})

telegraf.startPolling()
