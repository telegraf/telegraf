const Telegraf = require('../lib/telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
bot.setWebHook('https://--------.localtunnel.me/secret-path', {content: 'webhook.pem'})

// Start https webhook
// FYI: First non-file reply will be served via webhook response
bot.startWebHook('/secret-path', null, 3000)

bot.on('text', (ctx) => {
  return ctx.reply('Coke or Pepsi?', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Coke', callback_data: 'Coke' },
        { text: 'Pepsi', callback_data: 'Pepsi' }
      ]]
    }
  })
})

bot.on('callback_query', (ctx) => {
  // Will be sent via webhook, cause this is first reply
  ctx.answerCallbackQuery()

  // Will be sent via api request
  return ctx.reply(`Oh, ${ctx.callbackQuery.data}! Great choise`)
})
