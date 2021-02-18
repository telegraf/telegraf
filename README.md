<header>
<img src="https://raw.githubusercontent.com/telegraf/telegraf/010e971f3c61c854605bf9a5af10a4925d4032fb/docs/header.png" style="background: #FFFFFF3F">

[![Bot API Version](https://img.shields.io/badge/Bot%20API-v5.0-f36caf.svg?style=flat-square)](https://core.telegram.org/bots/api)
![GitHub top language](https://img.shields.io/github/languages/top/telegraf/telegraf?style=flat-square)
[![install size](https://flat.badgen.net/packagephobia/install/telegraf)](https://packagephobia.com/result?p=telegraf,node-telegram-bot-api)
[![Russian chat](https://img.shields.io/badge/Russian%20chat-grey?style=flat-square&logo=telegram)](https://t.me/telegraf_ru)
[![English chat](https://img.shields.io/badge/English%20chat-grey?style=flat-square&logo=telegram)](https://t.me/TelegrafJSChat)
</header>

## For 3.x users

- [3.x docs](https://telegraf.js.org/v3)
- [4.0 release notes](https://github.com/telegraf/telegraf/releases/tag/v4.0.0)

## Introduction

Bots are special [Telegram](https://telegram.org) accounts designed to handle messages automatically. 
Users can interact with bots by sending them command messages in private or group chats. 
These accounts serve as an interface for code running somewhere on your server.

Telegraf is a library that makes it simple for you to develop your own Telegram bots using JavaScript or [TypeScript](https://www.typescriptlang.org/).

### Features

- Full [Telegram Bot API 5.0](https://core.telegram.org/bots/api) support
- [Excellent TypeScript typings](https://github.com/telegraf/telegraf/releases/tag/v4.0.0)
- [Lightweight](https://packagephobia.com/result?p=telegraf,node-telegram-bot-api)
- [Firebase](https://firebase.google.com/products/functions/)/[Glitch](https://dashing-light.glitch.me)/[Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction)/[AWS **λ**](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html)/Whatever ready
- `http/https/fastify/Connect.js/express.js` compatible webhooks
- Extensible

### Example
  
```js
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

```js
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.command('hipster', Telegraf.reply('λ'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

For additional bot examples see [`examples`](https://github.com/telegraf/telegraf/tree/develop/docs/examples) folder.

### Resources

- [Getting started](#getting-started)
- [API reference](https://telegraf.js.org/modules.html)
- Telegram groups (sorted by number of members):
  * [Russian](https://t.me/telegraf_ru)
  * [English](https://t.me/TelegrafJSChat)
  * [Uzbek](https://t.me/telegrafJS_uz)
  * [Ethiopian](https://t.me/telegraf_et)
- [GitHub Discussions](https://github.com/telegraf/telegraf/discussions)
- [Dependent repositories](https://libraries.io/npm/telegraf/dependent_repositories)

## Getting started

### Telegram token

To use the [Telegram Bot API](https://core.telegram.org/bots/api), 
you first have to [get a bot account](https://core.telegram.org/bots) 
by [chatting with BotFather](https://core.telegram.org/bots#6-botfather).

BotFather will give you a *token*, something like `123456789:AbCdfGhIJKlmNoQQRsTUVwxyZ`.

### Installation

```shellscript
$ npm install telegraf
```
or
```shellscript
$ yarn add telegraf
```
or
```shellscript
$ pnpm add telegraf
```

### `Telegraf` class

[`Telegraf`] instance represents your bot. It's responsible for obtaining updates and passing them to your handlers.

Start by [listening to commands](https://telegraf.js.org/classes/telegraf.html#command) and [launching](https://telegraf.js.org/classes/telegraf.html#launch) your bot.

### `Context` class

`ctx` you can see in every example is a [`Context`] instance.
[`Telegraf`] creates one for each incoming update and passes it to your middleware.
It contains the `update`, `botInfo`, and `telegram` for making arbitrary Bot API requests,
as well as shorthand methods and getters.

This is probably the class you'll be using the most.


<!--
Here is a list of

#### Known middleware

- [Internationalization](https://github.com/telegraf/telegraf-i18n)—simplifies selecting the right translation to use when responding to a user.
- [Redis powered session](https://github.com/telegraf/telegraf-session-redis)—store session data using Redis.
- [Local powered session (via lowdb)](https://github.com/RealSpeaker/telegraf-session-local)—store session data in a local file.
- [Rate-limiting](https://github.com/telegraf/telegraf-ratelimit)—apply rate limitting to chats or users.
- [Bottleneck powered throttling](https://github.com/KnightNiwrem/telegraf-throttler)—apply throttling to both incoming updates and outgoing API calls.
- [Menus via inline keyboards](https://github.com/EdJoPaTo/telegraf-inline-menu)—simplify creating interfaces based on menus.
- [Stateless Questions](https://github.com/EdJoPaTo/telegraf-stateless-question)—create stateless questions to Telegram users working in privacy mode.
- [Natural language processing via wit.ai](https://github.com/telegraf/telegraf-wit)
- [Natural language processing via recast.ai](https://github.com/telegraf/telegraf-recast)
- [Multivariate and A/B testing](https://github.com/telegraf/telegraf-experiments)—add experiments to see how different versions of a feature are used.
- [Powerfull bot stats via Mixpanel](https://github.com/telegraf/telegraf-mixpanel)
- [statsd integration](https://github.com/telegraf/telegraf-statsd)
- [and more...](https://www.npmjs.com/search?q=telegraf-)
-->

#### Shorthand methods

```js
import { Telegraf } from 'telegraf'

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('quit', (ctx) => {
  // Explicit usage
  ctx.telegram.leaveChat(ctx.message.chat.id)

  // Using context shortcut
  ctx.leaveChat()
})

bot.on('text', (ctx) => {
  // Explicit usage
  ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`)

  // Using context shortcut
  ctx.reply(`Hello ${ctx.state.role}`)
})

bot.on('callback_query', (ctx) => {
  // Explicit usage
  ctx.telegram.answerCbQuery(ctx.callbackQuery.id)

  // Using context shortcut
  ctx.answerCbQuery()
})

bot.on('inline_query', (ctx) => {
  const result = []
  // Explicit usage
  ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)

  // Using context shortcut
  ctx.answerInlineQuery(result)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

## Production

### Webhooks

```js
const { Telegraf } = require('telegraf')
const fs = require('fs')
require('dotenv')

const bot = new Telegraf(process.env.BOT_TOKEN)

// TLS options
const tlsOptions = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem'),
  ca: [
    // This is necessary only if the client uses a self-signed certificate.
    fs.readFileSync('client-cert.pem')
  ]
}

// Set telegram webhook
// The second argument is necessary only if the client uses a self-signed
// certificate. Including it for a verified certificate may cause things to break.
bot.telegram.setWebhook('https://server.tld:8443/secret-path', {
  source: 'server-cert.pem'
})

// Start https webhook
bot.startWebhook('/secret-path', tlsOptions, 8443)

// Http webhook, for nginx/heroku users.
bot.startWebhook('/secret-path', null, 5000)
```

Use `webhookCallback()` if you want to attach Telegraf to an existing http server.

<!-- global bot, tlsOptions -->

```js
require('http')
  .createServer(bot.webhookCallback('/secret-path'))
  .listen(3000)

require('https')
  .createServer(tlsOptions, bot.webhookCallback('/secret-path'))
  .listen(8443)
```

- [AWS Lambda example integration](https://github.com/telegraf/telegraf/blob/develop/docs/examples/aws-lambda.js)
- [`express` example integration](https://github.com/telegraf/telegraf/blob/develop/docs/examples/express-webhook-bot.ts)
- [`fastify` example integration](https://github.com/telegraf/telegraf/blob/develop/docs/examples/fastify-webhook-bot.js)
- [Google Cloud Functions example integration](https://github.com/telegraf/telegraf/blob/develop/docs/examples/google-cloud-function.ts)
- [`koa` example integration](https://github.com/telegraf/telegraf/blob/develop/docs/examples/koa-webhook-bot.js)
- Use [`bot.handleUpdate`](https://telegraf.js.org/classes/telegraf.html#handleupdate) to write new integrations

### Error handling

If middleware throws an error or times out, Telegraf calls `bot.handleError`. If it rethrows, update source closes, and then the error is printed to console and process [hopefully](https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode) terminates. If it does not rethrow, the error is swallowed.

Default `bot.handleError` always rethrows. You can overwrite it using `bot.catch` if you need to.

⚠️ Always rethrow `TimeoutError`!

⚠️ Swallowing unknown errors might leave the process in invalid state!

ℹ️ In production, `systemd` or [`pm2`](https://www.npmjs.com/package/pm2) can restart your bot if it exits for any reason.

## Advanced topics

### Working with files

Supported file sources:

- `Existing file_id`
- `File path`
- `Url`
- `Buffer`
- `ReadStream`

Also, you can provide an optional name of a file as `filename` when you send the file.

<!-- global bot, fs -->

```js
bot.on('message', (ctx) => {
  // resend existing file by file_id
  ctx.replyWithSticker('123123jkbhj6b')

  // send file
  ctx.replyWithVideo({ source: '/path/to/video.mp4' })

  // send stream
  ctx.replyWithVideo({
    source: fs.createReadStream('/path/to/video.mp4')
  })

  // send buffer
  ctx.replyWithVoice({
    source: Buffer.alloc()
  })

  // send url via Telegram server
  ctx.replyWithPhoto('https://picsum.photos/200/300/')

  // pipe url content
  ctx.replyWithPhoto({
    url: 'https://picsum.photos/200/300/?random',
    filename: 'kitten.jpg'
  })
})
```

### Middleware

In addition to `ctx: Context`, each middleware receives `next: () => Promise<void>`.

As in Koa and some other middleware-based libraries,
`await next()` will call next middleware and wait for it to finish:

```js
import { Telegraf } from 'telegraf'

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(async (ctx, next) => {
  console.time(`Processing update ${ctx.update.update_id}`)
  await next() // runs next middleware
  // runs after next middleware finishes
  console.timeEnd(`Processing update ${ctx.update.update_id}`)
})

bot.on('text', (ctx) => ctx.reply('Hello World'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

With this simple ability, you can:
- extract information from updates and then `await next()` to avoid disrupting other middleware,
- like [`Composer`] and [`Router`], `await next()` for updates you don't wish to handle,
- like [`session`] and [`Scenes`], [extend the context](#extending-context) by mutating `ctx` before `await next()`,
- [intercept API calls](https://github.com/telegraf/telegraf/discussions/1267#discussioncomment-254525),
- reuse [other people's code](https://www.npmjs.com/search?q=telegraf-),
- do whatever **you** come up with!

[`Composer`]: https://telegraf.js.org/classes/composer.html
[`Context`]: https://telegraf.js.org/classes/context.html
[`Router`]: https://telegraf.js.org/classes/router.html
[`session`]: https://telegraf.js.org/modules.html#session
[`Scenes`]: https://telegraf.js.org/modules/scenes.html
[`Telegraf`]: https://telegraf.js.org/classes/telegraf.html

### Usage with TypeScript

Telegraf is written in TypeScript and therefore ships with declaration files for the entire library.
Moreover, it includes types for the complete Telegram API via the [`typegram`](https://github.com/KnorpelSenf/typegram) package.
While most types of Telegraf's API surface are self-explanatory, there's some notable things to keep in mind.

#### Extending `Context`

The exact shape of `ctx` can vary based on the installed middleware.
Some custom middleware might register properties on the context object that Telegraf is not aware of.
Consequently, you can change the type of `ctx` to fit your needs in order for you to have proper TypeScript types for your data.
This is done through Generics:

```ts
import { Context, Telegraf } from 'telegraf'

// Define your own context type
interface MyContext extends Context {
  myProp?: string
  myOtherProp?: number
}

// Create your bot and tell it about your context type
const bot = new Telegraf<MyContext>('SECRET TOKEN')

// Register middleware and launch your bot as usual
bot.use((ctx, next) => {
  // Yay, `myProp` is now available here as `string | undefined`!
  ctx.myProp = ctx.chat?.first_name?.toUpperCase()
  return next()
})
// ...
```
