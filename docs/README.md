## telegraf.js

Bots are special [Telegram](https://telegram.org) accounts designed to handle messages automatically. 
Users can interact with bots by sending them command messages in private or group chats. 
These accounts serve as an interface for code running somewhere on your server.

![Telegraf](header.png)
[![Bot API Version](https://img.shields.io/badge/Bot%20API-v3.6-f36caf.svg?style=flat-square)](https://core.telegram.org/bots/api)
[![NPM Version](https://img.shields.io/npm/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![node](https://img.shields.io/node/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![bitHound](https://img.shields.io/bithound/code/github/telegraf/telegraf.svg?style=flat-square)](https://www.bithound.io/github/telegraf/telegraf)
[![Build Status](https://img.shields.io/travis/telegraf/telegraf.svg?branch=master&style=flat-square)](https://travis-ci.org/telegraf/telegraf)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

#### Features

- Full [Telegram Bot API 3.6](https://core.telegram.org/bots/api) support
- [Telegram Payment Platform](https://telegram.org/blog/payments)
- [HTML5 Games](https://core.telegram.org/bots/api#games)
- [Inline mode](https://core.telegram.org/bots/api#inline-mode)
- Incredibly fast
- [now](https://now.sh)/[Firebase](https://firebase.google.com/products/functions/)/[Glitch](https://dashing-light.glitch.me)/[Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction)/[AWS **λ**](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html)/Whatever ready
- `http/https/fastify/Connect.js/express.js` compatible webhooks
- Easy to extend

#### Installation

```bash
$ npm install telegraf --save
```

or using yarn

```bash
$ yarn add telegraf
```

#### Example
  
```js
const Telegraf = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => {
  console.log('started:', ctx.from.id)
  return ctx.reply('Welcome!')
})

bot.command('help', (ctx) => ctx.reply('Try send a sticker!'))
bot.hears('hi', (ctx) => ctx.reply('Hey there!'))
bot.hears(/buy/i, (ctx) => ctx.reply('Buy-buy!'))
bot.on('sticker', (ctx) => ctx.reply('👍'))

bot.startPolling()
```

For additional bot examples see [`examples`](https://github.com/telegraf/telegraf/tree/master/docs/examples) folder.

<p class="tip">
  Also, checkout our <a href="https://github.com/telegraf/micro-bot">step-by-step instructions</a> for building and deploying basic bot with <a href="https://github.com/telegraf/micro-bot">🤖 micro-bot</a> (Telegraf high level wrapper)
</p>

**Community bots:**

* [yt-search-bot](https://github.com/Finalgalaxy/yt-search-bot)
* [scrobblerBot](https://github.com/drvirtuozov/scrobblerBot)
* [Counter Bot](https://github.com/leodj/telegram-counter-bot)
* [GNU/Linux Indonesia Bot](https://github.com/bgli/bglibot-js)
* [The Guard Bot](https://github.com/TheDevs-Network/the-guard-bot)
* [Chat Linker Bot](https://github.com/jt3k/chat-linker)
* [Spyfall Game Bot](https://github.com/verget/telegram-spy-game)
* [telegram-telegraf-bot](https://github.com/Finalgalaxy/telegram-telegraf-bot)
* [midnabot](https://github.com/wsknorth/midnabot)
* [Metal Archives Bot](https://github.com/amiralies/metalarchives-telegram-bot)
* [Syntax Highlighter Bot](https://github.com/piterden/syntax-highlighter-bot)
* Send PR to add link to your bot

## Introduction

#### Telegram token

To use the [Telegram Bot API](https://core.telegram.org/bots/api), 
you first have to [get a bot account](https://core.telegram.org/bots) 
by [chatting with BotFather](https://core.telegram.org/bots#6-botfather).

BotFather will give you a *token*, something like `123456789:AbCdfGhIJKlmNoQQRsTUVwxyZ`.

#### Bot

A Telegraf bot is an object containing an array of middlewares which are composed 
and executed in a stack-like manner upon request. Is similar to many other middleware systems 
that you may have encountered such as Koa, Ruby's Rack, Connect.

#### Middleware

Middleware is an essential part of any modern framework.
It allows you to modify requests and responses as they pass between the Telegram and your bot.

You can imagine middleware as a chain of logic connection your bot to the Telegram request.

Middleware normally takes two parameters (ctx, next), `ctx` is the context for one Telegram update, 
`next` is a function that is invoked to execute the downstream middleware. 
It returns a Promise with a then function for running code after completion.

```js
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use((ctx, next) => {
  const start = new Date()
  return next(ctx).then(() => {
    const ms = new Date() - start
    console.log('Response time %sms', ms)
  })
})

bot.on('text', (ctx) => ctx.reply('Hello World'))
```

##### Cascading with async functions

You might need Babel or `node >=v.7.x` with harmony flags or `@std/esm` package for running following example.

```js
bot.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log('Response time %sms', ms)
})
```

##### Known middleware

- [Internationalization](https://github.com/telegraf/telegraf-i18n)
- [Redis powered session](https://github.com/telegraf/telegraf-session-redis)
- [Local powered session (via lowdb)](https://github.com/RealSpeaker/telegraf-session-local)
- [Rate-limiting](https://github.com/telegraf/telegraf-ratelimit)
- [Natural language processing via wit.ai](https://github.com/telegraf/telegraf-wit)
- [Natural language processing via recast.ai](https://github.com/telegraf/telegraf-recast)
- [Multivariate and A/B testing](https://github.com/telegraf/telegraf-experiments)
- [Powerfull bot stats via Mixpanel](https://github.com/telegraf/telegraf-mixpanel)
- [statsd integration](https://github.com/telegraf/telegraf-statsd)
- [and more...](https://www.npmjs.com/search?q=telegraf-)

#### Error handling

By default Telegraf will print all errors to stderr and rethrow error.

To perform custom error-handling logic use following snippet:

```js
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.catch((err) => {
  console.log('Ooops', err)
})
``` 

#### Context

A Telegraf Context encapsulates telegram message.
Context is created per request and contains following props:

* `ctx.telegram `            - Telegram client instance
* `ctx.webhookReply `        - Shortcut to `ctx.telegram.webhookReply`
* `ctx.updateType `          - Update type (message, inline_query, etc.)

* `[ctx.updateSubTypes]`     - Update subtypes (text, sticker, audio, etc.)
* `[ctx.message]`            - Received message
* `[ctx.editedMessage]`      - Edited message
* `[ctx.inlineQuery]`        - Received inline query
* `[ctx.chosenInlineResult]` - Received inline query result
* `[ctx.callbackQuery]`      - Received callback query
* `[ctx.shippingQuery]`      - Shipping query
* `[ctx.preCheckoutQuery]`   - Precheckout query
* `[ctx.channelPost]`        - New incoming channel post of any kind — text, photo, sticker, etc.
* `[ctx.editedChannelPost]`  - New version of a channel post that is known to the bot and was edited
* `[ctx.chat]`               - Current chat info
* `[ctx.from]`               - Sender info
* `[ctx.match]`              - Regex match (available only for `hears`, `command`, `action` handlers)

```js
bot.use((ctx) => {
  console.log(ctx.message)
})
```

##### Extending context

The recommended way to extend bot context:

```js
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.context.db = {
  getScores: () => { return 42 }
}

bot.on('text', (ctx) => {
  const scores = ctx.db.getScores(ctx.message.from.username)
  return ctx.reply(`${ctx.message.from.username}: ${score}`)
})
```

##### Shortcuts

Context shortcuts for **message** update:

* `addStickerToSet`         -> [`telegram.addStickerToSet`](#addstickertoset)
* `createNewStickerSet`     -> [`telegram.createNewStickerSet`](#createnewstickerset)
* `deleteChatPhoto`         -> [`telegram.deleteChatPhoto`](#deletechatphoto)
* `deleteMessage`           -> [`telegram.deleteMessage`](#deletemessage)
* `deleteStickerFromSet`    -> [`telegram.deleteStickerFromSet`](#deletestickerfromset)
* `exportChatInviteLink`    -> [`telegram.exportChatInviteLink`](#exportchatinvitelink)
* `getChat`                 -> [`telegram.getChat`](#getchat)
* `getChatAdministrators`   -> [`telegram.getChatAdministrators`](#getchatadministrators)
* `getChatMember`           -> [`telegram.getChatMember`](#getchatmember)
* `getChatMembersCount`     -> [`telegram.getChatMembersCount`](#getchatmemberscount)
* `getStickerSet`           -> [`telegram.getStickerSet`](#getstickerset)
* `leaveChat`               -> [`telegram.leaveChat`](#leavechat)
* `pinChatMessage`          -> [`telegram.pinChatMessage`](#pinchatmessage)
* `reply`                   -> [`telegram.sendMessage`](#sendmessage)
* `replyWithAudio`          -> [`telegram.sendAudio`](#sendaudio)
* `replyWithChatAction`     -> [`telegram.sendChatAction`](#sendchataction)
* `replyWithDocument`       -> [`telegram.sendDocument`](#senddocument)
* `replyWithGame`           -> [`telegram.sendGame`](#sendgame)
* `replyWithHTML`           -> [`telegram.sendMessage`](#sendmessage)
* `replyWithInvoice`        -> [`telegram.sendInvoice`](#sendinvoice)
* `replyWithLocation`       -> [`telegram.sendLocation`](#sendlocation)
* `replyWithMarkdown`       -> [`telegram.sendMessage`](#sendmessage)
* `replyWithPhoto`          -> [`telegram.sendPhoto`](#sendphoto)
* `replyWithMediaGroup`     -> [`telegram.sendMediaGroup`](#sendmediagroup)
* `replyWithSticker`        -> [`telegram.sendSticker`](#sendsticker)
* `replyWithVideo`          -> [`telegram.sendVideo`](#sendvideo)
* `replyWithVideoNote`      -> [`telegram.sendVideoNote`](#sendvideonote)
* `replyWithVoice`          -> [`telegram.sendVoice`](#sendvoice)
* `setChatDescription`      -> [`telegram.setChatDescription`](#setchatdescription)
* `setChatPhoto`            -> [`telegram.setChatPhoto`](#setchatphoto)
* `setChatTitle`            -> [`telegram.setChatTitle`](#setchattitle)
* `setStickerPositionInSet` -> [`telegram.setStickerPositionInSet`](#setstickerpositioninset)
* `unpinChatMessage`        -> [`telegram.unpinChatMessage`](#unpinchatmessage)
* `uploadStickerFile`       -> [`telegram.uploadStickerFile`](#uploadstickerfile)

Context shortcuts for **callback_query** update:

* `addStickerToSet`         -> [`telegram.addStickerToSet`](#addstickertoset)
* `answerCbQuery`           -> [`telegram.answerCbQuery`](#answercbquery)
* `answerGameQuery`         -> [`telegram.answerGameQuery`](#answergamequery)
* `createNewStickerSet`     -> [`telegram.createNewStickerSet`](#createnewstickerset)
* `deleteChatPhoto`         -> [`telegram.deleteChatPhoto`](#deletechatphoto)
* `deleteMessage`           -> [`telegram.deleteMessage`](#deletemessage)
* `deleteStickerFromSet`    -> [`telegram.deleteStickerFromSet`](#deletestickerfromset)
* `editMessageCaption`      -> [`telegram.editMessageCaption`](#editmessagecaption)
* `editMessageReplyMarkup`  -> [`telegram.editMessageReplyMarkup`](#editmessagereplymarkup)
* `editMessageText`         -> [`telegram.editMessageText`](#editmessagetext)
* `exportChatInviteLink`    -> [`telegram.exportChatInviteLink`](#exportchatinvitelink)
* `getChat`                 -> [`telegram.getChat`](#getchat)
* `getChatAdministrators`   -> [`telegram.getChatAdministrators`](#getchatadministrators)
* `getChatMember`           -> [`telegram.getChatMember`](#getchatmember)
* `getChatMembersCount`     -> [`telegram.getChatMembersCount`](#getchatmemberscount)
* `getStickerSet`           -> [`telegram.getStickerSet`](#getstickerset)
* `leaveChat`               -> [`telegram.leaveChat`](#leavechat)
* `pinChatMessage`          -> [`telegram.pinChatMessage`](#pinchatmessage)
* `reply`                   -> [`telegram.sendMessage`](#sendmessage)
* `replyWithAudio`          -> [`telegram.sendAudio`](#sendaudio)
* `replyWithChatAction`     -> [`telegram.sendChatAction`](#sendchataction)
* `replyWithDocument`       -> [`telegram.sendDocument`](#senddocument)
* `replyWithGame`           -> [`telegram.sendGame`](#sendgame)
* `replyWithHTML`           -> [`telegram.sendMessage`](#sendmessage)
* `replyWithInvoice`        -> [`telegram.sendInvoice`](#sendinvoice)
* `replyWithLocation`       -> [`telegram.sendLocation`](#sendlocation)
* `replyWithMarkdown`       -> [`telegram.sendMessage`](#sendmessage)
* `replyWithPhoto`          -> [`telegram.sendPhoto`](#sendphoto)
* `replyWithMediaGroup`     -> [`telegram.sendMediaGroup`](#sendmediagroup)
* `replyWithSticker`        -> [`telegram.sendSticker`](#sendsticker)
* `replyWithVideo`          -> [`telegram.sendVideo`](#sendvideo)
* `replyWithVideoNote`      -> [`telegram.sendVideoNote`](#sendvideonote)
* `replyWithVoice`          -> [`telegram.sendVoice`](#sendvoice)
* `setChatDescription`      -> [`telegram.setChatDescription`](#setchatdescription)
* `setChatPhoto`            -> [`telegram.setChatPhoto`](#setchatphoto)
* `setChatTitle`            -> [`telegram.setChatTitle`](#setchattitle)
* `setStickerPositionInSet` -> [`telegram.setStickerPositionInSet`](#setstickerpositioninset)
* `unpinChatMessage`        -> [`telegram.unpinChatMessage`](#unpinchatmessage)
* `uploadStickerFile`       -> [`telegram.uploadStickerFile`](#uploadstickerfile)

Context shortcuts for **inline_query** update:

* `answerInlineQuery`-> [`telegram.answerInlineQuery`](#answerinlinequery)

Context shortcuts for **shipping_query** update:

* `answerShippingQuery`-> [`telegram.answerShippingQuery`](#answershippingquery)

Context shortcuts for **pre_checkout_query** update:

* `answerPreCheckoutQuery`-> [`telegram.answerPreCheckoutQuery`](#answerprecheckoutquery)

##### Shortcuts usage example

```js
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('text', (ctx) => {
  // Explicit usage
  ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`)

  // Using shortcut
  ctx.reply(`Hello ${ctx.state.role}`)
})

bot.on('/quit', (ctx) => {
  // Explicit usage
  ctx.telegram.leaveChat(ctx.message.chat.id)

  // Using shortcut
  ctx.leaveChat()
})

bot.on('callback_query', (ctx) => {
  // Explicit usage
  ctx.telegram.answerCbQuery(ctx.callbackQuery.id)

  // Using shortcut
  ctx.answerCbQuery()
})

bot.on('inline_query', (ctx) => {
  const result = []
  // Explicit usage
  ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)

  // Using shortcut
  ctx.answerInlineQuery(result)
})
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
```

#### Session

```js
const session = require('telegraf/session')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())
bot.on('text', (ctx) => {
  ctx.session.counter = ctx.session.counter || 0
  ctx.session.counter++
  return ctx.reply(`Message counter:${ctx.session.counter}`)
})
```

**Note: For persistent sessions you might use any of [`telegraf-session-*`](https://www.npmjs.com/search?q=telegraf-session) middleware.**

#### Update types

Supported update types:

- `message`
- `edited_message`
- `callback_query`
- `inline_query`
- `shipping_query`
- `pre_checkout_query`
- `chosen_inline_result`
- `channel_post`
- `edited_channel_post`

Available update sub-types:

- `text`
- `audio`
- `document`
- `photo`
- `sticker`
- `video`
- `voice`
- `contact`
- `location`
- `venue`
- `new_chat_members`
- `left_chat_member`
- `new_chat_title`
- `new_chat_photo`
- `delete_chat_photo`
- `group_chat_created`
- `migrate_to_chat_id`
- `supergroup_chat_created`
- `channel_chat_created`
- `migrate_from_chat_id`
- `pinned_message`
- `game`
- `video_note`
- `invoice`
- `successful_payment`
- `connected_website`

```js
// Handle message update
bot.on('message', (ctx) => {
  return ctx.reply('Hey there!')
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
    // This is necessary only if the client uses the self-signed certificate.
    fs.readFileSync('client-cert.pem')
  ]
}

// Set telegram webhook
bot.telegram.setWebhook('https://server.tld:8443/secret-path', {
  source: fs.readFileSync('server-cert.pem')
})

// Start https webhook
bot.startWebhook('/secret-path', tlsOptions, 8443)

// Http webhook, for nginx/heroku users.
bot.startWebhook('/secret-path', null, 5000)
```

Use webhookCallback() if you want to attach telegraf to existing http server

```js
require('http')
  .createServer(bot.webhookCallback('/secret-path'))
  .listen(3000)

require('https')
  .createServer(tlsOptions, bot.webhookCallback('/secret-path'))
  .listen(8443)
```

Express.js example integration

```js
const Telegraf = require('telegraf')
const express = require('express')
const expressApp = express()

const bot = new Telegraf(process.env.BOT_TOKEN)
expressApp.use(bot.webhookCallback('/secret-path'))
bot.telegram.setWebhook('https://server.tld:8443/secret-path')

expressApp.get('/', (req, res) => {
  res.send('Hello World!')
})

expressApp.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})
```

Fastify example integration

```js
const Telegraf = require('telegraf')
const fastifyApp = require('fastify')()

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('text', ({ reply }) => reply('Hey there!'))
fastifyApp.use(bot.webhookCallback('/secret-path'))
// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
bot.telegram.setWebhook('https://------.localtunnel.me/secret-path')

fastifyApp.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})
```

Koa.js example integration

```js
const Telegraf = require('telegraf')
const Koa = require('koa')
const koaBody = require('koa-body')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.telegram.setWebhook('https://server.tld:8443/secret-path')

const app = new Koa()
app.use(koaBody())
app.use((ctx, next) => ctx.method === 'POST' || ctx.url === '/secret-path'
  ? bot.handleUpdate(ctx.request.body, ctx.response)
  : next()
)
app.listen(3000)
```

#### Working with files

Supported file sources:

- `Existing file_id`
- `File path`
- `Url`
- `Buffer`
- `ReadStream`

Also you can provide optional name of file as `filename`.

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

## API reference

#### Telegraf

Telegraf API reference

```js
const Telegraf = require('telegraf')
```

##### Constructor

Initialize new Telegraf bot.

`const telegraf = new Telegraf(token, [options])`

| Param | Type | Description |
| --- | --- | --- |
| token | `string` | [Bot Token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) |
| [options] | `object` | Telegraf options |

Telegraf options:

```js
{
  telegram: {           // Telegram options
    agent: null,        // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
    webhookReply: true  // Reply via webhook
  },
  username: ''          // Bot username (optional)
  channelMode: false    // Handle `channel_post` updates as messages (optional)
}
```

##### token

Use this property to get/set bot token.

`telegraf.token = [string]`

##### webhookReply

Use this property to control `reply via webhook` feature.

`telegraf.webhookReply = [bool]`

##### use

Registers a middleware.

`telegraf.use(...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware function |

##### on

Registers middleware for provided update type.

`telegraf.on(updateTypes, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| updateTypes | `string/string[]` | Update type |
| middleware | `function` | Middleware |

##### hears

Registers middleware for handling `text` messages.

`telegraf.hears(triggers, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function` | Triggers |
| middleware | `function` | Middleware |

##### command

Command handling.

`telegraf.command(commands, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| commands | `string/string[]` | Commands |
| middleware | `function` | Middleware |

##### start

Tiny wrapper for /start command.

`telegraf.start(...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware |

##### entity

Entity handling.

`telegraf.entity(entity, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| entity | `string/string[]/RegEx/RegEx[]/Function` | Entity name |
| middleware | `function` | Middleware |

##### mention

Mention handling.

`telegraf.mention(username, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| username | `string/string[]` | Username |
| middleware | `function` | Middleware |

##### hashtag

Hashtag handling.

`telegraf.hashtag(hashtag, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| hashtag | `string/string[]` | Hashtag |
| middleware | `function` | Middleware |

##### action

Registers middleware for handling `callback_data` actions with regular expressions.

`telegraf.action(triggers, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]` | Triggers |
| middleware | `function` | Middleware |


##### gameQuery

Registers middleware for handling `callback_data` actions with game query.

`telegraf.gameQuery(...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware |

##### startPolling

Start poll updates.

`telegraf.startPolling([timeout], [limit], [allowedUpdates], [stopCallback])`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [timeout] | `number` | 30 | Poll timeout in seconds |
| [limit] | `number` | 100 | Limits the number of updates to be retrieved |
| [allowedUpdates] | `string[]` | null | List the types of updates you want your bot to receive |
| [stopCallback] | `function` | null | Polling stop callback |

##### startWebhook

Start listening @ `https://host:port/webhookPath` for Telegram calls.

`telegraf.startWebhook(webhookPath, [tlsOptions], port, [host])`

| Param | Type | Description |
| ---  | --- | --- |
| webhookPath | `string` | Webhook url path (see Telegraf.setWebhook) |
| [tlsOptions] | `object` | [TLS server options](https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener). Pass null to use http |
| port | `number` | Port number |
| [host] | `string` | Hostname |

##### stop

Stop Webhook and polling

`telegraf.stop([callback])`

##### webhookCallback

Return a callback function suitable for the http[s].createServer() method to handle a request. 
You may also use this callback function to mount your telegraf app in a Connect/Express app.

`telegraf.webhookCallback(webhookPath) => Function`

| Param | Type | Description |
| ---  | --- | --- |
| webhookPath | `string` | Webhook url path (see Telegraf.setWebhook) |

##### handleUpdate

Handle raw Telegram update. 
In case you use centralized webhook server, queue, etc.  

`telegraf.handleUpdate(rawUpdate, [webhookResponse])`

| Param | Type | Description |
| --- | --- | --- |
| rawUpdate | `object` | Telegram update payload |
| [webhookResponse] | `object` | [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) |

##### Telegraf.compose

Compose `middlewares` returning a fully valid middleware comprised of all those which are passed.

`Telegraf.compose(middlewares) => function`

| Param | Type | Description |
| --- | --- | --- |
| middlewares | `function[]` | Array of middlewares |

##### Telegraf.mount

Generates middleware for handling provided update types.

`Telegraf.mount(updateTypes, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| updateTypes | `string/string[]` | Update type |
| middleware | `function` | middleware |

##### Telegraf.hears

Generates middleware for handling `text` messages with regular expressions.

`Telegraf.hears(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

##### Telegraf.action

Generates middleware for handling `callbackQuery` data with regular expressions.

`Telegraf.action(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

##### Telegraf.passThru

Generates pass thru middleware.

`Telegraf.passThru() => function`

##### Telegraf.safePassThru

Generates safe version of pass thru middleware.

`Telegraf.safePassThru() => function`

##### Telegraf.optional

Generates optional middleware.

`Telegraf.optional(test, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| test | `truthy/function` | Value or predicate `(ctx) => bool` |
| middleware | `function` | middleware |

##### Telegraf.drop

Generates drop middleware.

`Telegraf.drop(test) => function`

| Param | Type | Description |
| --- | --- | --- |
| test | `truthy/function` | Value or predicate `(ctx) => bool` |

##### Telegraf.filter

Generates filter middleware.

`Telegraf.filter(test) => function`

| Param | Type | Description |
| --- | --- | --- |
| test | `truthy/function` | Value or predicate `(ctx) => bool` |

##### Telegraf.branch

Generates branch middleware.

`Telegraf.branch(test, trueMiddleware, falseMiddleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| test | `truthy/function` | Value or predicate `(ctx) => bool` |
| trueMiddleware | `function` | true action  middleware |
| falseMiddleware | `function` | false action middleware |


#### Telegram

Telegram client API reference.

```js
const Telegram = require('telegraf/telegram')
```

##### Constructor

Initialize new Telegram client.

`const telegram = new Telegram(token, [options])`

| Param | Type | Description |
| --- | --- | --- |
| token | `string` | [Bot Token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) |
| [options] | `object` | Telegram options |

Telegram options:

```js
{
  agent: null,        // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
  webhookReply: true  // Reply via webhook
}
```

##### webhookReply

Use this property to control `reply via webhook` feature.

`telegram.webhookReply = [bool]`

##### addStickerToSet

Use this method to add a new sticker to a set created by the bot.

`telegram.addStickerToSet(ownerId, name, stickerData) => Promise`
[Official documentation](https://core.telegram.org/bots/api#addstickertoset)

| Param | Type | Description |
| --- | --- | --- |
| ownerId | `string` | User identifier of sticker set owner |
| name | `string` | Sticker set name |
| stickerData | `Object` | Sticker data({png_sticker: 'stiker file', emojis: '😉', mask__position: '' }) |

##### answerCbQuery

Use this method to send answers to callback queries.

`telegram.answerCbQuery(callbackQueryId, text, [showAlert], [extra]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#answercallbackquery)

| Param | Type | Description |
| --- | --- | --- |
| callbackQueryId | `string` | Query id |
| [text] | `string` | Notification text |
| [showAlert] | `bool` | Show alert instead of notification |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#answercallbackquery) |

##### answerGameQuery

Use this method to send answers to game query.

`telegram.answerGameQuery(callbackQueryId, url) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| callbackQueryId | `string` | Query id |
| url | `string` | Notification text |

##### answerShippingQuery

Use this method to send answers to shipping query.

`telegram.answerShippingQuery(shippingQueryId, ok, shippingOptions, [errorMessage]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| shippingQueryId | `string` | Shipping Query id |
| ok | `bool` | Specify True if delivery to the specified address is possible |
| shippingOptions | `object` | [Shipping Options](https://core.telegram.org/bots/api#answershippingquery) |
| [errorMessage] | `string` | Error message in human readable form  |

##### answerPreCheckoutQuery

Use this method to send answers to shipping query.

`telegram.answerPreCheckoutQuery(preCheckoutQueryId, ok, [errorMessage]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| preCheckoutQueryId | `string` | Shipping Query id |
| ok | `bool` | Specify True if everything is alright (goods are available, etc.) |
| [errorMessage] | `string` | Error message in human readable form  |

##### answerInlineQuery

Use this method to send answers to an inline query.

`telegram.answerInlineQuery(inlineQueryId, results, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| inlineQueryId | `string` | Query id |
| results | `object[]` | Results |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#answerinlinequery)|

##### createNewStickerSet

Use this method to create new sticker set owned by a user.

`telegram.createNewStickerSet(ownerId, name, title, stickerData, [isMasks]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#createnewstickerset)

| Param | Type | Description |
| --- | --- | --- |
| ownerId | `string` | User identifier of sticker set owner |
| name | `string` | Sticker set name |
| title | `string` | Sticker set title |
| stickerData | `object` | Sticker data({png_sticker: 'stiker file', emojis: '😉', mask__position: '' }) |
| [isMasks] | `bool` | Pass True, if a set of mask stickers should be created |

##### deleteChatStickerSet

Use this method to delete a group sticker set from a supergroup.

`telegram.deleteChatStickerSet(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#deletechatstickerset)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

##### deleteMessage

Use this method to delete bot messages.

`telegram.deleteMessage(chatId, messageId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#deletemessage)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |

##### deleteStickerFromSet

Use this method to delete a sticker from a set created by the bot.

`telegram.deleteStickerFromSet(stickerId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#deletestickerfromset)

| Param | Type | Description |
| --- | --- | --- |
| stickerId | `string` | File identifier of the sticker |

##### editMessageCaption

Use this method to edit captions of messages sent by the bot or via the bot.

`telegram.editMessageCaption(chatId, messageId, inlineMessageId, caption, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| caption | `string` | Caption |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagecaption)|

##### editMessageLiveLocation

Use this method to edit live location messages sent by the bot or via the bot.

`telegram.editMessageLiveLocation(latitude, longitude, chatId, messageId, inlineMessageId, [markup]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#editmessagelivelocation)

| Param | Type | Description |
| --- | --- | --- |
| latitude | `string` | Latitude of new location |
| longitude | `string` | Longitude of new location |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| [markup] | `object` | Keyboard markup |

##### editMessageReplyMarkup

Use this method to edit only the reply markup of messages sent by the bot or via the bot.

`telegram.editMessageReplyMarkup(chatId, messageId, inlineMessageId, markup, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| markup | `object` | Keyboard markup |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagereplymarkup)|

##### editMessageText

Use this method to edit text messages sent by the bot or via the bot.

`telegram.editMessageText(chatId, messageId, inlineMessageId, text, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| text | `string` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagetext)|

##### forwardMessage

Forwards message.

`telegram.forwardMessage(chatId, fromChatId, messageId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Target Chat id |
| fromChatId | `number/string` | Source Chat id |
| messageId | `number` | Message id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#forwardmessage)|


##### sendCopy

Sends message copy.

`telegram.sendCopy(chatId, message, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Target Chat id |
| message | `object` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendmessage)|

##### getWebhookInfo

Use this method to get current webhook status. Requires no parameters. On success, returns a WebhookInfo object. If the bot is using getUpdates, will return an object with the url field empty.

`telegram.getWebhookInfo() => Promise`

##### getChat

Use this method to get up to date information about the chat (current name of the user for one-on-one conversatio
ns, current username of a user, group or channel, etc.).

`telegram.getChat(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getchat)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

##### getChatAdministrators

Use this method to get a list of administrators in a chat. On success, returns an Array of ChatMember objects that contains information about all chat administrators except other bots. If the chat is a group or a supergroup and no administrators were appointed, only the creator will be returned.

`telegram.getChatAdministrators(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getchatadministrators)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

##### setGameScore

Use this method to set the score of the specified user in a game. On success, if the message was sent by the bot, returns the edited Message, otherwise returns True. Returns an error, if the new score is not greater than the user's current score in the chat.

`telegram.setGameScore(userId, score, inlineMessageId, chatId, messageId, [editMessage], [force]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setgamescore)

| Param | Type | Description |
| --- | --- | --- |
| userId | `number` | Target User id |
| score | `number` | Target User id |
| inlineMessageId | `string` | Inline message id |
| chatId | `number/string` | Target Chat id |
| messageId | `number/string` | Message id |
| [editMessage] | `boolean` | edit target message, default value is True |
| [force] | `boolean` | Pass True, if the high score is allowed to decrease. This can be useful when fixing mistakes or banning cheaters |

##### getGameHighScores

Use this method to get data for high score tables. Will return the score of the specified user and several of his neighbors in a game. On success, returns an Array of GameHighScore objects.

`telegram.getGameHighScores(userId, inlineMessageId, chatId, messageId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getgamehighscores)

| Param | Type | Description |
| --- | --- | --- |
| userId | `number`\ | Target User id |
| inlineMessageId | `string` | Inline message id |
| chatId | `number/string` | Target Chat id |
| messageId | `number/string` | Message id |

##### getChatMember

Use this method to get information about a member of a chat.

`telegram.getChatMember(chatId, userId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getchatmember)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| userId | `number` |   User identifier |

##### getChatMembersCount

Use this method to get the number of members in a chat.

`telegram.getChatMembersCount(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getchatmemberscount)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

##### getFile

Returns basic info about a file and prepare it for downloading.

`telegram.getFile(fileId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getfile)

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string` | File id |

##### getFileLink

Returns link to file.

`telegram.getFileLink(fileId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string/object` | File id or file object |

##### getMe

Returns basic information about the bot.

`telegram.getMe() => Promise`
[Official documentation](https://core.telegram.org/bots/api#getme)

##### getStickerSet

Use this method to get a sticker set.

`telegram.getStickerSet(name) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Short name of the sticker set |
[Official documentation](https://core.telegram.org/bots/api#getstickerset)

##### getUserProfilePhotos

Returns profiles photos for provided user.

`telegram.getUserProfilePhotos(userId, [offset], [limit]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getuserprofilephotos)

| Param | Type | Description |
| --- | --- | --- |
| userId | `number` | Chat id |
| [offset] | `number` | Offset |
| [limit] | `number` | Limit |

##### kickChatMember

Use this method to kick a user from a group or a supergroup.

`telegram.kickChatMember(chatId, userId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| userId | `number` | User id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#kickchatmember)|

##### restrictChatMember

Use this method to restrict a user in a supergroup. 

`telegram.restrictChatMember(chatId, userId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| userId | `number` | User id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#restrictchatmember)|

##### promoteChatMember

Use this method to promote or demote a user in a supergroup or a channel.

`telegram.promoteChatMember(chatId, userId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| userId | `number` | User id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#promotechatmember)|

##### exportChatInviteLink

Use this method to export an invite link to a supergroup or a channel.

`telegram.exportChatInviteLink(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#exportchatinvitelink)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

##### setChatPhoto

Use this method to set a new profile photo for the chat.

`telegram.setChatPhoto(chatId, photo) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setchatphoto)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| photo | `File` | New chat photo |

##### deleteChatPhoto

Use this method to delete a chat photo.

`telegram.deleteChatPhoto(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#deletechatphoto)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

##### setChatTitle

Use this method to change the title of a chat.

`telegram.setChatTitle(chatId, title) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setchattitle)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| title | `string` | New chat title, 1-255 characters |

##### setChatDescription

Use this method to change the description of a supergroup or a channel.

`telegram.setChatDescription(chatId, description) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setchattitle)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| description | `string` | New chat description, 0-255 characters |

##### setChatStickerSet

Use this method to set a new group sticker set for a supergroup. 

`telegram.setChatStickerSet(chatId, stickerSetName) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setchatstickerset)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| stickerSetName | `string` | Name of the sticker set |

##### pinChatMessage

Use this method to pin a message in a supergroup.

`telegram.pinChatMessage(chatId, messageId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `number` | Message id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#pinchatmessage)|

##### unpinChatMessage

Use this method to unpin a message in a supergroup chat.

`telegram.unpinChatMessage(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#unpinchatmessage)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

##### leaveChat

Use this method for your bot to leave a group, supergroup or channel.

`telegram.leaveChat(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#leavechat)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

##### deleteWebhook

Removes webhook integration.

`telegram.deleteWebhook() => Promise`
[Official documentation](https://core.telegram.org/bots/api#deletewebhook)

##### sendAudio

Sends audio.

`telegram.sendAudio(chatId, audio, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| audio | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendaudio)|


##### sendGame

Sends game.

`telegram.sendGame(chatId, gameName, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| gameName | `String` | Game short name |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendgame)|

##### sendChatAction

Sends chat action.

`telegram.sendChatAction(chatId, action) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| action | `string` | [Chat action](https://core.telegram.org/bots/api#sendchataction) |

##### sendContact

Sends document.

`telegram.sendContact(chatId, phoneNumber, firstName, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| phoneNumber | `string` | Contact phone number |
| firstName | `string` | Contact first name |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendcontact)|

##### sendDocument

Sends document.

`telegram.sendDocument(chatId, doc, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| doc | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#senddocument)|

##### sendLocation

Sends location.

`telegram.sendLocation(chatId, latitude, longitude, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| latitude | `number` | Latitude |
| longitude | `number` | Longitude |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendlocation)|

##### sendMessage

Sends text message.

`telegram.sendMessage(chatId, text, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| text | `string` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendmessage)|

##### sendPhoto

Sends photo.

`telegram.sendPhoto(chatId, photo, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| photo | `File` | Photo |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendphoto)|

##### sendMediaGroup

Sends media album.

`telegram.sendMediaGroup(chatId, media, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| media | `InputMedia[]` | Media array |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendmediagroup)|

##### sendSticker

Sends sticker.

`telegram.sendSticker(chatId, sticker, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| sticker | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendsticker)|

##### setStickerPositionInSet

Use this method to move a sticker in a set created by the bot to a specific position.

`telegram.setStickerPositionInSet(sticker, position) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| sticker | `string` | File identifier of the sticker |
| position | `number` | New sticker position in the set, zero-based |

##### sendVenue

Sends venue information.

`telegram.sendVenue(chatId, latitude, longitude, title, address, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| latitude | `number` | Latitude |
| longitude | `number` | Longitude |
| title | `string` | Venue title |
| address | `string` | Venue address |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvenue)|

##### sendInvoice

Sends invoice.

`telegram.sendInvoice(chatId, invoice) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| invoice | `object` | [Invoice object](https://core.telegram.org/bots/api#sendinvoice) |

##### sendVideo

Sends video.

`telegram.sendVideo(chatId, video, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| video | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvideo)|

##### sendVideoNote

Sends round video.

`telegram.sendVideoNote(chatId, video, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| video | `File` | Video note file |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvideonote)|

##### sendVoice

Sends voice.

`telegram.sendVoice(chatId, voice, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| voice | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvoice)|

##### stopMessageLiveLocation

Use this method to stop updating a live location message sent by the bot or via the bot (for inline bots) before live_period expires.

`telegram.stopMessageLiveLocation(chatId, messageId, inlineMessageId, [markup]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#stopmessagelivelocation)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| [markup] | `object` | Keyboard markup |

##### uploadStickerFile

Use this method to upload a .png file with a sticker for later use in createNewStickerSet and addStickerToSet methods.

`telegram.uploadStickerFile(ownerId, stickerFile) => Promise`
[Official documentation](https://core.telegram.org/bots/api#uploadstickerfile)

| Param | Type | Description |
| --- | --- | --- |
| ownerId | `string` | User identifier of sticker file owner |
| stickerFile | `File` | Png image with the sticker |

##### setWebhook

Specifies an url to receive incoming updates via an outgoing webhook.

`telegram.setWebhook(url, [cert], [maxConnections], [allowedUpdates]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setwebhook)

| Param | Type | Description |
| ---  | --- | --- |
| url  | `string` | Public url for webhook |
| [cert] | `File` | SSL public certificate |
| [maxConnections] | `number` | User id |
| [allowedUpdates] | `string[]` | List the types of updates you want your bot to receive |

##### unbanChatMember

Use this method to unban a previously kicked user in a supergroup.

`telegram.unbanChatMember(chatId, userId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#unbanchatmember)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| userId | `number` | User id |

#### Extra

Telegram message options helper, [see examples](https://github.com/telegraf/telegraf/tree/develop/docs/examples/).

#### Markup

Telegram markup helper, [see examples](https://github.com/telegraf/telegraf/tree/develop/docs/examples/).

#### Stage

Simple scene-based control flow middleware.

```js
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { leave } = Stage

// Greeter scene
const greeter = new Scene('greeter')
greeter.enter((ctx) => ctx.reply('Hi'))
greeter.leave((ctx) => ctx.reply('Buy'))
greeter.hears(/hi/gi, leave())
greeter.on('message', (ctx) => ctx.reply('Send `hi`'))

// Create scene manager
const stage = new Stage()
// Scene registration
stage.register(greeter)

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())
bot.use(stage.middleware())
bot.command('greeter', (ctx) => ctx.scene.enter('greeter'))
bot.command('cancel', leave())
bot.startPolling()
```

Scenes related context props and functions:

```js
bot.on('message', (ctx) => {
  ctx.scene.state                                    // Current scene sstate (persistent)
  ctx.scene.enter(sceneId, [defaultState, silent])   // Enter scenes
  ctx.scene.reenter()                                // Reenter currenst scene
  ctx.scene.leave()                                  // Leave scene s
})
```

## Recipes

<p class="tip">
  Feel free to send PR with additional recipes.
</p>

##### Command handling in group

For handling group/supergroup commands(`/start@your_bot`) you need to provide bot username.

```js
const bot = new Telegraf(process.env.BOT_TOKEN, {username: 'your_bot'})
```

Also, you can get the username from Telegram server.

```js
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
})

bot.command('foo', (ctx) => ctx.reply('Hello World'))
```

