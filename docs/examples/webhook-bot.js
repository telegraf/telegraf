const Telegraf = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.on('text', ({ reply }) => reply('Hey there!'))

// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
bot.telegram.setWebhook('https://-----.localtunnel.me/secret-path')

// Start https webhook
// FYI: First non-file reply will be served via webhook response
bot.startWebhook('/secret-path', null, 3000)
