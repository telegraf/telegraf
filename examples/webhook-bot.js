const Telegraf = require('../')

const bot = new Telegraf(process.env.BOT_TOKEN)

// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
bot.telegram.setWebHook('https://--------.localtunnel.me/secret-path')

// Start https webhook
// FYI: First non-file reply will be served via webhook response
bot.startWebHook('/secret-path', null, 3000)

bot.on('text', (ctx) => ctx.reply('Hey there!'))
