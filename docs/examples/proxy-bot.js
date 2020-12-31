const { Telegraf } = require('telegraf')
// @ts-expect-error not a dependency of Telegraf
const HttpsProxyAgent = require('https-proxy-agent')

const { BOT_TOKEN, HTTPS_PROXY_HOST, HTTPS_PROXY_PORT } = process.env

if (BOT_TOKEN === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const agent = new HttpsProxyAgent({
  host: HTTPS_PROXY_HOST,
  port: HTTPS_PROXY_PORT
})

const bot = new Telegraf(BOT_TOKEN, { telegram: { agent } })
// or:
// const bot = new Telegraf(BOT_TOKEN, { telegram: { agent, attachmentAgent: agent } })
// if you want to use agent for fetching files, as well

bot.start((ctx) => ctx.reply('Hello'))
bot.help((ctx) => ctx.reply('Help message'))
bot.command('photo', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
