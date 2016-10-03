const Telegraf = require('../')
const { Extra, Markup } = require('../')

const gameShortName = 'your-game'
const gameUrl = 'https://your-game.tld'

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('start', (ctx) => ctx.replyWithGame(gameShortName))

bot.command('foo', (ctx) => {
  return ctx.replyWithGame(gameShortName, Extra.markup(
    Markup.inlineKeyboard([
      Markup.gameButton('🎮 Play now!'),
      Markup.urlButton('Telegraf help', 'http://telegraf.js.org')
    ])))
})

bot.gameQuery((ctx) => {
  console.log('Game query:', ctx.callbackQuery.game_short_name)
  return ctx.answerCallbackQuery(null, gameUrl)
})

bot.startPolling(60)
