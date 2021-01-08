const { Telegraf } = require('telegraf')

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

// @ts-ignore
function sendLiveLocation (ctx) {
  let lat = 42.0
  let lon = 42.0
  // @ts-ignore
  ctx.replyWithLocation(lat, lon, { live_period: 60 }).then((message) => {
    const timer = setInterval(() => {
      lat += Math.random() * 0.001
      lon += Math.random() * 0.001
      ctx.telegram.editMessageLiveLocation(lat, lon, message.chat.id, message.message_id).catch(() => clearInterval(timer))
    }, 1000)
  })
}

const bot = new Telegraf(token)
bot.start(sendLiveLocation)
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
