/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  Composer,
  Markup,
  session,
  Stage,
  Telegraf,
  WizardContext,
  WizardContextWizard,
  WizardScene,
} from 'telegraf'

/**
 * We can extend the wizard object itself by extending `WizardContextWizard`. Note
 * that you need to pass your context object as type variable.
 */
interface MyWizard extends WizardContextWizard<MyContext> {
  // will be available under `ctx.wizard.myWizardProp`
  myWizardProp: number
}

/**
 * Since you can only pass a custom context to the bot, we can simply define a
 * type alias to use the custom wizard without actually extending the context in
 * any way.
 */
type MyContext = WizardContext<MyWizard>

const stepHandler = new Composer<MyContext>()
stepHandler.action('next', async (ctx) => {
  await ctx.reply('Step 2. Via inline button')
  return ctx.wizard.next()
})
stepHandler.command('next', async (ctx) => {
  await ctx.reply('Step 2. Via command')
  return ctx.wizard.next()
})
stepHandler.use((ctx) =>
  ctx.replyWithMarkdown('Press `Next` button or type /next')
)

const superWizard = new WizardScene(
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
  async (ctx) => {
    // we now have access to the the fields defined above
    ctx.wizard.myWizardProp ??= 0
    return ctx.wizard.next()
  },
  stepHandler,
  async (ctx) => {
    await ctx.reply('Step 3')
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

const bot = new Telegraf(process.env.BOT_TOKEN)
const stage = new Stage([superWizard], { default: 'super-wizard' })
bot.use(session())
bot.use(stage.middleware())
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
