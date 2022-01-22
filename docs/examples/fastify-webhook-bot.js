// @ts-nocheck - ignoring fastify type errors, since it's not a telegraf dependency

const fastify = require('fastify')
const { Telegraf } = require('telegraf')
const { BOT_TOKEN, WEBHOOK_URL } = process.env
const PORT = process.env.PORT || 3000

if (!WEBHOOK_URL) throw new Error('"WEBHOOK_URL" env var is required!')
if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!')

const bot = new Telegraf(BOT_TOKEN)
const app = fastify()

const SECRET_PATH = `/telegraf/${bot.secretPathComponent()}`

app.post(SECRET_PATH, (req, rep) => bot.handleUpdate(req.body, rep.raw))

bot.on('text', (ctx) => ctx.reply('Hello'))

bot.telegram.setWebhook(WEBHOOK_URL + SECRET_PATH).then(() => {
  console.log('Webhook is set on', WEBHOOK_URL)
})

app.listen(PORT).then(() => {
  console.log('Listening on port', PORT)
})
