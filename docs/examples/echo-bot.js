// Normal Node.js syntax
// const Telegraf = require('telegraf')
// const Extra = require('telegraf/extra')
// const Markup = require('telegraf/markup')

// This is way these modules should be imported with the new ES6 syntax
import Telegraf from 'telegraf';
import Extra from 'telegraf/extra.js';
import Markup from 'telegraf/markup.js';

const keyboard = Markup.inlineKeyboard([
  Markup.urlButton('❤️', 'http://telegraf.js.org'),
  Markup.callbackButton('Delete', 'delete')
])

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Hello'))
bot.help((ctx) => ctx.reply('Help message'))
bot.on('message', (ctx) => ctx.telegram.sendCopy(ctx.chat.id, ctx.message, Extra.markup(keyboard)))
bot.action('delete', ({ deleteMessage }) => deleteMessage())
bot.launch()
