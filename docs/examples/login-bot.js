const { Telegraf, Markup } = require('telegraf')

const keyboard = Markup.inlineKeyboard([
  Markup.button.login('Login', 'http://domain.tld/hash', {
    bot_username: 'my_bot',
    request_write_access: true
  }),
  Markup.button.url('❤️', 'http://telegraf.js.org'),
  Markup.button.callback('Delete', 'delete')
])

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Hello', keyboard))
bot.action('delete', ({ deleteMessage }) => deleteMessage())
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
