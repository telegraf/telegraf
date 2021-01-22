// npm install -g localtunnel && lt --port 3000
const { Telegraf } = require('telegraf')

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token)
bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }))
bot.on('text', (ctx) => ctx.replyWithHTML('<b>Hello</b>'))

// Start webhook directly
// bot.startWebhook('/secret-path', null, 3000)
// bot.telegram.setWebhook('https://---.localtunnel.me/secret-path')

// Start webhook via launch method (preferred)
bot.launch({
  webhook: {
    domain: 'https://---.localtunnel.me',
    port: 3000
  }
})

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
