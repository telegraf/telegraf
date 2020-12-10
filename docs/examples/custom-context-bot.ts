import { Context, Telegraf } from 'telegraf'

class CustomContext extends Context {
  constructor(update, telegram, options) {
    console.log('Creating context for %j', update)
    super(update, telegram, options)
  }

  reply(...args: Parameters<Context['reply']>) {
    console.log('reply called with args: %j', args)
    return super.reply(...args)
  }
}

const bot = new Telegraf(process.env.BOT_TOKEN, { contextType: CustomContext })
bot.start((ctx) => ctx.reply('Hello'))
bot.help((ctx) => ctx.reply('Help message'))
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
