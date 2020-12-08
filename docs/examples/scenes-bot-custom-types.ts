/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  BaseScene as Scene,
  SceneContext,
  SceneSession,
  SceneSessionData,
  session,
  Stage,
  Telegraf,
} from 'telegraf'

// Handler factories
const { enter, leave } = Stage

/**
 * Scenes have their own session data. We can define their shape by extending
 * `SceneSessionData`.
 */
interface MySceneSession extends SceneSessionData {
  mySceneSessionProp: number
}

/**
 * We can still define our regular session object. However, as we're using
 * scenes, we have to extend `SceneSession`. If we defined our own scene session
 * data, we have to add this as a generic argument to `SceneSession`.
 */
interface MySession extends SceneSession<MySceneSession> {
  mySessionProp: number
}

/**
 * Now that we have our session object, we can define our own context object.
 * Remember to extend `SceneContext`. If we defined our or scene session data,
 * we have to add it here as a type variable.
 *
 * As we also want to use our own session object, we have to set it here under
 * the `session` property.
 */
interface MyContext extends SceneContext<MySceneSession> {
  myContextProp: string
  session: MySession
}

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

const bot = new Telegraf<SceneContext<MySceneSession, MyContext>>(
  process.env.BOT_TOKEN
)

const stage = new Stage<MySceneSession, MyContext>([greeterScene, echoScene], {
  ttl: 10,
})
bot.use(session())
bot.use(stage.middleware())
bot.command('greeter', (ctx) => ctx.scene.enter('greeter'))
bot.command('echo', (ctx) => ctx.scene.enter('echo'))
bot.on('message', (ctx) => ctx.reply('Try /echo or /greeter'))
bot.launch()
