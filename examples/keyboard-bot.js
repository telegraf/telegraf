const Telegraf = require('../lib/telegraf')
const SendOptions = Telegraf.SendOptions
const ReplyMarkup = Telegraf.SendOptions.ReplyMarkup

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('callback_query', (ctx) => {
  return ctx.answerCallbackQuery(`Oh, ${ctx.callbackQuery.data}! Great choise`, true)
})

bot.command('/inline', (ctx) => {
  return ctx.reply('<b>Coke</b> or <i>Pepsi?</i>', SendOptions.HTML().markup(
    ReplyMarkup.inlineKeyboard([
      { text: 'Coke', callback_data: 'Coke' },
      { text: 'Pepsi', callback_data: 'Pepsi' }
    ])))
})

bot.command('/keyboardonetime', (ctx) => {
  return ctx.reply('<b>Coke</b> or <i>Pepsi?</i>', SendOptions.HTML().markup(
    ReplyMarkup.keyboard(['Coke', 'Pepsi']).resize().oneTime()
  ))
})

bot.command(/\/keyboardwrap (\d+)/, (ctx) => {
  return ctx.reply('Keyboard wrap', SendOptions.markup(
    ReplyMarkup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {columns: parseInt(ctx.match[1])})
  ))
})

bot.command('/keyboarpyramid', (ctx) => {
  return ctx.reply('Keyboard wrap', SendOptions.markup(
    ReplyMarkup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
      wrap: (btn, index, currentRow) => currentRow.length >= (index + 1) / 2
    })
  ))
})

bot.command('/keyboard', (ctx) => {
  return ctx.replyWithHTML('<b>Coke</b> or <i>Pepsi?</i>', SendOptions.markup(
    ReplyMarkup.keyboard(['Coke', 'Pepsi'])
  ))
})

bot.startPolling()
