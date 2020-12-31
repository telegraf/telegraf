const { Telegraf, Markup } = require('telegraf')

if (process.env.BOT_TOKEN === undefined) {
  throw new TypeError('BOT_TOKEN must be provided!')
}

if (process.env.PROVIDER_TOKEN === undefined) {
  throw new TypeError('PROVIDER_TOKEN must be provided!')
}

const invoice = {
  provider_token: process.env.PROVIDER_TOKEN,
  start_parameter: 'time-machine-sku',
  title: 'Working Time Machine',
  description: 'Want to visit your great-great-great-grandparents? Make a fortune at the races? Shake hands with Hammurabi and take a stroll in the Hanging Gardens? Order our Working Time Machine today!',
  currency: 'usd',
  photo_url: 'https://img.clipartfest.com/5a7f4b14461d1ab2caaa656bcee42aeb_future-me-fredo-and-pidjin-the-webcomic-time-travel-cartoon_390-240.png',
  is_flexible: true,
  prices: [
    { label: 'Working Time Machine', amount: 4200 },
    { label: 'Gift wrapping', amount: 1000 }
  ],
  payload: JSON.stringify({
    coupon: 'BLACK FRIDAY'
  })
}

const shippingOptions = [
  {
    id: 'unicorn',
    title: 'Unicorn express',
    prices: [{ label: 'Unicorn', amount: 2000 }]
  },
  {
    id: 'slowpoke',
    title: 'Slowpoke mail',
    prices: [{ label: 'Slowpoke', amount: 100 }]
  }
]

const replyOptions = Markup.inlineKeyboard([
  Markup.button.pay('💸 Buy'),
  Markup.button.url('❤️', 'http://telegraf.js.org')
])

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.replyWithInvoice(invoice))
bot.command('buy', (ctx) => ctx.replyWithInvoice(invoice, replyOptions))
bot.on('shipping_query', (ctx) => ctx.answerShippingQuery(true, shippingOptions, undefined))
bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true))
bot.on('successful_payment', () => console.log('Woohoo'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
