const Telegraf = require('../')
const { Scene, enter, leave } = Telegraf.Flow

// Greeter scene
const greeterScene = new Scene('greeter')
greeterScene.enter((ctx) => ctx.reply('Hi'))
greeterScene.leave((ctx) => ctx.reply('Buy'))
greeterScene.hears(/hi/gi, leave())
greeterScene.on('message', (ctx) => ctx.replyWithMarkdown('Send `hi`'))

// Echo scene
const echoScene = new Scene('echo')
echoScene.enter((ctx) => ctx.reply('echo scene'))
echoScene.leave((ctx) => ctx.reply('exiting echo scene'))
echoScene.command('back', leave())
echoScene.on('text', (ctx) => ctx.reply(ctx.message.text))
echoScene.on('message', (ctx) => ctx.reply('Only text messages please'))

const app = new Telegraf(process.env.BOT_TOKEN)
const flow = new Telegraf.Flow([greeterScene, echoScene], { ttl: 10 })
app.use(Telegraf.memorySession())
app.use(flow.middleware())
app.command('greeter', enter('greeter'))
app.command('echo', enter('echo'))
app.on('message', (ctx) => ctx.reply('Try /echo or /greeter'))
app.startPolling()
