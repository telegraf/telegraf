const Telegraf = require('../')
const { Markup } = require('../')

const replyOptions = Markup.inlineKeyboard([
  Markup.urlButton('❤️', 'http://telegraf.js.org'),
  Markup.callbackButton('Delele', 'delete')
]).extra()

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('message', async (ctx) => ctx.telegram.sendCopy(ctx.from.id, ctx.message, replyOptions))
bot.action('delete', (ctx) => ctx.deleteMessage())

bot.startPolling()
