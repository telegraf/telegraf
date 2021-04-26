const { Telegraf } = require('telegraf')
// @ts-expect-error not a dependency of Telegraf
const Koa = require('koa')
// @ts-expect-error not a dependency of Telegraf
const koaBody = require('koa-body')
const safeCompare = require('safe-compare')

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

const secretPath = `/telegraf/${bot.secretPathComponent()}`

// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
bot.telegram.setWebhook(`https://-----.localtunnel.me${secretPath}`)

const app = new Koa()
app.use(koaBody())
// @ts-ignore
app.use(async (ctx, next) => {
  if (safeCompare(secretPath, ctx.url)) {
    await bot.handleUpdate(ctx.request.body)
    ctx.status = 200
    return
  }
  return next()
})
app.listen(3000)
