// https://core.telegram.org/bots#deep-linking
const Telegraf = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply(`Deep link payload: ${ctx.startPayload}`))
bot.launch()
