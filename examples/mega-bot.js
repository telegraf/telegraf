var Telegraf = require('../lib/telegraf')

var telegraf = new Telegraf(process.env.BOT_TOKEN)

telegraf.use(Telegraf.memorySession())

// Logger middleware
var loggerMiddleware = function * (next) {
  var start = new Date()
  this.state.started = start
  yield next
  var ms = new Date() - start
  console.log('time: %sms', ms)
}

telegraf.use(loggerMiddleware)

// Sample middleware
var sayYoMiddleware = function * (next) {
  yield this.reply('yo')
  yield next
}

// Random advice on some text messages
telegraf.on('text', function * (next) {
  if (Math.random() > 0.5) {
    yield this.reply('Highly advised to visit:')
    yield this.replyWithLocation((Math.random() * 180) - 90, (Math.random() * 180) - 90)
  }
  yield next
})

// Text messages handling
telegraf.hears('Hey', sayYoMiddleware, function * () {
  this.session.heyCounter = this.session.heyCounter || 0
  this.session.heyCounter++
  this.reply(`_Hey counter:_ ${this.session.heyCounter}`, {parse_mode: 'Markdown'})
})

// Command handling
telegraf.hears('/answer', sayYoMiddleware, function * () {
  console.log(this.message)
  this.reply('*42*', {parse_mode: 'Markdown'})
})

// Wow! RegEx
telegraf.hears(/reverse (.+)/, function * () {
  this.reply(this.match[1].split('').reverse().join(''))
})

// Start polling
telegraf.startPolling()
