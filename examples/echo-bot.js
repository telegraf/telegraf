var Telegraf = require('../lib/telegraf')
var telegraf = new Telegraf(process.env.BOT_TOKEN)

telegraf.on('message', function * () {
  yield this.telegraf.sendCopy(this.from.id, this.message, {
    reply_markup: {
      inline_keyboard: [[{text: '❤️', url: 'http://telegraf.js.org'}]]
    }
  })
})

telegraf.startPolling()
