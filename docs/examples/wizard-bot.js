const Telegraf = require('telegraf')
const session = require('telegraf/session')
const RotatingStage = require('telegraf/scenes')
const WizardScene = require('telegraf/scenes/wizard')

const superWizard = new WizardScene('super-wizard',
  (ctx) => {
    ctx.reply('Step 1')
    ctx.wizard.next()
  },
  (ctx) => {
    if (ctx.message && ctx.message.text !== 'ok') {
      return ctx.replyWithMarkdown('Send `ok`')
    }
    ctx.reply('Step 2 ')
    ctx.wizard.next()
  },
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

const app = new Telegraf(process.env.BOT_TOKEN)
const stage = new RotatingStage([superWizard], {defaultScene: 'super-wizard'})
app.use(session())
app.use(stage)
app.startPolling()
