/* eslint-disable @typescript-eslint/no-floating-promises */
import { Scenes, session, Telegraf } from 'telegraf'

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

// Handler factories
const { enter, leave } = Scenes.Stage

// Greeter scene
const greeterScene = new Scenes.BaseScene<Scenes.SceneContext>('greeter')
greeterScene.enter((ctx) => ctx.reply('Hi'))
greeterScene.leave((ctx) => ctx.reply('Bye'))
greeterScene.hears('hi', enter<Scenes.SceneContext>('greeter'))
greeterScene.on('message', (ctx) => ctx.replyWithMarkdown('Send `hi`'))

// Echo scene
const echoScene = new Scenes.BaseScene<Scenes.SceneContext>('echo')
echoScene.enter((ctx) => ctx.reply('echo scene'))
echoScene.leave((ctx) => ctx.reply('exiting echo scene'))
echoScene.command('back', leave<Scenes.SceneContext>())
echoScene.on('text', (ctx) => ctx.reply(ctx.message.text))
echoScene.on('message', (ctx) => ctx.reply('Only text messages please'))

const bot = new Telegraf<Scenes.SceneContext>(token)

const stage = new Scenes.Stage<Scenes.SceneContext>([greeterScene, echoScene], {
  ttl: 10,
})
bot.use(session())
bot.use(stage.middleware())
bot.command('greeter', (ctx) => ctx.scene.enter('greeter'))
bot.command('echo', (ctx) => ctx.scene.enter('echo'))
bot.on('message', (ctx) => ctx.reply('Try /echo or /greeter'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
