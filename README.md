<header>
<img src="https://raw.githubusercontent.com/telegraf/telegraf/010e971f3c61c854605bf9a5af10a4925d4032fb/docs/header.png" style="background: #FFFFFF3F">

[![Bot API Version](https://img.shields.io/badge/Bot%20API-v5.0-f36caf.svg?style=flat-square)](https://core.telegram.org/bots/api)
[![install size](https://flat.badgen.net/packagephobia/install/telegraf)](https://packagephobia.com/result?p=telegraf,node-telegram-bot-api)
[![Russian chat](https://img.shields.io/badge/Russian%20chat-grey?style=flat-square&logo=telegram)](https://t.me/telegraf_ru)
[![English chat](https://img.shields.io/badge/English%20chat-grey?style=flat-square&logo=telegram)](https://t.me/TelegrafJSChat)
</header>

## Introduction

Bots are special [Telegram](https://telegram.org) accounts designed to handle messages automatically. 
Users can interact with bots by sending them command messages in private or group chats. 
These accounts serve as an interface for code running somewhere on your server.

Telegraf is a library that makes it simple for you to develop your own Telegram bots using JavaScript or [TypeScript](https://www.typescriptlang.org/).

#### Features

- Full [Telegram Bot API 5.0](https://core.telegram.org/bots/api) support
- [Telegram Payment Platform](https://telegram.org/blog/payments)
- [HTML5 Games](https://core.telegram.org/bots/api#games)
- [Inline mode](https://core.telegram.org/bots/api#inline-mode)
- [Lightweight](https://packagephobia.com/result?p=telegraf,node-telegram-bot-api)
- [Firebase](https://firebase.google.com/products/functions/)/[Glitch](https://dashing-light.glitch.me)/[Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction)/[AWS **λ**](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html)/Whatever ready
- `http/https/fastify/Connect.js/express.js` compatible webhooks
- Easy to extend
- `TypeScript` typings

#### Example
  
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

#### Resources

- [Getting started](#getting-started)
- Telegram groups (sorted by number of members):
  * [Russian](https://t.me/telegraf_ru)
  * [English](https://t.me/TelegrafJSChat)
  * [Uzbek](https://t.me/telegrafJS_uz)
  * [Ethiopian](https://t.me/telegraf_et)
- [GitHub Discussions](https://github.com/telegraf/telegraf/discussions)
- [Dependent repositories](https://libraries.io/npm/telegraf/dependent_repositories)

## Getting started

#### Telegram token

To use the [Telegram Bot API](https://core.telegram.org/bots/api), 
you first have to [get a bot account](https://core.telegram.org/bots) 
by [chatting with BotFather](https://core.telegram.org/bots#6-botfather).

BotFather will give you a *token*, something like `123456789:AbCdfGhIJKlmNoQQRsTUVwxyZ`.

#### Installation

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

#### Bot

A Telegraf bot is an object containing an array of middlewares which are composed 
and executed in a stack-like manner upon request. Is similar to many other middleware systems 
that you may have encountered such as Express, Koa, Ruby's Rack, Connect.

#### Middleware

Middleware is an essential part of any modern framework.
It allows you to modify requests and responses as they pass between the Telegram and your bot.

You can imagine middleware as a chain of logic connection your bot to the Telegram request.

Middleware normally takes the two parameters: **`ctx`** and **`next`**.

**`ctx`** is the context for one [Telegram update](https://core.telegram.org/bots/api#update). It contains mainly two things:

- the update object, containing for example the incoming message and the respective chat, and
- a number of useful methods for reacting to the update, such as replying to the message or answering a callback query.

See  [the context section](https://telegraf.js.org/#/?id=context) below for a detailed overview.

**`next`** is a function that is invoked to execute the downstream middleware.
It returns a `Promise` with a function `then` for running code after completion.

Here is a simple example for how to use middleware to track the response time, using `async` and `await` to deal with the `Promise`.

```js
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log('Response time: %sms', ms)
})

bot.on('text', (ctx) => ctx.reply('Hello World'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

Note how the function `next` is used to invoke the subsequent layers of the middleware stack, performing the actual processing of the update (in this case, replying with “Hello World”).

##### What you can do with middleware

Middleware is an extremely flexible concept that can be used for a myriad of things, including these:

- storing data per chat, per user, you name it
- allowing access to old messages (by storing them)
- making internationalization available
- rate limiting
- tracking response times (see above)
- much more

All important kinds of middleware have already been implemented, and the community keeps on adding more.
Just install a package via `npm`, add it to your bot and you're ready to go.

Here is a list of

##### Known middleware

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

#### Error handling

By default Telegraf will print all errors to `stderr` and rethrow error.

To perform custom error-handling logic, use following snippet:

```js
const bot = new Telegraf(process.env.BOT_TOKEN)
bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})
bot.start((ctx) => {
  throw new Error('Example error')
})
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
``` 

#### Context

A Telegraf Context encapsulates telegram update.
One `Context` is created for each incoming `Update`.

##### Extending context

The recommended way to extend bot context:

```js
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.context.db = {
  getScores: () => { return 42 }
}

bot.on('text', (ctx) => {
  const scores = ctx.db.getScores(ctx.message.from.username)
  return ctx.reply(`${ctx.message.from.username}: ${scores}`)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

If you're using TypeScript, have a look at the section below about usage with TypeScript.
(You need to extend the type of the context.)

##### Shortcuts

```js
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

#### State

The recommended namespace to share information between middlewares.

```js
const bot = new Telegraf(process.env.BOT_TOKEN)

// Naive authorization middleware
bot.use((ctx, next) => {
  ctx.state.role = getUserRole(ctx.message)
  return next()
})

bot.on('text', (ctx) => {
  return ctx.reply(`Hello ${ctx.state.role}`)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

#### Session

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

#### Update types

```js
// Handle message update
bot.on('message', (ctx) => {
  return ctx.reply('Hello')
})

// Handle sticker or photo update
bot.on(['sticker', 'photo'], (ctx) => {
  console.log(ctx.message)
  return ctx.reply('Cool!')
})
```
[Official Docs](https://core.telegram.org/bots/api#message)

#### Webhooks

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

#### Working with files

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

#### Telegraf Modules

Telegraf Modules is higher level abstraction for writing modular Telegram bots.

A module is simply a .js file that exports Telegraf middleware:

```js
module.exports = (ctx) => ctx.reply('Hello from Telegraf Module!')
```

```js
const Composer = require('telegraf/composer')

module.exports = Composer.mount(
  'sticker', 
  (ctx) => ctx.reply('Wow, sticker')
)
```

To run modules, you can use `telegraf` module runner, it allows you to start Telegraf module easily from the command line.

```shellscript
npm install telegraf -g
```

#### Telegraf CLI usage

```text
telegraf [opts] <bot-file>
  -t  Bot token [$BOT_TOKEN]
  -d  Webhook domain
  -H  Webhook host [0.0.0.0]
  -p  Webhook port [$PORT or 3000]
  -l  Enable logs
  -h  Show this help message
```

##### Telegraf Module example

Create module with name `bot.js` and following content:

```js
const Composer = require('telegraf/composer')
const PhotoURL = 'https://picsum.photos/200/300/?random'

const bot = new Composer()
bot.start((ctx) => ctx.reply('Hello there!'))
bot.help((ctx) => ctx.reply('Help message'))
bot.command('photo', (ctx) => ctx.replyWithPhoto({ url: PhotoURL }))

module.exports = bot
```

then run it:

```shellscript
telegraf -t "bot token" bot.js
```

#### Usage with TypeScript

Telegraf is written in TypeScript and therefore ships with declaration files for the entire library.
Moreover, it includes types for the complete Telegram API via the [`typegram`](https://github.com/KnorpelSenf/typegram) package.
While most types of Telegraf's API surface are self-explanatory, there's some notable things to keep in mind.

##### Custom Context Type and Middleware

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
const bot = new Telegraf<MyContext>('SECRET TOKEN')

// Register middleware and launch your bot as usual
bot.use((ctx, next) => {
  // Yay, `myProp` is now available here as `string | undefined`!
  ctx.myProp = ctx.chat?.first_name?.toUpperCase()
  return next()
})
// ...
```

##### Session Middleware

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
const bot = new Telegraf<MyContext>('SECRET TOKEN')

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

## API reference

Coming soon!

### `Scenes` namespace

https://github.com/telegraf/telegraf/issues/705#issuecomment-549056045
