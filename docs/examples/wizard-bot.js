const Telegraf = require('telegraf')
const Composer = require('telegraf/composer')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')

const stepHandler = new Composer()
stepHandler.action('next', (ctx) => {
  ctx.reply('Step 2 ')
  ctx.wizard.next()
})
stepHandler.use((ctx) => ctx.replyWithMarkdown('Press `Next` button to contunie'))

const superWizard = new WizardScene('super-wizard',
  (ctx) => {
    ctx.reply('Step 1', Markup.inlineKeyboard([
      Markup.urlButton('❤️', 'http://telegraf.js.org'),
      Markup.callbackButton('➡️ Next', 'next')
    ]).extra())
    ctx.wizard.next()
  },
  stepHandler.middleware(),
  (ctx) => {
    ctx.reply('Step 3')
    ctx.wizard.next()
  },
  (ctx) => {
    ctx.reply('Step 4')
    ctx.wizard.next()
  },
  (ctx) => {
    ctx.reply('Done')
    ctx.scene.leave()
  }
)

const bot = new Telegraf(process.env.BOT_TOKEN)
const stage = new Stage([superWizard], { default: 'super-wizard' })
bot.use(session())
bot.use(stage.middleware())
bot.startPolling()
