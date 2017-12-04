const Telegraf = require('telegraf')
const fastifyApp = require('fastify')()

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('text', ({ reply }) => reply('Hey there!'))

// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
bot.telegram.setWebhook('https://-------.localtunnel.me/secret-path')

fastifyApp.use(bot.webhookCallback('/secret-path'))
fastifyApp.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})
