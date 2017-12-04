const Telegraf = require('telegraf')
const Router = require('telegraf/router')
const Extra = require('telegraf/extra')
const session = require('telegraf/session')

const markup = Extra
  .HTML()
  .markup((m) => m.inlineKeyboard([
    m.callbackButton('Add 1', 'add:1'),
    m.callbackButton('Add 10', 'add:10'),
    m.callbackButton('Add 100', 'add:100'),
    m.callbackButton('Subtract 1', 'sub:1'),
    m.callbackButton('Subtract 10', 'sub:10'),
    m.callbackButton('Subtract 100', 'sub:100'),
    m.callbackButton('🐈', Math.random().toString(36).slice(2)),
    m.callbackButton('Clear', 'clear')
  ], {columns: 3}))

const calculator = new Router(({ callbackQuery }) => {
  if (!callbackQuery.data) {
    return
  }
  const parts = callbackQuery.data.split(':')
  return {
    route: parts[0],
    state: {
      amount: parseInt(parts[1], 10) || 0
    }
  }
})

calculator.on('add', (ctx) => {
  ctx.session.value = (ctx.session.value || 0) + ctx.state.amount
  return editText(ctx)
})

calculator.on('sub', (ctx) => {
  ctx.session.value = (ctx.session.value || 0) - ctx.state.amount
  return editText(ctx)
})

calculator.on('clear', (ctx) => {
  ctx.session.value = 0
  return editText(ctx)
})

calculator.otherwise((ctx) => ctx.reply('🌯'))

function editText (ctx) {
  if (ctx.session.value === 42) {
    return ctx.answerCbQuery('Answer to the Ultimate Question of Life, the Universe, and Everything', true)
      .then(() => ctx.editMessageText('🎆'))
  }
  return ctx.editMessageText(`Value: <b>${ctx.session.value}</b>`, markup).catch(() => undefined)
}

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session({ ttl: 10 }))
bot.start((ctx) => {
  ctx.session.value = 0
  return ctx.reply(`Value: <b>${ctx.session.value}</b>`, markup)
})
bot.on('callback_query', calculator)
bot.startPolling()
