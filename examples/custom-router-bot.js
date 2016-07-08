const Telegraf = require('../lib/telegraf')
const Router = Telegraf.Router
const Extra = Telegraf.Extra

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

const defaultMarkup = Extra.HTML().markup((markup) => markup.inlineKeyboard([
  { text: 'Add 1', callback_data: 'add:1' },
  { text: 'Add 10', callback_data: 'add:10' },
  { text: 'Add 100', callback_data: 'add:100' },
  { text: 'Substract 1', callback_data: 'sub:1' },
  { text: 'Substract 10', callback_data: 'sub:10' },
  { text: 'Substract 100', callback_data: 'sub:100' },
  { text: 'Clear', callback_data: 'clear' }
], {columns: 3}))

function editText (ctx) {
  const chatId = ctx.callbackQuery.message.chat.id
  const messageId = ctx.callbackQuery.message.message_id
  if (ctx.session.value !== 42) {
    return ctx.telegram.editMessageText(chatId, messageId, `Value: <b>${ctx.session.value}</b>`, defaultMarkup)
  }
  return ctx.answerCallbackQuery('🎉', true).then(() => ctx.telegram.editMessageText(chatId, messageId, `🎉 ${ctx.session.value} 🎉`))
}

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(Telegraf.memorySession())

bot.on('callback_query', callbackRouter.middleware())

bot.command('/start', (ctx) => {
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
