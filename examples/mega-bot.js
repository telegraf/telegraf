const Telegraf = require('../lib/telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(Telegraf.memorySession())

// Logger middleware
bot.use((ctx, next) => {
  const start = new Date()
  return next().then(() => {
    const ms = new Date() - start
    console.log('response time %sms', ms)
  })
})

const sayYoMiddleware = (ctx, next) => {
  return ctx.reply('yo').then(() => {
    return next()
  })
}

// Random advice on some text messages
bot.on('text', (ctx, next) => {
  if (Math.random() > 0.5) {
    return Promise.all([
      ctx.reply('Highly advised to visit:'),
      ctx.replyWithLocation((Math.random() * 180) - 90, (Math.random() * 180) - 90),
      next()
    ])
  }
  return next()
})

// Text messages handling
bot.hears('Hey', sayYoMiddleware, (ctx) => {
  ctx.session.heyCounter = ctx.session.heyCounter || 0
  ctx.session.heyCounter++
  return ctx.reply(`_Hey counter:_ ${ctx.session.heyCounter}`, {parse_mode: 'Markdown'})
})

// Command handling
bot.hears('/answer', sayYoMiddleware, (ctx) => {
  console.log(ctx.message)
  return ctx.reply('*42*', {parse_mode: 'Markdown'})
})

// Wow! RegEx
bot.hears(/reverse (.+)/, (ctx) => {
  return ctx.reply(ctx.match[1].split('').reverse().join(''))
})

// Start polling
bot.startPolling()
