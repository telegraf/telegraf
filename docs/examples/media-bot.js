const Telegraf = require('telegraf')
const fs = require('fs')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('local', (ctx) => ctx.replyWithPhoto({ source: '/cats/cat1.jpeg' }))
bot.command('stream', (ctx) => ctx.replyWithPhoto({ source: fs.createReadStream('/cats/cat2.jpeg') }))
bot.command('buffer', (ctx) => ctx.replyWithPhoto({ source: fs.readFileSync('/cats/cat3.jpeg') }))
bot.command('pipe', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }))
bot.command('url', (ctx) => ctx.replyWithPhoto('https://picsum.photos/200/300/?random'))
bot.command('caption', (ctx) => ctx.replyWithPhoto('https://picsum.photos/200/300/?random', {
  caption: 'Caption *text*',
  parse_mode: 'Markdown'
}))

bot.command('album', (ctx) => {
  ctx.replyWithMediaGroup([
    {
      'media': 'AgADBAADXME4GxQXZAc6zcjjVhXkE9FAuxkABAIQ3xv265UJKGYEAAEC',
      'caption': 'From file_id',
      'type': 'photo'
    },
    {
      'media': 'https://picsum.photos/200/500/',
      'caption': 'From URL',
      'type': 'photo'
    },
    {
      'media': { url: 'https://picsum.photos/200/300/?random' },
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
