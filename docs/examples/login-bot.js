const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')

const keyboard = Markup.inlineKeyboard([
  Markup.loginButton('Login', 'http://domain.tld/hash', {
    bot_username: 'my_bot',
    request_write_access: 'true'
  }),
  Markup.urlButton('❤️', 'http://telegraf.js.org'),
  Markup.callbackButton('Delete', 'delete')
])

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Hello', Extra.markup(keyboard)))
bot.action('delete', ({ deleteMessage }) => deleteMessage())
bot.launch()
