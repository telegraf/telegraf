![Telegraf](https://raw.githubusercontent.com/telegraf/telegraf/develop/docs/header.png)

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
- Incredibly fast
- [Firebase](https://firebase.google.com/products/functions/)/[Glitch](https://dashing-light.glitch.me)/[Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction)/[AWS **λ**](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html)/Whatever ready
- `http/https/fastify/Connect.js/express.js` compatible webhooks
- Easy to extend
- `TypeScript` typings

#### Installation

```bash
npm install telegraf --save
```

or using yarn

```bash
yarn add telegraf
```

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
bot.command('modern', ({ reply }) => reply('Yo'))
bot.command('hipster', Telegraf.reply('λ'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

For additional bot examples see [`examples`](https://github.com/telegraf/telegraf/tree/master/docs/examples) folder.

**Resources:**

* [Community chat](https://t.me/TelegrafJSChat)
* [Community chat (Russian)](https://t.me/telegraf_ru)

**Community bots:**

<!-- Please keep the table sorted -->
| Name | Description |
| --- | --- |
| [BibleBot](https://github.com/Kriv-Art/BibleBot) | Bot to get bible verses |
| [BibleQuizzleBot](https://github.com/Samleo8/BibleQuizzle) | Bible quiz game - group fun similar to Quizzarium |
| [BitcoinDogBot](https://github.com/jibital/bitcoin-dog-bot) | Bitcoin prices, Technical analysis and Alerts! |
| [BooksAndBot](https://github.com/dmtrbrl/BooksAndBot) | An inline bot that allows you to search for books and share them in a conversation. Powered by Goodreads  |
| [CaptchaOnlyBot](https://github.com/Piterden/captcha_only_bot) | Configurable question \w set of buttons on a new group user |
| [ChannelHashBot](https://github.com/YouTwitFace/ChannelHashBot) | Keep track of hashtags that are sent in your group by forwarding them to a channel |
| [ChatAdmin](https://github.com/Khuzha/chatAdmin) | Helps to administer the chats  |
| [ChatLinkerBot](https://github.com/jt3k/chat-linker) | The bridge between jabber and telegram |
| [ChessBot](https://github.com/Piterden/chessbot) | Inline chess game in a message |
| [CounterBot](https://github.com/leodj/telegram-counter-bot) | Keep track of multiple counters and increment, decrement, set and reset them to your hearts content  |
| [DefendTheCastle](https://github.com/TiagoDanin/Defend-The-Castle) | Telegram Bot Game - Defend The Castle |
| [DiscordTelegramBridge](https://github.com/daaniiieel/discord-telegram-bridge) | A simple, small and fast discord to telegram bridge written in node.js |
| [EveMoviesBot](https://github.com/dmbaranov/evemovies-bot) | Track movie torrent releases and get notifications when it's there |
| [GNU/LinuxIndonesiaBot](https://github.com/bgli/bglibot-js) | BGLI Bot a.k.a Miranda Salma |
| [GoogleItBot](https://github.com/Edgar-P-yan/google-it-telegram-bot) | Instant inline search |
| [GroupsAdminBot](https://github.com/Azhant/AdminBot) | Telegram groups administrator bot |
| [KitchenTimerBot](https://github.com/DZamataev/kitchen-timer-bot) | Bot for setting up multiple timers for cooking |
| [LyricsGramBot](https://github.com/lioialessandro/LyricsGramBot) | Song Lyrics |
| [MangadexBot](https://github.com/ejnshtein/mangadex_bot) | Read manga from Mangadex |
| [Memcoin](https://github.com/backmeupplz/memcoin) | Memcoin for the Memconomy |
| [MetalArchivesBot](https://github.com/amiralies/metalarchives-telegram-bot) | Unofficial metal-archives.com bot |
| [MidnaBot](https://github.com/wsknorth/midnabot) | Midnabot for telegram |
| [MineTelegram](https://github.com/hexatester/minetelegram) | Minecraft - Telegram bridge |
| [MonitorBot](https://github.com/inigochoa/monitorbot) | Private website status checker bot |
| [NodeRSSBot](https://github.com/fengkx/NodeRSSBot) | Bot to subscribe RSS feed which allows many configurations |
| [Nyaa.si Bot](https://github.com/ejnshtein/nyaasi-bot) | Nyaa.si torrents |
| [OCRToolBot](https://github.com/Piterden/tesseract-bot) | Tesseract text from image recognition |
| [OneQRBot](https://github.com/Khuzha/oneqrbot) | Scan and generate QR |
| [OrdisPrime](https://github.com/MaxTgr/Ordis-Prime) | A telegram bot helper for warframe |
| [PodSearchBot](https://fazendaaa.github.io/podsearch_bot/) | TypeScript |
| [RandomPassBot](https://github.com/Khuzha/randompassbot) | Generate a password |
| [Randy](https://github.com/backmeupplz/randymbot) | Randy Marsh raffle Telegram bot |
| [ReferalSystem](https://github.com/Khuzha/refbot) | Channels promoter |
| [ScrobblerBot](https://github.com/drvirtuozov/scrobblerBot) | An unofficial Last.fm Scrobbler |
| [Shieldy](https://github.com/backmeupplz/shieldy) | Telegram bot repository |
| [SimpleRegBot](https://github.com/Khuzha/simpleRegBot) | Simple bot for registration users to any event |
| [SpyfallGameBot](https://github.com/verget/telegram-spy-game) | Simple telegram bot for an interesting board game |
| [StickersPlayBot](https://github.com/TiagoDanin/StickersPlayBot) | Search series covers stickers via inline |
| [StoreOfBot](https://github.com/TiagoDanin/StoreOfBot) | Search, explore & discover the bests bots, channel or groups |
| [SyntaxHighlighterBot](https://github.com/piterden/syntax-highlighter-bot) | A code highlighting tool for telegram chats |
| [TelegrafRutrackerTransmission](https://github.com/DZamataev/telegraf-rutracker-transmission) | Bot for searching torrents at Rutracker and add them to your Transmission web service |
| [TelegramTelegrafBot](https://github.com/Finalgalaxy/telegram-telegraf-bot) | Telegram bot example using Telegraf with easy configuration steps |
| [Temply](https://github.com/backmeupplz/temply) |   |
| [TereGramBot](https://github.com/juandjara/TereGramBot) | Simple telegram node bot with a few funny commands |
| [TheGuardBot](https://github.com/TheDevs-Network/the-guard-bot) | Manage a network of related groups |
| [ThemerBot](https://github.com/YouTwitFace/ThemerBot) | Create themes for Telegram based on colors chosen from a picture |
| [TTgram](https://github.com/TiagoDanin/TTgram) | Receive and send Twitters used a Telegram Bot |
| [Voicy](https://github.com/backmeupplz/voicy) |   |
| [Watchy](https://github.com/backmeupplz/watchy) |   |
| [YtSearchBot](https://github.com/Finalgalaxy/yt-search-bot) | Bot to share YouTube fetched videos from any channel |
| [YTubevideoBot](https://github.com/n1ghtw0lff/YTubevideoBot) | Bot created to help you find and share any video from youtube |
| Send PR to add link to your bot |   |
<!-- Please keep the table sorted -->

## Getting started

#### Telegram token

To use the [Telegram Bot API](https://core.telegram.org/bots/api), 
you first have to [get a bot account](https://core.telegram.org/bots) 
by [chatting with BotFather](https://core.telegram.org/bots#6-botfather).

BotFather will give you a *token*, something like `123456789:AbCdfGhIJKlmNoQQRsTUVwxyZ`.

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
| `[ctx.preCheckoutQuery]` | Precheckout query |
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

##### Shortcuts usage example

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

You can react to several different types of updates (and even sub-types of them), see the example below.

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
- `poll`
- `poll_answer`

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
- `forward_date`
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

##### Express.js example integration

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

##### Fastify example integration

You can use `fastify-telegraf` package

```js
const { Telegraf } = require('telegraf')
const fastifyApp = require('fastify')()
const fastifyTelegraf = require('fastify-telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('text', ({ reply }) => reply('Hello'))

fastifyApp.register(fastifyTelegraf, { bot, path: '/secret-path' })
// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
bot.telegram.setWebhook('https://------.localtunnel.me/secret-path')

fastifyApp.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})
```

##### Koa.js example integration

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

#### Telegram Passport

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

```bash
npm install telegraf -g
```

#### Telegraf CLI usage

```plaintext
telegraf [opts] <bot-file>
  -t  Bot token [$BOT_TOKEN]
  -d  Webhook domain
  -H  Webhook host [0.0.0.0]
  -p  Webhook port [$PORT or 3000]
  -s  Stop on error
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

```bash
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
import session from 'telegraf/session'

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

#### Telegraf

Telegraf API reference

```js
const { Telegraf } = require('telegraf')
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

Handler for /start command.

`telegraf.start(...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware |

##### help

Handler for /help command.

`telegraf.help(...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware |

##### settings

Handler for /settings command.

`telegraf.settings(...middleware)`

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

##### phone

Phone number handling.

`telegraf.phone(number, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| number | `string/string[]` | Phone number |
| middleware | `function` | Middleware |

##### hashtag

Hashtag handling.

`telegraf.hashtag(hashtag, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| hashtag | `string/string[]` | Hashtag |
| middleware | `function` | Middleware |

##### cashtag

Cashtag handling.

`telegraf.cashtag(cashtag, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| cashtag | `string/string[]` | Cashtag |
| middleware | `function` | Middleware |

##### action

Registers middleware for handling `callback_data` actions with regular expressions.

`telegraf.action(triggers, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]` | Triggers |
| middleware | `function` | Middleware |


##### inlineQuery

Registers middleware for handling `inline_query` actions with regular expressions.

`telegraf.inlineQuery(triggers, ...middleware)`

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

##### launch

Launch bot in long-polling or webhook mode. 

`telegraf.launch(options) => Promise`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `object` | Launch options |

Launch options:

```js
{
  allowedUpdates,

  // Start bot in webhook mode
  // See startWebhook reference
  webhook: { domain, hookPath,  port,  host,  tlsOptions,  cb } 
}
```

##### startPolling

Start poll updates.

`telegraf.startPolling([timeout], [limit], [allowedUpdates], [stopCallback])`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [timeout] | `number` | 30 | Poll timeout in seconds |
| [limit] | `number` | 100 | Limits the number of updates to be retrieved |
| [allowedUpdates] | `string[]/string/null` | null | List the types of updates you want your bot to receive |
| [stopCallback] | `function` | null | Polling stop callback |

##### startWebhook

Start listening @ `https://host:port/webhookPath` for Telegram calls.

`telegraf.startWebhook(hookPath, [tlsOptions], port, [host])`

| Param | Type | Description |
| ---  | --- | --- |
| hookPath | `string` | Webhook url path (see Telegraf.setWebhook) |
| [tlsOptions] | `object` | [TLS server options](https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener). Pass null to use http |
| port | `number` | Port number |
| [host] | `string` | Hostname |

##### stop

Stop Webhook and polling

`telegraf.stop([callback]) => Promise`

| Param | Type |
| ---  | --- |
| [callback] | function |

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

##### Telegraf.inlineQuery

Generates middleware for handling `inlineQuery` data with regular expressions.

`Telegraf.inlineQuery(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

##### Telegraf.passThru

Generates pass thru middleware.

`Telegraf.passThru() => function`

##### Telegraf.optional

Generates optional middleware.

`Telegraf.optional(test, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| test | `truthy/function` | Value or predicate `(ctx) => bool` |
| middleware | `function` | middleware |

##### Telegraf.acl

Generates middleware for provided users only.

`Telegraf.acl(userId, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| userId | `string/string[]` | User id |
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


##### Telegraf.email

Generates middleware for handling messages with `email` entity.

`Telegraf.email(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

##### Telegraf.hashtag

Generates middleware for handling messages with `hashtag` entity.

`Telegraf.hashtag(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

##### Telegraf.cashtag

Generates middleware for handling messages with `cashtag` entity.

`Telegraf.cashtag(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

##### Telegraf.url

Generates middleware for handling messages with `url` entity.

`Telegraf.url(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

##### Telegraf.phone

Generates middleware for handling messages with `phone` entity.

`Telegraf.phone(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

##### Telegraf.textLink

Generates middleware for handling messages with `text_link` entity.

`Telegraf.textLink(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

##### Telegraf.textMention

Generates middleware for handling messages with `text_mention` entity.

`Telegraf.textMention(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

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

##### setStickerSetThumb

Use this method to set the thumbnail of a sticker set.

`telegram.setStickerSetThumb(name, userId, [thumb]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setstickersetthumb)

| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Sticker set name |
| userId | `string` | User identifier of the sticker set owner |
| thumb | `File` | A PNG image with the thumbnail, must be up to 128 kilobytes in size and have width and height exactly 100px, or a TGS animation with the thumbnail up to 32 kilobytes in size |

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

##### editMessageMedia

Use this method to edit media of messages sent by the bot or via the bot.

`telegram.editMessageMedia(chatId, messageId, inlineMessageId, media, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| media | `InputMedia` | [InputMedia](https://core.telegram.org/bots/api#inputmedia) |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagemedia)|

##### editMessageLiveLocation

Use this method to edit live location messages sent by the bot or via the bot.

`telegram.editMessageLiveLocation(chatId, messageId, inlineMessageId, latitude, longitude, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| latitude | `string` | Latitude of new location |
| longitude | `string` | Longitude of new location |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagelivelocation)|

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

##### copyMessage

Send copy of existing message.

`telegram.copyMessage(chatId, fromChatId, messageId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Target Chat id |
| fromChatId | `number/string` | Source Chat id |
| messageId | `number` | Message id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#copymessage)|

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

##### getMyCommands

Use this method to get the current list of the bot's commands. 
Requires no parameters. Returns Array of BotCommand on success.

`telegram.getMyCommands() => Promise`
[Official documentation](https://core.telegram.org/bots/api#getmycommands)

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

##### setChatPermissions

Use this method to set default chat permissions for all members.

`telegram.setChatPermissions(chatId, permissions) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| permissions | `object` | [New default chat permissions](https://core.telegram.org/bots/api#chatpermissions)|

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

##### setChatAdministratorCustomTitle

New custom title for the administrator; 0-16 characters, emoji are not allowed

`telegram.setChatAdministratorCustomTitle(chatId, userId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| userId | `number` | User id |
| title | `string` | Custom title |

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

`telegram.unpinChatMessage(chatId, [messageId]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#unpinchatmessage)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| [messageId] | `number` | Message id |

##### unpinAllChatMessages

Use this method clear the list of pinned messages in a chat.

`telegram.unpinAllChatMessages(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#unpinallchatmessages)

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

`telegram.deleteWebhook([extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#deletewebhook)|

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

##### sendDice

Sends dice.

`telegram.sendDice(chatId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#senddice)|

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

##### sendAnimation

Sends video.

`telegram.sendAnimation(chatId, animation, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| animation | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendanimation)|

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
| voice | `File/string` | File, file id or HTTP URL |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvoice)|

##### sendPoll

Sends anonymous poll.

`telegram.sendPoll(chatId, question, options, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| question | `string` | Poll question |
| options | `string[]` | Answer options |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendpoll)|

##### setMyCommands

Use this method to change the list of the bot's commands

`telegram.setMyCommands(commands) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| commands | `object[]` | [List of bot commands](https://core.telegram.org/bots/api#setmycommands) |

##### sendQuiz

Sends quiz.

`telegram.sendQuiz(chatId, question, options, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| question | `string` | Poll question |
| options | `string[]` | Answer options |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendpoll)|


##### stopPoll

Stops anonymous poll.

`telegram.stopPoll(chatId, messageId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Poll message id |
| options| `string[]` | Answer options |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#stoppoll)|

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

`telegram.setWebhook(url, [extra]) => Promise`

| Param | Type | Description |
| ---  | --- | --- |
| url  | `string` | Public url for webhook |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#setwebhook)|

##### unbanChatMember

Use this method to unban a previously kicked user in a supergroup.

`telegram.unbanChatMember(chatId, userId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| userId | `number` | User id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#unbanchatmember)|


##### setPassportDataErrors

Informs a user that some of the Telegram Passport elements they provided contains errors. 
The user will not be able to re-submit their Passport to you 
until the errors are fixed (the contents of the field for which you returned the error must change).

`telegram.setPassportDataErrors(errors) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setpassportdataerrors)

| Param | Type | Description |
| ---  | --- | --- |
| [errors] | `PassportElementError[]` | An array describing the errors |

##### logOut

Log out from the cloud Bot API server before launching the bot locally.

`telegram.logOut() => Promise`
[Official documentation](https://core.telegram.org/bots/api#logout)

##### close

Close the bot instance before moving it from one local server to another.

`telegram.close() => Promise`
[Official documentation](https://core.telegram.org/bots/api#close)

#### Extra

Telegram message options helper, [see examples](https://github.com/telegraf/telegraf/tree/develop/docs/examples/).

#### Markup

Telegram markup helper, [see examples](https://github.com/telegraf/telegraf/tree/develop/docs/examples/).

#### Stage

Simple scene-based control flow middleware.

```js
const { Telegraf } = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { leave } = Stage

// Greeter scene
const greeter = new Scene('greeter')
greeter.enter((ctx) => ctx.reply('Hi'))
greeter.leave((ctx) => ctx.reply('Bye'))
greeter.hears(/hi/gi, leave())
greeter.on('message', (ctx) => ctx.reply('Send `hi`'))

// Create scene manager
const stage = new Stage()
stage.command('cancel', leave())

// Scene registration
stage.register(greeter)

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())
bot.use(stage.middleware())
bot.command('greeter', (ctx) => ctx.scene.enter('greeter'))
bot.startPolling()
```

Scenes related context props and functions:

```js
bot.on('message', (ctx) => {
  ctx.scene.state                                    // Current scene state (persistent)
  ctx.scene.enter(sceneId, [defaultState, silent])   // Enter scene
  ctx.scene.reenter()                                // Reenter current scene
  ctx.scene.leave()                                  // Leave scene
})
```
