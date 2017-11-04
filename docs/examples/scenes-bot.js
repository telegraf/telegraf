const Telegraf = require('telegraf')
const session = require('telegraf/session')
const RotatingStage = require('telegraf/scenes')
const Scene = require('telegraf/scenes/base')
const { enter, leave } = RotatingStage

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
const stage = new RotatingStage([greeterScene, echoScene], { ttl: 10 })
app.use(session())
app.use(stage)
app.command('greeter', enter('greeter'))
app.command('echo', enter('echo'))
app.on('message', (ctx) => ctx.reply('Try /echo or /greeter'))
app.startPolling()
