const { Telegraf } = require('telegraf')
// @ts-expect-error not a dependency of Telegraf
const makeHandler = require('lambda-request-handler')

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token, {
  telegram: { webhookReply: true }
})

bot.start((ctx) => ctx.reply('Hello'))

export const handler = makeHandler(
  bot.webhookCallback(process.env.BOT_HOOK_PATH ?? '/')
)
