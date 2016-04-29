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

// Sample middleware
var sayYoMiddleware = function * (next) {
  yield this.reply('yo')
  yield next
}

// Random advice bot!
app.on('text', function * () {
  if (Math.random() > 0.2) {
    return
  }
  yield this.reply('Highly advised to visit:')
  yield this.replyWithLocation((Math.random() * 180) - 90, (Math.random() * 180) - 90)
})

// Text messages handling
app.hears('Hey', sayYoMiddleware, function * () {
  this.reply('_Hey_', {parse_mode: 'Markdown'})
})

// Command handling
app.hears('/answer', sayYoMiddleware, function * () {
  debug(this.message)
  this.reply('*42*', {parse_mode: 'Markdown'})
})

// Wow! RegEx
app.hears(/reverse (.+)/, function * () {
  this.reply(this.match[1].split('').reverse().join(''))
})

// Start pooling with 10 seconds timeout
app.startPolling(10)
