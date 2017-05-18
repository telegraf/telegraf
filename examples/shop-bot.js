const Telegraf = require('../')

const invoice = {
  title: 'Working Time Machine',
  description: 'Want to visit your great-great-great-grandparents? Make a fortune at the races? Shake hands with Hammurabi and take a stroll in the Hanging Gardens? Order our Working Time Machine today!',
  currency: 'usd',
  provider_token: process.env.STRIPE_TOKEN,
  start_parameter: '-',
  prices: [
    { label: 'Working Time Machine', amount: 143.22 },
    { label: 'Gift wrapping', amount: 10.00 }
  ],
  payload: {}
}

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.command('start', ({ replyWithInvoice }) => replyWithInvoice(invoice))
bot.startPolling()
