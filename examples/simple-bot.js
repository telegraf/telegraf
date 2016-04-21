var debug = require('debug')('telegraf:simple-bot')
var Telegraf = require('../lib/app')

var app = new Telegraf(process.env.BOT_TOKEN)

// Logger middleware
app.use(function * (next) {
  var start = new Date()
  this.state.started = start
  yield next
  var ms = new Date() - start
  debug('time: %sms', ms)
})

// Random advice bot!
app.on('text', function * (next) {
  if (Math.random() < 0.3) {
    return
  }
  yield this.reply('Highly advised to visit:')
  yield this.replyWithLocation((Math.random() * 180) - 90, (Math.random() * 180) - 90)
})

// Sample middleware
var sayYoMiddleware = function * (next) {
  yield this.reply('yo')
  yield next
}

// Text messages handling
app.hears('/answer', sayYoMiddleware, function * () {
  this.reply('*12*', {parse_mode: 'Markdown'})
})

// Wow! RegEx
app.hears(/reverse (.+)/, sayYoMiddleware, function * () {
  this.reply(this.match[1].split('').reverse().join(''))
})

// Start pooling with 10 seconds timeout
app.startPolling(10)
