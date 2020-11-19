const { Telegraf, Markup } = require('telegraf')

const gameShortName = 'your-game'
const gameUrl = 'https://your-game.tld'

const markup = Markup.inlineKeyboard([
  Markup.button.game('🎮 Play now!'),
  Markup.button.url('Telegraf help', 'http://telegraf.js.org')
])

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start(({ replyWithGame }) => replyWithGame(gameShortName))
bot.command('foo', ({ replyWithGame }) => replyWithGame(gameShortName, markup))
bot.gameQuery(({ answerGameQuery }) => answerGameQuery(gameUrl))
bot.launch()
