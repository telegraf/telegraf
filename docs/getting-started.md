# Getting started

## Telegram token

To use the [Telegram Bot API](https://core.telegram.org/bots/api), you first have to [get a bot account](https://core.telegram.org/bots) by [chatting with BotFather](https://core.telegram.org/bots#6-botfather).

BotFather will give you a *token*, something like `123456789:AbCdfGhIJKlmNoQQRsTUVwxyZ`.

## Bot

A Telegraf bot is an object containing an array of middlewares which are composed and executed in a stack-like manner upon request. Is similar to many other middleware systems that you may have encountered such as Koa, Ruby's Rack, Connect.

## Middleware

Middleware is an essential part of any modern framework.
It allows you to modify requests and responses as they pass between the Telegram and your bot.

You can imagine a middleware as a chain of logic connection your bot to the Telegram request.

Middleware normally takes two parameters (ctx, next), `ctx` is the context for one Telegram update, `next` is a function that is invoked to execute the downstream middleware. It returns a Promise with a then function for running code after completion.

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
```

### Known middleware

- [Internationalization](https://github.com/telegraf/telegraf-i18n)
- [Redis powered session](https://github.com/telegraf/telegraf-session-redis)
- [Local powered session (via lowdb)](https://github.com/RealSpeaker/telegraf-session-local)
- [Rate-limiting](https://github.com/telegraf/telegraf-ratelimit)
- [Menus via inline keyboards](https://github.com/EdJoPaTo/telegraf-inline-menu)
- [Natural language processing via wit.ai](https://github.com/telegraf/telegraf-wit)
- [Natural language processing via recast.ai](https://github.com/telegraf/telegraf-recast)
- [Multivariate and A/B testing](https://github.com/telegraf/telegraf-experiments)
- [Powerful bot stats via Mixpanel](https://github.com/telegraf/telegraf-mixpanel)
- [statsd integration](https://github.com/telegraf/telegraf-statsd)
- [and more...](https://www.npmjs.com/search?q=telegraf-)

## Error handling

By default, Telegraf will print all errors to `stderr` and rethrow error.

To perform custom error-handling logic use following snippet:

```js
const bot = new Telegraf(process.env.BOT_TOKEN)
bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})
bot.start((ctx) => {
  throw new Error('Example error')
})
bot.launch()
```

## Context

A Telegraf Context encapsulates telegram update.
Context is created per request and contains following props:

| Property | Description |
| --- | --- |
| ` ctx.telegram ` | Telegram client instance |
| ` ctx.updateType ` | Update type (message, inline_query, etc.) |
| `[ctx.updateSubTypes]` | Update subtypes (text, sticker, audio, etc.) |
| `[ctx.message]` | Received message |
| `[ctx.editedMessage]` | Edited message |
| `[ctx.inlineQuery]` | Received inline query |
| `[ctx.chosenInlineResult]` | Received inline query result |
| `[ctx.callbackQuery]` | Received callback query |
| `[ctx.shippingQuery]` | Shipping query |
| `[ctx.preCheckoutQuery]` | Pre-checkout query |
| `[ctx.channelPost]` | New incoming channel post of any kind — text, photo, sticker, etc. |
| `[ctx.editedChannelPost]` | New version of a channel post that is known to the bot and was edited |
| `[ctx.poll]` | New version of a anonymous poll that is known to the bot and was changed |
| `[ctx.pollAnswer]` | This object represents an answer of a user in a non-anonymous poll. |
| `[ctx.chat]` | Current chat info |
| `[ctx.from]` | Sender info |
| `[ctx.match]` | Regex match (available only for `hears`, `command`, `action`, `inlineQuery` handlers) |
| ` ctx.webhookReply ` | Shortcut to `ctx.telegram.webhookReply` |

```js
bot.use((ctx) => {
  console.log(ctx.message)
})
```

### Extending context

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
```

### Shortcuts

Context shortcuts for **message** update:

