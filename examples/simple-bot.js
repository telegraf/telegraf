var debug = require('debug')('telegraf:simple-bot')
var Telegraf = require('../lib/app')

var app = new Telegraf(process.env.BOT_TOKEN)

// Sample middleware
var sayYoMiddleware = function * (next) {
  yield this.reply('yo')
  yield next
}
// Logger middleware
app.use(function * (next) {
  var start = new Date
  this.state.started = start
  yield next
  var ms = new Date - start
  debug('message from: %s, time: %sms', ms)
})

// Shared download middleware
var downloadMiddleware = function * (next) {
  debug('Downloading...')
  this.state.downloaded = true
  yield next
  debug('Cleanup downloads...')
}

// Middlewares, widdlewares everwhere
app.on('video', downloadMiddleware, function * (next) {
  debug(this.state)
})

// Random advice bot!
app.on('text', function * (next) {
  if (Math.random() < 0.3) {
    return
  }
  yield this.reply('Highly advised to visit:')
  yield this.replyWithLocation((Math.random() * 180) - 90, (Math.random() * 180) - 90)
})

// Text messages handling
app.hears('/answer', sayYoMiddleware, function * () {
  this.reply('`ⅢⅢⅢⅢⅢⅢⅢⅢⅢⅢⅢⅢⅡⅡⅡⅡ`\nⅢⅢⅢⅢⅢⅢⅢⅢⅢⅢⅢⅢⅡⅡⅡⅡ', {parse_mode: 'Markdown'})
})

// Wow! RegEx
app.hears(/reverse (.+)/, function * () {
  // Copy/Pasted from StackOverflow
  function reverse (s) {
    for (var i = s.length - 1, o = ''; i >= 0; o += s[i--]) { }
    return o
  }
  this.reply(reverse(this.match[1]))
})

app.startPolling()
