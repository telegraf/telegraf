/* eslint-disable @typescript-eslint/no-floating-promises */
import { Composer, Context, Markup, Scenes, session, Telegraf } from 'telegraf'

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

/**
 * We can extend the regular session object that we can use on the context.
 * However, as we're using wizards, we have to make it extend `WizardSession`.
 */
interface MySession extends Scenes.WizardSession {
  // will be available under `ctx.session.mySessionProp`
  mySessionProp: number
}

/**
 * We can define our own context object.
 *
 * As always, if we also want to use our own session object, we have to set it
 * here under the `session` property. In addition, we now also have to set the
 * scene object under the `scene` property. As we're using wizards, we have to
 * pass `WizardSessionData` to the scene object.
 *
 * We also have to set the wizard object under the `wizard` property.
 */
interface MyContext extends Context {
  // will be available under `ctx.myContextProp`
  myContextProp: string

  // declare session type
  session: MySession
  // declare scene type
  scene: Scenes.SceneContextScene<MyContext, Scenes.WizardSessionData>
  // declare wizard type
  wizard: Scenes.WizardContextWizard<MyContext>
}

const stepHandler = new Composer<MyContext>()
stepHandler.action('next', async (ctx) => {
  ctx.session.mySessionProp = -Math.floor(10 * Math.random())
  await ctx.reply('Step 2. Via inline button')
  return ctx.wizard.next()
})
stepHandler.command('next', async (ctx) => {
  ctx.session.mySessionProp = -Math.floor(10 * Math.random()) - 10
  await ctx.reply('Step 2. Via command')
  return ctx.wizard.next()
})
stepHandler.use((ctx) =>
  ctx.replyWithMarkdown('Press `Next` button or type /next')
)

const superWizard = new Scenes.WizardScene(
  'super-wizard',
  async (ctx) => {
    await ctx.reply(
      'Step 1',
      Markup.inlineKeyboard([
        Markup.button.url('❤️', 'http://telegraf.js.org'),
        Markup.button.callback('➡️ Next', 'next'),
      ])
    )
    return ctx.wizard.next()
  },
  stepHandler,
  async (ctx) => {
    const responseText = [
      `[${ctx.myContextProp}] Step 3.`,
      `Your random mySessionProp is ${ctx.session.mySessionProp}`,
    ].join('\n')
    await ctx.reply(responseText)
    return ctx.wizard.next()
  },
  async (ctx) => {
    await ctx.reply('Step 4')
    return ctx.wizard.next()
  },
  async (ctx) => {
    await ctx.reply('Done')
    return await ctx.scene.leave()
  }
)

const bot = new Telegraf<MyContext>(token)
const stage = new Scenes.Stage<MyContext>([superWizard], {
  default: 'super-wizard',
})
bot.use(session())
bot.use((ctx, next) => {
  const now = new Date()
  ctx.myContextProp = now.toString()
  return next()
})
bot.use(stage.middleware())
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