| Shortcut | Bound to |
| --- | --- |
| `addStickerToSet`         | [`telegram.addStickerToSet`](#addstickertoset) |
| `createNewStickerSet`     | [`telegram.createNewStickerSet`](#createnewstickerset) |
| `deleteChatPhoto`         | [`telegram.deleteChatPhoto`](#deletechatphoto) |
| `deleteMessage`           | [`telegram.deleteMessage`](#deletemessage) |
| `deleteStickerFromSet`    | [`telegram.deleteStickerFromSet`](#deletestickerfromset) |
| `exportChatInviteLink`    | [`telegram.exportChatInviteLink`](#exportchatinvitelink) |
| `forwardMessage`          | [`telegram.forwardMessage`](#forwardmessage) |
| `getChat`                 | [`telegram.getChat`](#getchat) |
| `getChatAdministrators`   | [`telegram.getChatAdministrators`](#getchatadministrators) |
| `getChatMember`           | [`telegram.getChatMember`](#getchatmember) |
| `getChatMembersCount`     | [`telegram.getChatMembersCount`](#getchatmemberscount) |
| `getMyCommands`           | [`telegram.getMyCommands`](#getmycommands) |
| `getStickerSet`           | [`telegram.getStickerSet`](#getstickerset) |
| `leaveChat`               | [`telegram.leaveChat`](#leavechat) |
| `pinChatMessage`          | [`telegram.pinChatMessage`](#pinchatmessage) |
| `reply`                   | [`telegram.sendMessage`](#sendmessage) |
| `replyWithAudio`          | [`telegram.sendAudio`](#sendaudio) |
| `replyWithChatAction`     | [`telegram.sendChatAction`](#sendchataction) |
| `replyWithDice`           | [`telegram.sendDice`](#senddice) |
| `replyWithDocument`       | [`telegram.sendDocument`](#senddocument) |
| `replyWithGame`           | [`telegram.sendGame`](#sendgame) |
| `replyWithHTML`           | [`telegram.sendMessage`](#sendmessage) |
| `replyWithInvoice`        | [`telegram.sendInvoice`](#sendinvoice) |
| `replyWithLocation`       | [`telegram.sendLocation`](#sendlocation) |
| `replyWithMarkdown`       | [`telegram.sendMessage`](#sendmessage) |
| `replyWithMediaGroup`     | [`telegram.sendMediaGroup`](#sendmediagroup) |
| `replyWithPhoto`          | [`telegram.sendPhoto`](#sendphoto) |
| `replyWithPoll`           | [`telegram.sendPoll`](#sendpoll) |
| `replyWithQuiz`           | [`telegram.sendQuiz`](#sendquiz) |
| `replyWithSticker`        | [`telegram.sendSticker`](#sendsticker) |
| `replyWithVideo`          | [`telegram.sendVideo`](#sendvideo) |
| `replyWithVideoNote`      | [`telegram.sendVideoNote`](#sendvideonote) |
| `replyWithVoice`          | [`telegram.sendVoice`](#sendvoice) |
| `setChatDescription`      | [`telegram.setChatDescription`](#setchatdescription) |
| `setChatPhoto`            | [`telegram.setChatPhoto`](#setchatphoto) |
| `setChatTitle`            | [`telegram.setChatTitle`](#setchattitle) |
| `setMyCommands`           | [`telegram.setMyCommands`](#setmycommands) |
| `setPassportDataErrors`   | [`telegram.setPassportDataErrors`](#setpassportdataerrors) |
| `setStickerPositionInSet` | [`telegram.setStickerPositionInSet`](#setstickerpositioninset) |
| `setStickerSetThumb`      | [`telegram.setStickerSetThumb`](#setstickersetthumb) |
| `setStickerSetThumb`      | [`telegram.setStickerSetThumb`](#setstickersetthumb) |
| `stopPoll`                | [`telegram.stopPoll`](#stoppoll) |
| `unpinChatMessage`        | [`telegram.unpinChatMessage`](#unpinchatmessage) |
| `unpinAllChatMessages`    | [`telegram.unpinAllChatMessages`](#unpinallchatmessages) |
| `uploadStickerFile`       | [`telegram.uploadStickerFile`](#uploadstickerfile) |
| `unbanChatMember`         | [`telegram.unbanChatMember`](#unbanchatmember) |

Context shortcuts for **callback_query** update:

| Shortcut | Bound to |
| --- | --- |
| `addStickerToSet`         | [`telegram.addStickerToSet`](#addstickertoset) |
| `answerCbQuery`           | [`telegram.answerCbQuery`](#answercbquery) |
| `answerGameQuery`         | [`telegram.answerGameQuery`](#answergamequery) |
| `createNewStickerSet`     | [`telegram.createNewStickerSet`](#createnewstickerset) |
| `deleteChatPhoto`         | [`telegram.deleteChatPhoto`](#deletechatphoto) |
| `deleteMessage`           | [`telegram.deleteMessage`](#deletemessage) |
| `deleteStickerFromSet`    | [`telegram.deleteStickerFromSet`](#deletestickerfromset) |
| `editMessageCaption`      | [`telegram.editMessageCaption`](#editmessagecaption) |
| `editMessageMedia`        | [`telegram.editMessageMedia`](#editmessagemedia) |
| `editMessageReplyMarkup`  | [`telegram.editMessageReplyMarkup`](#editmessagereplymarkup) |
| `editMessageText`         | [`telegram.editMessageText`](#editmessagetext) |
| `exportChatInviteLink`    | [`telegram.exportChatInviteLink`](#exportchatinvitelink) |
| `forwardMessage`          | [`telegram.forwardMessage`](#forwardmessage) |
| `getChat`                 | [`telegram.getChat`](#getchat) |
| `getChatAdministrators`   | [`telegram.getChatAdministrators`](#getchatadministrators) |
| `getChatMember`           | [`telegram.getChatMember`](#getchatmember) |
| `getChatMembersCount`     | [`telegram.getChatMembersCount`](#getchatmemberscount) |
| `getStickerSet`           | [`telegram.getStickerSet`](#getstickerset) |
| `leaveChat`               | [`telegram.leaveChat`](#leavechat) |
| `pinChatMessage`          | [`telegram.pinChatMessage`](#pinchatmessage) |
| `reply`                   | [`telegram.sendMessage`](#sendmessage) |
| `replyWithAnimation`      | [`telegram.sendAnimation`](#sendanimation) |
| `replyWithAudio`          | [`telegram.sendAudio`](#sendaudio) |
| `replyWithChatAction`     | [`telegram.sendChatAction`](#sendchataction) |
| `replyWithDice`           | [`telegram.sendDice`](#senddice) |
| `replyWithDocument`       | [`telegram.sendDocument`](#senddocument) |
| `replyWithGame`           | [`telegram.sendGame`](#sendgame) |
| `replyWithHTML`           | [`telegram.sendMessage`](#sendmessage) |
| `replyWithInvoice`        | [`telegram.sendInvoice`](#sendinvoice) |
| `replyWithLocation`       | [`telegram.sendLocation`](#sendlocation) |
| `replyWithMarkdown`       | [`telegram.sendMessage`](#sendmessage) |
| `replyWithMediaGroup`     | [`telegram.sendMediaGroup`](#sendmediagroup) |
| `replyWithPhoto`          | [`telegram.sendPhoto`](#sendphoto) |
| `replyWithPoll`           | [`telegram.sendPoll`](#sendpoll) |
| `replyWithSticker`        | [`telegram.sendSticker`](#sendsticker) |
| `replyWithVideo`          | [`telegram.sendVideo`](#sendvideo) |
| `replyWithVideoNote`      | [`telegram.sendVideoNote`](#sendvideonote) |
| `replyWithVoice`          | [`telegram.sendVoice`](#sendvoice) |
| `setChatDescription`      | [`telegram.setChatDescription`](#setchatdescription) |
| `setChatPhoto`            | [`telegram.setChatPhoto`](#setchatphoto) |
| `setChatTitle`            | [`telegram.setChatTitle`](#setchattitle) |
| `setStickerPositionInSet` | [`telegram.setStickerPositionInSet`](#setstickerpositioninset) |
| `setStickerSetThumb`      | [`telegram.setStickerSetThumb`](#setstickersetthumb) |
| `stopPoll`                | [`telegram.stopPoll`](#stoppoll) |
| `unpinChatMessage`        | [`telegram.unpinChatMessage`](#unpinchatmessage) |
| `unpinAllChatMessages`    | [`telegram.unpinAllChatMessages`](#unpinallchatmessages) |
| `uploadStickerFile`       | [`telegram.uploadStickerFile`](#uploadstickerfile) |
| `unbanChatMember`         | [`telegram.unbanChatMember`](#unbanchatmember) |

Context shortcuts for **inline_query** update:

| Shortcut | Bound to |
| --- | --- |
| `answerInlineQuery` | [`telegram.answerInlineQuery`](#answerinlinequery) |

Context shortcuts for **shipping_query** update:

| Shortcut | Bound to |
| --- | --- |
| `answerShippingQuery` | [`telegram.answerShippingQuery`](#answershippingquery) |

Context shortcuts for **pre_checkout_query** update:

| Shortcut | Bound to |
| --- | --- |
| `answerPreCheckoutQuery` | [`telegram.answerPreCheckoutQuery`](#answerprecheckoutquery) |

#### Shortcuts usage example

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
```

## State

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
```

## Session

```js
const session = require('telegraf/session')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())
bot.on('text', (ctx) => {
  ctx.session.counter = ctx.session.counter || 0
  ctx.session.counter++
  return ctx.reply(`Message counter:${ctx.session.counter}`)
})

bot.launch()
```

**Note: For persistent sessions you can use any of [`telegraf-session-*`](https://www.npmjs.com/search?q=telegraf-session) middleware.**

**Tip: To use same session in private chat with the bot and in inline mode, use following session key resolver:**

```js
{
  getSessionKey: (ctx) => {
    if (ctx.from && ctx.chat) {
      return `${ctx.from.id}:${ctx.chat.id}`
    } else if (ctx.from && ctx.inlineQuery) {
      return `${ctx.from.id}:${ctx.from.id}`
    }
    return null
  }
}
```

## Update types

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
- `dice`
- `document`
- `photo`
- `sticker`
- `video`
- `voice`
- `contact`
- `location`
- `venue`
- `forward`
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
- `passport_data`
- `poll`

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

## Webhooks

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
const { Telegraf } = require('telegraf')
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
const { Telegraf } = require('telegraf')
const fastifyApp = require('fastify')()

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('text', ({ reply }) => reply('Hello'))
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
const { Telegraf } = require('telegraf')
const Koa = require('koa')
const koaBody = require('koa-body')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.telegram.setWebhook('https://server.tld:8443/secret-path')

const app = new Koa()
app.use(koaBody())
app.use(async (ctx, next) => {
  if (ctx.method !== 'POST' || ctx.url !== '/secret-path') {
    return next()
  }
  await bot.handleUpdate(ctx.request.body, ctx.response)
  ctx.status = 200
})
app.use(async (ctx) => {
  ctx.body = 'Hello World'
})

app.listen(3000)
```

## Working with files

Supported file sources:

- `Existing file_id`
- `File path`
- `Url`
- `Buffer`
- `ReadStream`

Also, you can provide an optional name of file as `filename`.

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

## Telegram Passport

To enable Telegram Passport support you can use [`telegram-passport`](https://www.npmjs.com/package/telegram-passport) package:

```js
const { Telegraf } = require('telegraf')
const TelegramPassport = require('telegram-passport')

const bot = new Telegraf(process.env.BOT_TOKEN)
const passport = new TelegramPassport("PRIVATE_KEY_IN_PEM_FORMAT")

bot.on('passport_data', (ctx) => {
  const decryptedPasswordData = passport.decrypt(ctx.passportData)
  console.log(decryptedPasswordData)
  return ctx.setPassportDataErrors([
    { source: 'selfie', type: 'driver_license', file_hash: 'file-hash', message: 'Selfie photo is too low quality'}
  ])
})
```

## Telegraf Modules

Telegraf Modules is higher level abstraction for writing modular Telegram bots.

Module is simple js file with exported Telegraf middleware:

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

To run modules you can use `telegraf` module runner, it allows you to start Telegraf module easily from the command line.

```bash
npm install telegraf -g
```

## Telegraf CLI usage

```bash
telegraf [opts] <bot-file>
  -t  Bot token [$BOT_TOKEN]
  -d  Webhook domain
  -H  Webhook host [0.0.0.0]
  -p  Webhook port [$PORT or 3000]
  -s  Stop on error
  -l  Enable logs
  -h  Show this help message
```

### Telegraf Module example

Create a module with name `bot.js` and following content:

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

```bash
telegraf -t "bot token" bot.js
```
