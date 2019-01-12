// npm install -g localtunnel && lt --port 3000
const Telegraf = require('../..')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }))
bot.on('text', ({ replyWithHTML }) => replyWithHTML('<b>Hello</b>'))

// Start webhook directly
// bot.startWebhook('/secret-path', null, 3000)
// bot.telegram.setWebhook('https://---.localtunnel.me/secret-path')

// Start webhook via launch (preffered)
bot.launch({
  webhook: {
    domain: 'https://---.localtunnel.me',
    port: 3000
  }
})
