const { Telegraf } = require('telegraf')
// @ts-expect-error not a dependency of Telegraf
const makeHandler = require('lambda-request-handler')

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: { webhookReply: true }
})

bot.start((ctx) => ctx.reply('Hello'))

export const handler = makeHandler(
  bot.webhookCallback(process.env.BOT_HOOK_PATH ?? '/')
)
