const Telegraf = require('../../')
const Markup = require('../../markup')

const replyOptions = Markup.inlineKeyboard([
  Markup.urlButton('❤️', 'http://telegraf.js.org'),
  Markup.callbackButton('Delete', 'delete')
]).extra()

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Hey there!'))
bot.on('message', (ctx) => ctx.telegram.sendCopy(ctx.from.id, ctx.message, replyOptions))
bot.action('delete', ({ deleteMessage }) => deleteMessage())
bot.startPolling()
