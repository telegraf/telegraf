// This is a test file for the TypeScript typings.
// It is not intended to be used by external users.
import Telegraf, { Markup, Middleware, ContextMessageUpdate, Extra } from './index';

const randomPhoto = 'https://picsum.photos/200/300/?random'
const sayYoMiddleware: Middleware<ContextMessageUpdate> = ({ reply }, next) => reply('yo').then(() => next && next())

const {reply} =  Telegraf;

const bot = new Telegraf(process.env.BOT_TOKEN || '')

// Logs each request
bot.use(Telegraf.log())

bot.start((ctx) => ctx.reply('Bot started!'));

// Login widget events
bot.on('connected_website', ({ reply }) => reply('Website connected'))

bot.command('cat', ({ replyWithPhoto }) => replyWithPhoto(randomPhoto))

// Look ma, reply middleware factory
bot.command('foo', reply('http://coub.com/view/9cjmt'))

bot.action('bar', reply('i was here'))

bot.telegram.sendMessage(process.env.BOT_CLIENT_ID || '', "It works")

// Start https webhook
bot.startWebhook('/secret-path', {}, 8443)

// Http webhook, for nginx/heroku users.
bot.startWebhook('/secret-path', null, 5000)

// Start polling
bot.startPolling()

// Launch - webhook
bot.launch({ webhook: {} }) // Technically, all webhook parameters are optional, but in this case launch throws an exception
bot.launch({
  webhook: {
    domain: 'https://---.localtunnel.me',
    port: 3000,
    hookPath: '/telegraf/mybot',
    tlsOptions: null,
    host: '127.0.0.1',
    cb: (): void => {}
  }
})

// Launch - polling
bot.launch({ polling: {} })
bot.launch({
  polling: {
    timeout: 30,
    limit: 100,
    allowedUpdates: null,
    stopCallback: (): void => {}
  }
})

// tt.ExtraXXX
bot.hears('something', (ctx) => {
    // tt.ExtraReplyMessage
    ctx.reply('Response', {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        disable_notification: true,
        reply_to_message_id: 0,
        reply_markup: Markup.keyboard([])
    })

    // tt.ExtraAudio
    ctx.replyWithAudio('somefile', {
        caption: '',
        duration: 0,
        performer: '',
        title: '',
        thumb: '',
        disable_notification: true,
        reply_to_message_id: 0,
        reply_markup: Markup.inlineKeyboard([])
    })

    // tt.ExtraDocument
    ctx.replyWithDocument('document', {
        thumb: '',
        caption: '',
        parse_mode: "HTML",
        disable_notification: true,
        reply_to_message_id: 0,
        reply_markup: Markup.inlineKeyboard([])
    })

    // tt.ExtraGame
    ctx.replyWithGame('game', {
        disable_notification: true,
        reply_to_message_id: 0,
        reply_markup: Markup.inlineKeyboard([])
    })

    // tt.ExtraLocation
    ctx.replyWithLocation(0, 0, {
        live_period: 60,
        disable_notification: true,
        reply_to_message_id: 0,
        reply_markup: Markup.inlineKeyboard([])
    })

    // tt.ExtraPhoto
    ctx.replyWithPhoto('', {
        caption: '',
        parse_mode: 'HTML',
        disable_notification: true,
        reply_to_message_id: 0,
        reply_markup: Markup.inlineKeyboard([])
    })

    // tt.ExtraMediaGroup
    ctx.replyWithMediaGroup([], {
        disable_notification: false,
        reply_to_message_id: 0
    })

    // tt.ExtraSticker
    ctx.replyWithSticker('', {
        disable_notification: true,
        reply_to_message_id: 0,
        reply_markup: Markup.inlineKeyboard([])
    })

    // tt.ExtraVideo
    ctx.replyWithVideo('', {
        duration: 0,
        width: 0,
        height: 0,
        thumb: '',
        caption: '',
        supports_streaming: false,
        parse_mode: "HTML",
        disable_notification: true,
        reply_to_message_id: 0,
        reply_markup: Markup.inlineKeyboard([])
    })

    // tt.ExtraVoice
    ctx.replyWithVoice('', {
        caption: '',
        parse_mode: "Markdown",
        duration: 0,
        disable_notification: false,
        reply_to_message_id: 0,
        reply_markup: Markup.inlineKeyboard([])
    })
})

// Markup

const markup = new Markup
markup.inlineKeyboard([Markup.button('sample')], {})
Markup.inlineKeyboard([Markup.callbackButton('sampleText', 'sampleData')], {})


// #761
bot.telegram.sendPhoto(1, randomPhoto, { caption: '*Caption*', parse_mode: 'Markdown' });
