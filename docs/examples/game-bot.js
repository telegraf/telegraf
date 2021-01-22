const { Telegraf, Markup } = require('telegraf')

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const gameShortName = 'your-game'
const gameUrl = 'https://your-game.tld'

const markup = Markup.inlineKeyboard([
  Markup.button.game('🎮 Play now!'),
  Markup.button.url('Telegraf help', 'http://telegraf.js.org')
])

const bot = new Telegraf(token)
bot.start((ctx) => ctx.replyWithGame(gameShortName))
bot.command('foo', (ctx) => ctx.replyWithGame(gameShortName, markup))
bot.gameQuery((ctx) => ctx.answerGameQuery(gameUrl))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
