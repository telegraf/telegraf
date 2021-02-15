import { Telegraf } from 'telegraf'

const BOT_TOKEN = process.env.BOT_TOKEN ?? '<BOT TOKEN HERE>'
const PROJECT_ID = process.env.PROJECT_ID ?? '<Google Project ID>'
const FUNCTION_NAME = process.env.FUNCTION_NAME ?? 'botFunction'
const REGION = process.env.REGION ?? 'us-central1'

const bot = new Telegraf(BOT_TOKEN)

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bot.telegram.setWebhook(
  `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}`
)

bot.command('hello', (ctx) => ctx.reply('Hello, friend!'))

export const botFunction = async (req: any, res: any) => {
  console.log(req.body)
  try {
    await bot.handleUpdate(req.body)
    console.log('Success')
    res.status(200).send('Success')
  } catch (err) {
    console.log('Failure')
    console.log(err)
    res.status(500).send('Something went wrong')
  }
}
