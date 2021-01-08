/* eslint-disable @typescript-eslint/no-floating-promises */
import { Context, Telegraf } from 'telegraf'

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

class CustomContext extends Context {
  constructor(update: any, telegram: any, options: any) {
    console.log('Creating context for %j', update)
    super(update, telegram, options)
  }

  reply(...args: Parameters<Context['reply']>) {
    console.log('reply called with args: %j', args)
    return super.reply(...args)
  }
}

const bot = new Telegraf(token, { contextType: CustomContext })
bot.start((ctx) => ctx.reply('Hello'))
bot.help((ctx) => ctx.reply('Help message'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
