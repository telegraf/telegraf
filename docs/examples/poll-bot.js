const Telegraf = require('telegraf')
const { Composer } = Telegraf

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.telegram.sendPoll('-100500100500100', '2b|!2b', ['True', 'False']))
bot.command('poll', Composer.groupChat(
  (ctx) => ctx.replyWithPoll('2b|!2b', ['True', 'False'])
))
bot.launch()
