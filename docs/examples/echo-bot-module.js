// Modules documentation: https://telegraf.js.org/#/?id=telegraf-modules
// $> telegraf -t `BOT TOKEN` echo-bot-module.js
const { Composer, Extra, Markup } = require('telegraf')

const keyboard = Markup.inlineKeyboard([
  Markup.urlButton('❤️', 'http://telegraf.js.org'),
  Markup.callbackButton('Delete', 'delete')
])

const bot = new Composer()
bot.start((ctx) => ctx.replyWithDice())
bot.settings(async (ctx) => {
  await ctx.setMyCommands([
    {
      command: '/foo',
      description: 'foo description'
    },
    {
      command: '/bar',
      description: 'bar description'
    },
    {
      command: '/baz',
      description: 'baz description'
    }
  ])
  return ctx.reply('Ok')
})
bot.help(async (ctx) => {
  const commands = await ctx.getMyCommands()
  const info = commands.reduce((acc, val) => `${acc}/${val.command} - ${val.description}\n`, '')
  return ctx.reply(info)
})
bot.action('delete', ({ deleteMessage }) => deleteMessage())
bot.on('dice', (ctx) => ctx.reply(`Value: ${ctx.message.dice.value}`))
bot.on('message', (ctx) => ctx.copyMessage(ctx.chat.id, Extra.markup(keyboard)))

module.exports = bot
