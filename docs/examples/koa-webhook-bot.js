const { Telegraf } = require('telegraf')
// @ts-expect-error not a dependency of Telegraf
const Koa = require('koa')
// @ts-expect-error not a dependency of Telegraf
const koaBody = require('koa-body')

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token)
// First reply will be served via webhook response,
// but messages order not guaranteed due to `koa` pipeline design.
// Details: https://github.com/telegraf/telegraf/issues/294
bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }))
bot.on('text', (ctx) => ctx.reply('Hello'))

// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
bot.telegram.setWebhook('https://-----.localtunnel.me/secret-path')

const app = new Koa()
app.use(koaBody())
// @ts-ignore
app.use((ctx, next) => ctx.method === 'POST' || ctx.url === '/secret-path'
  ? bot.handleUpdate(ctx.request.body)
  : next()
)
app.listen(3000)
