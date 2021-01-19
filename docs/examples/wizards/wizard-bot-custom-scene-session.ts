/* eslint-disable @typescript-eslint/no-floating-promises */
import { Composer, Markup, Scenes, session, Telegraf } from 'telegraf'

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

/**
 * It is possible to extend the session object that is available to each wizard.
 * This can be done by extending `WizardSessionData` and in turn passing your
 * own interface as a type variable to `WizardContext`.
 */
interface MyWizardSession extends Scenes.WizardSessionData {
  // will be available under `ctx.scene.session.myWizardSessionProp`
  myWizardSessionProp: number
}

type MyContext = Scenes.WizardContext<MyWizardSession>

const stepHandler = new Composer<MyContext>()
stepHandler.action('next', async (ctx) => {
  ctx.scene.session.myWizardSessionProp = Math.floor(10 * Math.random())
  await ctx.reply('Step 2. Via inline button')
  return ctx.wizard.next()
})
stepHandler.command('next', async (ctx) => {
  ctx.scene.session.myWizardSessionProp = Math.floor(10 * Math.random()) + 10
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
      'Step 3.',
      `Your random myWizardSessionProp is ${ctx.scene.session.myWizardSessionProp}`,
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
bot.use(stage.middleware())
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
