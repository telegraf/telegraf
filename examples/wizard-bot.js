const Telegraf = require('../')
const { Flow } = Telegraf
const { WizardScene } = Flow

const superWizard = new WizardScene('super-wizard',
  (ctx) => {
    ctx.reply('Step 1')
    ctx.flow.wizard.next()
  },
  (ctx) => {
    if (ctx.message && ctx.message.text !== 'ok') {
      return ctx.replyWithMarkdown('Send `ok`')
    }
    ctx.reply('Step 2 ')
    ctx.flow.wizard.next()
  },
  (ctx) => {
    ctx.reply('Step 3')
    ctx.flow.wizard.next()
  },
  (ctx) => {
    ctx.reply('Step 4')
    ctx.flow.wizard.next()
  },
  (ctx) => {
    ctx.reply('Done')
    ctx.flow.leave()
  }
)

const app = new Telegraf(process.env.BOT_TOKEN)
const flow = new Flow([superWizard], {defaultScene: 'super-wizard'})
app.use(Telegraf.memorySession())
app.use(flow.middleware())
app.startPolling()
