const Telegraf = require('../lib/telegraf')
const Extra = Telegraf.Extra
const Markup = Telegraf.Extra.Markup

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('callback_query', (ctx) => {
  return ctx.answerCallbackQuery(`Oh, ${ctx.callbackQuery.data}! Great choise`, true)
})

bot.command('/onetime', (ctx) => {
  return ctx.reply('<b>Coke</b> or <i>Pepsi?</i>', Extra
    .HTML()
    .markup((markup) => markup.keyboard(['Coke', 'Pepsi']).resize().oneTime())
  )
})

bot.command(/\/wrap (\d+)/, (ctx) => {
  return ctx.reply('Keyboard wrap', Extra.markup(
    Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {columns: parseInt(ctx.match[1])})
  ))
})

bot.command('/pyramid', (ctx) => {
  return ctx.reply('Keyboard wrap', Extra.markup(
    Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
      wrap: (btn, index, currentRow) => currentRow.length >= (index + 1) / 2
    })
  ))
})

bot.command('/simple', (ctx) => {
  return ctx.replyWithHTML('<b>Coke</b> or <i>Pepsi?</i>', Extra.markup(
    Markup.keyboard(['Coke', 'Pepsi'])
  ))
})

bot.command('/inline', (ctx) => {
  return ctx.reply('<b>Coke</b> or <i>Pepsi?</i>', Extra.HTML().markup(
    Markup.inlineKeyboard([
      { text: 'Coke', callback_data: 'Coke' },
      { text: 'Pepsi', callback_data: 'Pepsi' }
    ])))
})

bot.startPolling()
