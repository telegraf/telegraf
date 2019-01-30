const Telegraf = require('telegraf')
const fetch = require('node-fetch')

// async/await example.

async function omdbSearch (query = '') {
  const apiUrl = `http://www.omdbapi.com/?s=${query}&apikey=9699cca`
  const response = await fetch(apiUrl)
  const json = await response.json()
  const posters = (json.Search && json.Search) || []
  return posters.filter(({ Poster }) => Poster && Poster.startsWith('https://')) || []
}

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
  const posters = await omdbSearch(inlineQuery.query)
  const results = posters.map((poster) => ({
    type: 'photo',
    id: poster.imdbID,
    caption: poster.Title,
    description: poster.Title,
    thumb_url: poster.Poster,
    photo_url: poster.Poster
  }))
  return answerInlineQuery(results)
})

bot.launch()
