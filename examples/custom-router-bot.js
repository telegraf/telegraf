const Telegraf = require('../')
const { Router, Extra, memorySession } = require('../')

const defaultMarkup = Extra.HTML().markup((markup) => markup.inlineKeyboard([
  markup.callbackButton('Add 1', 'add:1'),
  markup.callbackButton('Add 10', 'add:10'),
  markup.callbackButton('Add 100', 'add:100'),
  markup.callbackButton('Substract 1', 'sub:1'),
  markup.callbackButton('Substract 10', 'sub:10'),
  markup.callbackButton('Substract 100', 'sub:100'),
  markup.callbackButton('Clear', 'clear')
], {columns: 3}))

const callbackRouter = new Router((ctx) => {
  if (!ctx.callbackQuery.data) {
    return Promise.resolve()
  }
  const parts = ctx.callbackQuery.data.split(':')
  return Promise.resolve({
    route: parts[0],
    state: {
      amount: parseInt(parts[1], 10) || 0
    }
  })
})

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(memorySession())
bot.on('callback_query', callbackRouter.middleware())

bot.command('start', (ctx) => {
  ctx.session.value = 0
  return ctx.reply(`Value: <b>${ctx.session.value}</b>`, defaultMarkup)
})

callbackRouter.on('add', (ctx) => {
  ctx.session.value = (ctx.session.value || 0) + ctx.state.amount
  return editText(ctx)
})

callbackRouter.on('sub', (ctx) => {
  ctx.session.value = (ctx.session.value || 0) - ctx.state.amount
  return editText(ctx)
})

callbackRouter.on('clear', (ctx) => {
  ctx.session.value = 0
  return editText(ctx)
})

bot.startPolling(30)


function editText (ctx) {
  return ctx.session.value !== 42
    ? ctx.editMessageText(`Value: <b>${ctx.session.value}</b>`, defaultMarkup).catch(() => undefined)
    : ctx.answerCallbackQuery('🎉', true).then(() => ctx.editMessageText(`🎉 ${ctx.session.value} 🎉`))
}

