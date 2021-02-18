// @ts-expect-error `npm install --save-dev @types/express`
import { Request, Response } from 'express'
import { Telegraf } from 'telegraf'

const { BOT_TOKEN, FUNCTION_NAME, PROJECT_ID, REGION } = process.env

if (BOT_TOKEN === undefined) {
  throw new TypeError('BOT_TOKEN must be provided!')
}

const bot = new Telegraf(BOT_TOKEN)

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bot.telegram.setWebhook(
  `https://${REGION!}-${PROJECT_ID!}.cloudfunctions.net/${FUNCTION_NAME!}`
)

bot.command('hello', (ctx) => ctx.reply('Hello, friend!'))

export const botFunction = async (req: Request, res: Response) => {
  try {
    await bot.handleUpdate(req.body)
  } finally {
    res.status(200).end()
  }
}
