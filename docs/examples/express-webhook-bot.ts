/* eslint-disable @typescript-eslint/no-floating-promises */

// @ts-expect-error `npm install express && npm install --save-dev @types/express`
import express, { Request, Response } from 'express'
import { Telegraf } from 'telegraf'

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token)
// Set the bot response
bot.on('text', (ctx) => ctx.replyWithHTML('<b>Hello</b>'))

const secretPath = `/telegraf/${bot.secretPathComponent()}`

// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
bot.telegram.setWebhook(`https://----.localtunnel.me${secretPath}`)

const app = express()
app.get('/', (req: Request, res: Response) => res.send('Hello World!'))
// Set the bot API endpoint
app.use(bot.webhookCallback(secretPath))
app.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})

// No need to call bot.launch()
