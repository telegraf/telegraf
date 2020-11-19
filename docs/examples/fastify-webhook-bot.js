// @ts-expect-error not a dependency of Telegraf
const fastify = require('fastify')
const { Telegraf } = require('telegraf')
// @ts-expect-error not a dependency of Telegraf
const telegrafPlugin = require('fastify-telegraf')

const { BOT_TOKEN, WEBHOOK_URL } = process.env
const PORT = process.env.PORT || 3000
const SECRET_PATH = '/my-secret-path'

if (!WEBHOOK_URL) throw new Error('"WEBHOOK_URL" env var is required!')
if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!')

const bot = new Telegraf(BOT_TOKEN)
const app = fastify()

app.register(telegrafPlugin, { bot, path: SECRET_PATH })

bot.on('text', ({ reply }) => reply('Hello'))

bot.telegram.setWebhook(WEBHOOK_URL).then(() => {
  console.log('Webhook is set on', WEBHOOK_URL)
})

app.listen(PORT, () => {
  console.log('Start listening on port', PORT)
})
