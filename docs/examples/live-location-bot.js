const Telegraf = require('telegraf')

function sendLiveLocation (ctx) {
  let lat = 42.0
  let lon = 42.0
  ctx.replyWithLocation(lat, lon, { live_period: 60 }).then((message) => {
    const timer = setInterval(() => {
      lat += Math.random() * 0.001
      lon += Math.random() * 0.001
      ctx.telegram.editMessageLiveLocation(lat, lon, message.chat.id, message.message_id).catch(() => clearInterval(timer))
    }, 1000)
  })
}

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start(sendLiveLocation)
bot.startPolling()
