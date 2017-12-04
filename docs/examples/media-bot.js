const Telegraf = require('telegraf')
const fs = require('fs')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('local', (ctx) => ctx.replyWithPhoto({ source: '/cats/cat1.jpeg' }))
bot.command('stream', (ctx) => ctx.replyWithPhoto({ source: fs.createReadStream('/cats/cat2.jpeg') }))
bot.command('buffer', (ctx) => ctx.replyWithPhoto({ source: fs.readFileSync('/cats/cat3.jpeg') }))
bot.command('pipe', (ctx) => ctx.replyWithPhoto({ url: 'http://lorempixel.com/400/200/cats/' }))
bot.command('url', (ctx) => ctx.replyWithPhoto('http://lorempixel.com/400/200/cats/'))
bot.command('caption', (ctx) => ctx.replyWithPhoto('http://lorempixel.com/400/200/cats/', { caption: 'Caption text' }))

bot.command('album', (ctx) => {
  ctx.replyWithMediaGroup([
    {
      'media': 'AgADBAADXME4GxQXZAc6zcjjVhXkE9FAuxkABAIQ3xv265UJKGYEAAEC',
      'caption': 'From file_id',
      'type': 'photo'
    },
    {
      'media': 'http://lorempixel.com/500/300/cats/',
      'caption': 'From URL',
      'type': 'photo'
    },
    {
      'media': { url: 'http://lorempixel.com/400/200/cats/' },
      'caption': 'Piped from URL',
      'type': 'photo'
    },
    {
      'media': { source: '/cats/cat1.jpeg' },
      'caption': 'From file',
      'type': 'photo'
    },
    {
      'media': { source: fs.createReadStream('/cats/cat2.jpeg') },
      'caption': 'From stream',
      'type': 'photo'
    },
    {
      'media': { source: fs.readFileSync('/cats/cat3.jpeg') },
      'caption': 'From buffer',
      'type': 'photo'
    }
  ])
})

bot.startPolling()
