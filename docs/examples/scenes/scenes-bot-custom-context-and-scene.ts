/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  BaseScene as Scene,
  SceneContext,
  SceneContextScene,
  session,
  Stage,
  Telegraf,
} from 'telegraf'

/**
 * We can extend the scene object itself by extending `SceneContextScene`. Note
 * that you need to pass your context object as type variable.
 */
interface MyScene extends SceneContextScene<MyContext> {
  // will be available under `ctx.scene.mySceneProp`
  mySceneProp: number
}

/**
 * Now that we have our session object, we can define our own context object.
 * Again, as we're using scenes, we now have to extend `SceneContext`.
 */
interface MyContext extends SceneContext<MyScene> {
  // will be available under `ctx.myContextProp`
  myContextProp: string
}

// Handler factories
const { enter, leave } = Stage

// Greeter scene
const greeterScene = new Scene<MyContext>('greeter')
greeterScene.enter((ctx) => ctx.reply('Hi'))
greeterScene.leave((ctx) => ctx.reply('Bye'))
greeterScene.hears('hi', enter('greeter'))
greeterScene.on('message', (ctx) => ctx.replyWithMarkdown('Send `hi`'))

// Echo scene
const echoScene = new Scene<MyContext>('echo')
echoScene.enter((ctx) => ctx.reply('echo scene'))
echoScene.leave((ctx) => ctx.reply('exiting echo scene'))
echoScene.command('back', leave())
echoScene.on('text', (ctx) => ctx.reply(ctx.message.text))
echoScene.on('message', (ctx) => ctx.reply('Only text messages please'))

const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN)

const stage = new Stage<MyContext>([greeterScene, echoScene], {
  ttl: 10,
})
bot.use(session())
bot.use(stage.middleware())
bot.use((ctx, next) => {
  // we now have access to the the fields defined above
  ctx.myContextProp ??= ''
  ctx.scene.mySceneProp ??= 0
  return next()
})
bot.command('greeter', (ctx) => ctx.scene.enter('greeter'))
bot.command('echo', (ctx) => ctx.scene.enter('echo'))
bot.on('message', (ctx) => ctx.reply('Try /echo or /greeter'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
