const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const fs = require('fs')

const AnimationUrl1 = 'https://media.giphy.com/media/ya4eevXU490Iw/giphy.gif'
const AnimationUrl2 = 'https://media.giphy.com/media/LrmU6jXIjwziE/giphy.gif'

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('local', (ctx) => ctx.replyWithPhoto({ source: '/cats/cat1.jpeg' }))
bot.command('stream', (ctx) => ctx.replyWithPhoto({ source: fs.createReadStream('/cats/cat2.jpeg') }))
bot.command('buffer', (ctx) => ctx.replyWithPhoto({ source: fs.readFileSync('/cats/cat3.jpeg') }))
bot.command('pipe', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }))
bot.command('url', (ctx) => ctx.replyWithPhoto('https://picsum.photos/200/300/?random'))
bot.command('animation', (ctx) => ctx.replyWithAnimation(AnimationUrl1))
bot.command('pipe_animation', (ctx) => ctx.replyWithAnimation({ url: AnimationUrl1 }))

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

bot.command('edit_media', (ctx) => ctx.replyWithAnimation(AnimationUrl1, Extra.markup((m) =>
  m.inlineKeyboard([
    m.callbackButton('Change media', 'swap_media')
  ])
)))

bot.action('swap_media', (ctx) => ctx.editMessageMedia({
  type: 'animation',
  media: AnimationUrl2
}))

bot.startPolling()
