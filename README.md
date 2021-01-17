<header>
<img src="https://raw.githubusercontent.com/telegraf/telegraf/010e971f3c61c854605bf9a5af10a4925d4032fb/docs/header.png" style="background: #FFFFFF3F">

[![Bot API Version](https://img.shields.io/badge/Bot%20API-v5.0-f36caf.svg?style=flat-square)](https://core.telegram.org/bots/api)
![GitHub top language](https://img.shields.io/github/languages/top/telegraf/telegraf?style=flat-square)
[![install size](https://flat.badgen.net/packagephobia/install/telegraf)](https://packagephobia.com/result?p=telegraf,node-telegram-bot-api)
[![Russian chat](https://img.shields.io/badge/Russian%20chat-grey?style=flat-square&logo=telegram)](https://t.me/telegraf_ru)
[![English chat](https://img.shields.io/badge/English%20chat-grey?style=flat-square&logo=telegram)](https://t.me/TelegrafJSChat)
</header>

## For 3.x users

- [3.38.0 docs](https://github.com/telegraf/telegraf/tree/3.38.0/docs)
- [4.0.0 release notes](https://github.com/telegraf/telegraf/releases/tag/v4.0.0)

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

For additional bot examples see [`examples`](https://github.com/telegraf/telegraf/tree/master/docs/examples) folder.

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

### Session

Sessions are used to store data per user or per chat (or per whatever if you want, this is the *session key*).

Think of a session as an object that can hold any kind of information you provide.
This could be the ID of the last message of the bot, or simply a counter about how many photos a user already sent to the bot.

You can use session middleware to add sessions support to your bot.
This will do the heavy lifting for you.
Using session middleware will result in a sequence like this:

1) A new update comes in.
2) The session middleware loads the current session data for the respective chat/user/whatever.
3) The session middleware makes that session data available on the context object `ctx`.
4) Your middleware stack is run, all of your code can do its work.
5) The session middleware takes back control and checks how you altered the session data on the `ctx` object.
6) The session middleware write the session back to your storage, i.e. a file, a database, an in-memory storage, or even a cloud storage solution.

Here is a simple example of how the built-in session middleware of Telegraf can be used to count photos.

```js
const { session } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())
bot.on('photo', (ctx) => {
  ctx.session ??= { counter: 0 }
  ctx.session.counter++
  return ctx.reply(`Photo counter: ${ctx.session.counter}`)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

The default session key is <code>`${ctx.from.id}:${ctx.chat.id}`</code>.
If either `ctx.from` or `ctx.chat` is `undefined`, default session key and thus `ctx.session` are also `undefined`.
You can customize the session key resolver function by passing in the options argument:

```js
const { session } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session({
  makeKey: (ctx) => ctx.from?.id // only store data per user, but across chats
}))
bot.on('photo', (ctx) => {
  ctx.session ??= { counter: 0 }
  ctx.session.counter++
  return ctx.reply(`Photo counter: ${ctx.session.counter}`)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

**Tip: To use same session in private chat with bot and in inline mode, use following session key resolver:**

```js
{
  makeKey: (ctx) => {
    if (ctx.from && ctx.chat) {
      return `${ctx.from.id}:${ctx.chat.id}`
    } else if (ctx.from && ctx.inlineQuery) {
      return `${ctx.from.id}:${ctx.from.id}`
    }
    return undefined
  }
}
```

However, in the above example, the session middleware just stores the counters in-memory.
This means that all counters will be lost when the process is terminated.
If you want to store data across restarts, or share it among workers, you need to use *persistent sessions*.

There are already [a lot of packages](https://www.npmjs.com/search?q=telegraf-session) that make this a breeze.
You can simply add `npm install` one and to your bot to support exactly the type of storage you want.

Alternatively, `telegraf` also allows you to easily integrate your own persistence without any other package.
The `session` function can take a `storage` in the options object.
A storage must have three methods: one for loading, one for storing, and one for deleting a session.
This works as follows:

```js
const { session } = require('telegraf')

// may also return `Promise`s (or use `async` functions)!
const storage = {
  getItem(key) { /* load a session for `key` ... */ },
  setItem(key, value) { /* save a session for `key` ... */ },
  deleteItem(key) { /* delete a session for `key` ... */ }
}

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session({ storage }))
bot.on('photo', (ctx) => {
  ctx.session.counter = ctx.session.counter || 0
  ctx.session.counter++
  return ctx.reply(`Photo counter: ${ctx.session.counter}`)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

## Production

### Webhooks

```js
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

```js
require('http')
  .createServer(bot.webhookCallback('/secret-path'))
  .listen(3000)

require('https')
  .createServer(tlsOptions, bot.webhookCallback('/secret-path'))
  .listen(8443)
```

- [AWS Lambda example integration](https://github.com/telegraf/telegraf/blob/master/docs/examples/aws-lambda.js)
- [`express` example integration](https://github.com/telegraf/telegraf/blob/master/docs/examples/express-webhook-bot.js)
- [`fastify` example integration](https://github.com/telegraf/telegraf/blob/master/docs/examples/fastify-webhook-bot.js)
- [`koa` example integration](https://github.com/telegraf/telegraf/blob/master/docs/examples/koa-webhook-bot.js)

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

`await next()` will call next middleware and wait for it to finish:

```js
bot.use(async (ctx, next) => {
  const start = Date.now()
  await next() // runs next middleware
  // runs after next middleware finishes
  const ms = Date.now() - start
  console.log('Response time: %sms', ms)
})
```

This simple ability has endless applications:
- [`Composer`] and [`Router`],
- [extending `Context`](#extending-context), [`session`], [`Scenes`],
- [stuff other people came up with](https://www.npmjs.com/search?q=telegraf-),
- whatever **you** come up with!

[`Composer`]: https://telegraf.js.org/classes/composer.html
[`Context`]: https://telegraf.js.org/classes/context.html
[`Router`]: https://telegraf.js.org/classes/router.html
[`session`]: #session-middleware
[`Scenes`]: https://telegraf.js.org/modules/scenes.html
[`Telegraf`]: https://telegraf.js.org/classes/telegraf.html

### Usage with TypeScript

Telegraf is written in TypeScript and therefore ships with declaration files for the entire library.
Moreover, it includes types for the complete Telegram API via the [`typegram`](https://github.com/KnorpelSenf/typegram) package.
While most types of Telegraf's API surface are self-explanatory, there's some notable things to keep in mind.

#### Custom Context Type and Middleware

Recap from the above section about Middleware that `ctx` is the context object that holds information about the incoming update, as well as a number of convenience functions such as `ctx.reply`.

The exact shape of `ctx` can vary based on the installed middleware.
Some custom middleware might register properties on the context object that Telegraf is not aware of.
Consequently, you can change the type of `ctx` to fit your needs in order for you to have proper TypeScript types for your data.
This is done through Generics:

```ts
import { Context, Telegraf } from "telegraf";

// Define your own context type
interface MyContext extends Context {
  myProp?: string
  myOtherProp?: number
}

// Create your bot and tell it about your context type
const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN)

// Register middleware and launch your bot as usual
bot.use((ctx, next) => {
  // Yay, `myProp` is now available here as `string | undefined`!
  ctx.myProp = ctx.chat?.first_name?.toUpperCase()
  return next()
})
// ...
```

#### Session Middleware

If you are using session middleware, you need to define your session property on your custom context object.
This could look like this:

```ts
import { Context, Telegraf } from 'telegraf'
import { session } from 'telegraf'

interface SessionData {
  lastMessageId?: number
  photoCount?: number
  // ... more session data go here
}

// Define your own context type
interface MyContext extends Context {
  session?: SessionData
  // ... more props go here
}

// Create your bot and tell it about your context type
const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN)

// Make session data available
bot.use(session())
// Register middleware and launch your bot as usual
bot.use((ctx, next) => {
  // Yay, `session` is now available here as `SessionData`!
  if (ctx.message !== undefined)
    ctx.session.lastMessageId = ctx.message.message_id
  return next()
})
bot.on('photo', (ctx, next) => {
  ctx.session.photoCount = 1 + (ctx.session.photoCount ?? 0)
  return next()
})
// ...
```
