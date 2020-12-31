/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  Composer,
  Markup,
  session,
  Stage,
  Telegraf,
  WizardContext,
  WizardScene,
} from 'telegraf'

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const stepHandler = new Composer<WizardContext>()
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

const bot = new Telegraf<WizardContext>(token)
const stage = new Stage<WizardContext>([superWizard], {
  default: 'super-wizard',
})
bot.use(session())
bot.use(stage.middleware())
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
