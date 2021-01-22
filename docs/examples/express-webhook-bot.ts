/* eslint-disable @typescript-eslint/no-floating-promises */

// @ts-expect-error not a dependency of Telegraf
import express from 'express'
import { Telegraf } from 'telegraf'

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token)
// Set the bot response
bot.on('text', (ctx) => ctx.replyWithHTML('<b>Hello</b>'))

// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
bot.telegram.setWebhook('https://----.localtunnel.me/secret-path')

const app = express()
app.get('/', (req: any, res: any) => res.send('Hello World!'))
// Set the bot API endpoint
app.use(bot.webhookCallback('/secret-path'))
app.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})

// No need to call bot.launch()
