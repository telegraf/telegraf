const { Telegraf, Markup } = require('telegraf')
const fetch = require('node-fetch').default

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token)

bot.on('inline_query', async (ctx) => {
  const apiUrl = `http://recipepuppy.com/api/?q=${ctx.inlineQuery.query}`
  const response = await fetch(apiUrl)
  const { results } = await response.json()
  const recipes = results
    // @ts-ignore
    .filter(({ thumbnail }) => thumbnail)
    // @ts-ignore
    .map(({ title, href, thumbnail }) => ({
      type: 'article',
      id: thumbnail,
      title: title,
      description: title,
      thumb_url: thumbnail,
      input_message_content: {
        message_text: title
      },
      reply_markup: Markup.inlineKeyboard([
        Markup.button.url('Go to recipe', href)
      ])
    }))
  return await ctx.answerInlineQuery(recipes)
})

bot.on('chosen_inline_result', ({ chosenInlineResult }) => {
  console.log('chosen inline result', chosenInlineResult)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
