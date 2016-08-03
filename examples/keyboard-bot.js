const Telegraf = require('../')
const { Extra, Markup } = require('../')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('callback_query', (ctx) => {
  return ctx.answerCallbackQuery(`Oh, ${ctx.callbackQuery.data}! Great choise`)
})

bot.command('/onetime', (ctx) => {
  return ctx.reply('One time keyboard', Extra.markup((markup) => {
    return markup.resize()
      .oneTime()
      .keyboard([
        '/simple',
        '/inline',
        '/pyramid'
      ])
  }))
})

bot.command('/special', (ctx) => {
  return ctx.reply('Special buttons keyboard', Extra.markup((markup) => {
    return markup.resize()
      .keyboard([
        markup.contactRequestButton('Send contact'),
        markup.locationRequestButton('Send location')
      ])
  }))
})

bot.command(/\/wrap (\d+)/, (ctx) => {
  return ctx.reply('Keyboard wrap', Extra.markup(
    Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
      columns: parseInt(ctx.match[1])
    })
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
      Markup.callbackButton('Coke', 'Coke'),
      Markup.callbackButton('Pepsi', 'Pepsi')
    ])))
})

bot.command('/random', (ctx) => {
  return ctx.reply('random example', Extra.markup(
    Markup.inlineKeyboard([
      Markup.callbackButton('Coke', 'Coke'),
      Markup.callbackButton('Dr Pepper', 'Dr Pepper', undefined, Math.random() > 0.5),
      Markup.callbackButton('Pepsi', 'Pepsi')
    ])))
})

bot.startPolling(30)
