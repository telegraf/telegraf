import { Telegraf } from 'telegraf'

const { BOT_TOKEN, PROJECT_ID, FUNCTION_NAME, REGION } = process.env

// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
const bot = new Telegraf(`${BOT_TOKEN}`)

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bot.telegram.setWebhook(
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
