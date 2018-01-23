const Telegraf = require('telegraf')
const Koa = require('koa')
const koaBody = require('koa-body')

const bot = new Telegraf(process.env.BOT_TOKEN)
// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
bot.telegram.setWebhook('https://-----.localtunnel.me/secret-path')
bot.on('text', ({ reply }) => reply('Hey there!'))

// First non-file reply will be served via webhook response,
// but messages order not guaranteed due to `koa` pipeline design.
// Details: https://github.com/telegraf/telegraf/issues/294
const app = new Koa()
app.use(koaBody())
app.use((ctx, next) => ctx.method === 'POST' || ctx.url === '/secret-path'
  ? bot.handleUpdate(ctx.request.body, ctx.response)
  : next()
)
app.listen(3000)
