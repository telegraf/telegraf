// This is a test file for the TypeScript typings.
// It is not intended to be used by external users.
import Telegraf, { Markup, Middleware, Context } from './index';
import * as tt from './telegram-types';

const randomPhoto = 'https://picsum.photos/200/300/?random'
const sayYoMiddleware: Middleware<Context> = ({ reply }, next) => reply('yo').then(() => next && next())

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
bot.hears('something', async (ctx) => {
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

    ctx.editMessageLiveLocation(90, 90, {
        reply_markup: Markup.inlineKeyboard([])
    })

    ctx.stopMessageLiveLocation({
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

    ctx.telegram.sendVideoNote(-1, "", {
        duration: 0,
        length: 0,
        thumb: '',
        parse_mode: "HTML",
        disable_notification: false,
        disable_web_page_preview: false,
        reply_markup: Markup.inlineKeyboard([]),
        reply_to_message_id: 0,
    })

    const setMyCommandsResult: boolean =  await ctx.telegram.setMyCommands([
        {
            command: '',
            description: ''
        },
    ])

    const myCommands: tt.BotCommand[] = await ctx.telegram.getMyCommands()

    const messageDice: tt.MessageDice = await ctx.telegram.sendDice(0, {
        disable_notification: false,
        reply_markup: Markup.inlineKeyboard([]),
        reply_to_message_id: 0
    })

    const replyWithDiceMessage: tt.MessageDice = await ctx.replyWithDice({
        disable_notification: false,
        reply_markup: Markup.inlineKeyboard([]),
        reply_to_message_id: 0
    })
})

// Markup

const markup = new Markup
markup.keyboard([Markup.button('sample')], {})
Markup.inlineKeyboard([Markup.callbackButton('sampleText', 'sampleData')], {})
Markup.inlineKeyboard([Markup.callbackButton('sampleCallbackButton', 'sampleData'), Markup.urlButton('sampleUrlButton', 'https://github.com')], {})


// #761
bot.telegram.sendPhoto(1, randomPhoto, { caption: '*Caption*', parse_mode: 'Markdown' });

const formattedString = Markup.formatHTML("Добрейшего вечерочка дня", [
  { offset: 0, length: 10, type: "bold" },
  { offset: 11, length: 9, type: "strikethrough" }
]);
