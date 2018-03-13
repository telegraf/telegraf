const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Markup = require('telegraf/markup')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { enter } = Stage

const sceneCleaner = () => async (ctx) => {
  ctx.scene.state.messages.forEach(({ message_id: id }) => {
    try {
      ctx.deleteMessage(id)
    } catch (error) {
      console.log(error)
    }
  })
}

const replyKeyboard = () => Markup.keyboard([
  Markup.button('First'),
  Markup.button('Second')
]).extra()

const firstScene = new Scene('first')
  .enter(async (ctx) => {
    const messages = []
    messages.push(await ctx.reply('First scene, first message'))
    messages.push(await ctx.reply('First scene, second message'))
    messages.push(await ctx.reply('First scene, third message'), replyKeyboard())
    ctx.scene.state.messages = messages
  })
  .leave(sceneCleaner())

const secondScene = new Scene('second')
  .enter(async (ctx) => {
    const messages = []
    messages.push(await ctx.reply('Second scene, first message'))
    messages.push(await ctx.reply('Second scene, second message'))
    messages.push(await ctx.reply('Second scene, third message'), replyKeyboard())
    ctx.scene.state.messages = messages
  })
  .leave(sceneCleaner())

const bot = new Telegraf(process.env.BOT_TOKEN)
const stage = new Stage([firstScene, secondScene], { ttl: 10 })

bot.use(session())
bot.use(stage.middleware())

bot.start(async (ctx) => enter('first'))
bot.hears(/^First|Second$/, async (ctx) => enter(ctx.match[0].toLowerCase()))

bot.startPolling()
