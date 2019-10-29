const Telegraf = require('telegraf')
const HttpsProxyAgent = require('https-proxy-agent')

const { BOT_TOKEN, HTTPS_PROXY_HOST, HTTPS_PROXY_PORT } = process.env

const agent = new HttpsProxyAgent({
  host: HTTPS_PROXY_HOST,
  port: HTTPS_PROXY_PORT
})

const bot = new Telegraf(BOT_TOKEN, { telegram: { agent } })
bot.start((ctx) => ctx.reply('Hello'))
bot.help((ctx) => ctx.reply('Help message'))
bot.command('photo', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }))
bot.launch()
