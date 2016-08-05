# Telegraf reference

- [Telegraf](#telegraf-api)
- [Context](#context)
- [Telegram](#telegram-api)
- [Uploading files](#file)
- [Webhooks](#webhooks)

## Telegraf API

```js
const Telegraf = require('telegraf')
```

- [`new Telegraf(token, [options])`](#new-telegraf)
 - [`.use(middleware)`](#use)
 - [`.on(updateTypes, middleware, [middleware...])`](#on)
 - [`.hears(triggers, middleware, [middleware...])`](#hears)
 - [`.command(commands, middleware, [middleware...])`](#command)
 - [`.action(triggers, middleware, [middleware...])`](#action)
 - [`.startPolling(timeout, limit)`](#startPolling)
 - [`.startWebHook(webHookPath, tlsOptions, port, [host])`](#startwebhook)
 - [`.stop()`](#stop)
 - [`.webHookCallback(webHookPath)`](#webhookcallback)
 - [`.handleUpdate(rawUpdate, response)`](#handleupdate)

- [`Telegraf.Telegram`](#telegram-api)
- [`Telegraf.Router`](#router)
- [`Telegraf.Extra`](#extra)
- [`Telegraf.Markup`](#markup)
- [`Telegraf.Composer`](#composer)
- [`Telegraf.compose(middlewares)`](#compose)
- [`Telegraf.mount(updateTypes, middleware)`](#mount)
- [`Telegraf.hears(triggers, middleware)`](#hears-generator)
- [`Telegraf.action(triggers, middleware)`](#action-generator)
- [`Telegraf.passThru()`](#passthru-generator)
- [`Telegraf.optional(test, middleware)`](#optional-generator)
- [`Telegraf.branch(test, trueMiddleware, falseMiddleware)`](#branch-generator)

* * *

<a name="new-telegraf"></a>
#### `new Telegraf(token, options)`

Initialize new Telegraf app.

| Param | Type | Description |
| --- | --- | --- |
| token | `string` | [Bot Token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) |
| options | `object` | Options

* * *

<a name="use"></a>
#### `telegraf.use(middleware)`

Registers a middleware.

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware function |

* * *

<a name="on"></a>
#### `telegraf.on(updateTypes, middleware, [middleware...])`

Registers middleware for provided [update type](#update-types).

| Param | Type | Description |
| --- | --- | --- |
| updateTypes | `string`\|`string[]` | [update type](#update-types) |
| middleware | `function` | Middleware |

* * *

<a name="hears"></a>
#### `telegraf.hears(triggers, middleware, [middleware...])`

Registers middleware for handling `text` messages with regular expressions.

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string[]`\|`RegEx[]` | Triggers |
| middleware | `function` | Middleware |

* * *

<a name="command"></a>
#### `telegraf.command(commands, middleware, [middleware...])`

Shortcut for [`hears`](#hears)

* * *

<a name="action"></a>
#### `telegraf.action(triggers, middleware, [middleware...])`

Registers middleware for handling `callback_data` actions with regular expressions.

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string[]`\|`RegEx[]` | Triggers |
| middleware | `function` | Middleware |

* * *

<a name="startPolling"></a>
#### `telegraf.startPolling(timeout, limit)`

Start poll updates.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| timeout | `number` | 0 | Poll timeout |
| limit | `number` | 100 | Limits the number of updates to be retrieved |

* * *

<a name="startwebhook"></a>
#### `telegraf.startWebHook(webHookPath, tlsOptions, port, [host])`

Start listening @ `https://host:port/webHookPath` for Telegram calls.

| Param | Type | Description |
| ---  | --- | --- |
| webHookPath | `string` | Webhook url path (see Telegraf.setWebHook) |
| tlsOptions | `object` | (Optional) [TLS server options](https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener). Pass null to use http |
| port | `number` | Port number |
| [host] | `string` | (Optional) Hostname |

* * *

<a name="stop"></a>
#### `telegraf.stop()`

Stop WebHook and polling

* * *

<a name="webhookcallback"></a>
#### `telegraf.webHookCallback(webHookPath) => Function`

Return a callback function suitable for the http[s].createServer() method to handle a request. 
You may also use this callback function to mount your telegraf app in a Koa/Connect/Express app.

| Param | Type | Description |
| ---  | --- | --- |
| webHookPath | `string` | Webhook url path (see Telegraf.setWebHook) |

* * *

<a name="handleupdate"></a>
#### `telegraf.handleUpdate(rawUpdate, [webHookResponse])`

Handle raw Telegram update. 
In case you use centralized webhook server, queue, etc.  

| Param | Type | Description |
| --- | --- | --- |
| rawUpdate | `object` | Telegram update payload |
| [webHookResponse] | `object` | (Optional) [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) |

* * *

<a name="router"></a>
#### `Telegraf.Router`

Base router, [see example](../examples/custom-router-bot.js).
[Example usage](https://github.com/telegraf/telegraf-recast/blob/master/lib/telegraf-recast.js)

* * *

<a name="extra"></a>
#### `Telegraf.Extra`

Telegram message options helper, [see examples](../examples/).

* * *

<a name="markup"></a>
#### `Telegraf.Markup`

Telegram markup helper, [see examples](../examples/).

* * *

<a name="composer"></a>
#### `Telegraf.Composer`

Base composer.

[Example usage](https://github.com/telegraf/telegraf-flow/blob/master/lib/flows/default.js)

* * *

<a name="compose"></a>
#### `Telegraf.compose(middlewares) => function`

Compose `middlewares` returning a fully valid middleware comprised of all those which are passed.

| Param | Type | Description |
| --- | --- | --- |
| middlewares | `function[]` | Array of middlewares |

* * *

<a name="mount"></a>
#### `Telegraf.mount(updateTypes, middleware) => function`

Generates middleware for handling provided [update types](#update-types).

| Param | Type | Description |
| --- | --- | --- |
| updateTypes | `string`\|`string[]` | [update type](#update-types) |
| middleware | `function` | middleware |

* * *

<a name="hears-generator"></a>
#### `Telegraf.hears(triggers, middleware) => function`

Generates middleware for handling `text` messages with regular expressions.

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string[]`\|`RegEx[]`\|`Function[]` | Triggers |
| handler | `function` | Handler |

* * *

<a name="action-generator"></a>
#### `Telegraf.action(triggers, middleware) => function`

Generates middleware for handling `callbackQuery` data with regular expressions.

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string[]`\|`RegEx[]`\|`Function[]` | Triggers |
| handler | `function` | Handler |

* * *

<a name="passthru-generator"></a>
#### `Telegraf.passThru() => function`

Generates pass thru middleware.

* * *

<a name="optional-generator"></a>
#### `Telegraf.optional(test, middleware) => function`

Generates optional middleware.

| Param | Type | Description |
| --- | --- | --- |
| test | `truthy`\|`function` | Value or predicate `(ctx) => bool` |
| middleware | `function` | middleware |

* * *

<a name="branch-generator"></a>
#### `Telegraf.branch(test, trueMiddleware, falseMiddleware) => function`

Generates branch middleware.

| Param | Type | Description |
| --- | --- | --- |
| test | `truthy`\|`function` | Value or predicate `(ctx) => bool` |
| trueMiddleware | `function` | true action  middleware |
| falseMiddleware | `function` | false action middleware |

## Context

A Telegraf Context encapsulates telegram message.
Context is created per request and contains following props:

```js
app.use((ctx) => {
  ctx.telegram             // Telegram instance
  ctx.updateType           // Update type(message, inline_query, etc.)
  [ctx.updateSubType]      // Update subtype(text, sticker, audio, etc.)
  [ctx.message]            // Received message
  [ctx.editedMessage]      // Edited message
  [ctx.inlineQuery]        // Received inline query
  [ctx.chosenInlineResult] // Received inline query result
  [ctx.callbackQuery]      // Received callback query
  [ctx.chat]               // Current chat info
  [ctx.from]               // Sender info
  [ctx.match]              // Regex match (available only for `hears`, `command`, `action` handlers)
})
```

### How to extend context

The recommended way to extend application context:

```js
const app = new Telegraf(process.env.BOT_TOKEN)

app.context.db = {
  getScores: () => { return 42 }
}

app.on('text', (ctx) => {
  const scores = ctx.db.getScores(ctx.message.from.username)
  return ctx.reply(`${ctx.message.from.username}: ${score}`)
})
```

Context shortcuts for **message** update:

- `ctx.getChat() -> `[`ctx.telegram.getChat()`](#getchat)
- `ctx.getChatAdministrators() -> `[`ctx.telegram.getChatAdministrators()`](#getchatadministrators)
- `ctx.getChatMember() -> `[`ctx.telegram.getChatMember()`](#getchatmember)
- `ctx.getChatMembersCount() -> `[`ctx.telegram.getChatMembersCount()`](#getchatmemberscount)
- `ctx.leaveChat() -> `[`ctx.telegram.leaveChat()`](#leavechat)
- `ctx.reply() -> `[`ctx.telegram.sendMessage()`](#sendmessage)
- `ctx.replyWithMarkdown() -> `[`ctx.telegram.sendMessage()`](#sendmessage)
- `ctx.replyWithHTML() -> `[`ctx.telegram.sendMessage()`](#sendmessage)
- `ctx.replyWithAudio() -> `[`ctx.telegram.sendAudio()`](#sendaudio)
- `ctx.replyWithChatAction() -> `[`ctx.telegram.sendChatAction()`](#sendchataction)
- `ctx.replyWithDocument() -> `[`ctx.telegram.sendDocument()`](#senddocument)
- `ctx.replyWithLocation() -> `[`ctx.telegram.sendLocation()`](#sendlocation)
- `ctx.replyWithPhoto() -> `[`ctx.telegram.sendPhoto()`](#sendphoto)
- `ctx.replyWithSticker() -> `[`ctx.telegram.sendSticker()`](#sendsticker)
- `ctx.replyWithVideo() -> `[`ctx.telegram.sendVideo()`](#sendvideo)
- `ctx.replyWithVoice() -> `[`ctx.telegram.sendVoice()`](#sendvoice)

Context shortcuts for **callback_query** update:

- `ctx.answerCallbackQuery() -> `[`ctx.telegram.answerCallbackQuery()`](#answercallbackquery)
- `ctx.editMessageText() -> `[`ctx.telegram.editMessageText()`](#editmessagetext)
- `ctx.editMessageCaption() -> `[`ctx.telegram.editMessageCaption()`](#editmessagecaption)
- `ctx.editMessageReplyMarkup() -> `[`ctx.telegram.editMessageReplyMarkup()`](#editmessagereplymarkup)
- `ctx.getChat() -> `[`ctx.telegram.getChat()`](#getchat)
- `ctx.getChatAdministrators() -> `[`ctx.telegram.getChatAdministrators()`](#getchatadministrators)
- `ctx.getChatMember() -> `[`ctx.telegram.getChatMember()`](#getchatmember)
- `ctx.getChatMembersCount() -> `[`ctx.telegram.getChatMembersCount()`](#getchatmemberscount)
- `ctx.leaveChat() -> `[`ctx.telegram.leaveChat()`](#leavechat)
- `ctx.reply() -> `[`ctx.telegram.sendMessage()`](#sendmessage)
- `ctx.replyWithMarkdown() -> `[`ctx.telegram.sendMessage()`](#sendmessage)
- `ctx.replyWithHTML() -> `[`ctx.telegram.sendMessage()`](#sendmessage)
- `ctx.replyWithAudio() -> `[`ctx.telegram.sendAudio()`](#sendaudio)
- `ctx.replyWithChatAction() -> `[`ctx.telegram.sendChatAction()`](#sendchataction)
- `ctx.replyWithDocument() -> `[`ctx.telegram.sendDocument()`](#senddocument)
- `ctx.replyWithLocation() -> `[`ctx.telegram.sendLocation()`](#sendlocation)
- `ctx.replyWithPhoto() -> `[`ctx.telegram.sendPhoto()`](#sendphoto)
- `ctx.replyWithSticker() -> `[`ctx.telegram.sendSticker()`](#sendsticker)
- `ctx.replyWithVideo() -> `[`ctx.telegram.sendVideo()`](#sendvideo)
- `ctx.replyWithVoice() -> `[`ctx.telegram.sendVoice()`](#sendvoice)

Context shortcuts for **inline_query** update:

- `ctx.answerInlineQuery() -> `[`ctx.telegram.answerInlineQuery()`](#answerinlinequery)

### Example shortcuts using

```js
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('text', (ctx) => {
  // Simple usage 
  ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`)
  
  // Using shortcut
  ctx.reply(`Hello ${ctx.state.role}`)
})

bot.on('/quit', (ctx) => {
  // Simple usage 
  ctx.telegram.leaveChat(ctx.message.chat.id)
  
  // Using shortcut
  ctx.leaveChat()
})

bot.on('callback_query', (ctx) => {
  // Simple usage 
  ctx.telegram.answerCallbackQuery(ctx.callbackQuery.id)
  
  // Using shortcut
  ctx.answerCallbackQuery()
})

bot.on('inline_query', (ctx) => {
  const result = []
  // Simple usage 
  ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)
  
  // Using shortcut
  ctx.answerInlineQuery(result)
})
```

## Telegram API

```js
const { Telegram } = require('telegraf')
```

- [`new Telegram(token)`](#new-telegram)
  - [`.answerCallbackQuery(callbackQueryId, text, showAlert)`](#answercallbackquery)
  - [`.answerInlineQuery(inlineQueryId, results, extra)`](#answerinlinequery)
  - [`.editMessageCaption(chatId, messageId, inlineMessageId, caption, extra)`](#editmessagecaption)
  - [`.editMessageReplyMarkup(chatId, messageId, inlineMessageId, markup, extra)`](#editmessagereplymarkup)
  - [`.editMessageText(chatId, messageId, inlineMessageId, text, extra)`](#editmessagetext)
  - [`.forwardMessage(chatId, fromChatId, messageId, extra)`](#forwardmessage)
  - [`.sendCopy(chatId, message, extra)`](#sendcopy)
  - [`.getChat(chatId)`](#getchat)
  - [`.getChatAdministrators(chatId)`](#getchatadministrators)
  - [`.getChatMember(chatId, userId)`](#getchatmember)
  - [`.getChatMembersCount(chatId)`](#getchatmemberscount)
  - [`.getFile(fileId)`](#getfile)
  - [`.getFileLink(fileId)`](#getFileLink)
  - [`.getMe()`](#getme)
  - [`.getUserProfilePhotos(userId, offset, limit)`](#getuserprofilephotos)
  - [`.kickChatMember(chatId, userId)`](#kickchatmember)
  - [`.leaveChat(chatId)`](#leavechat)
  - [`.removeWebHook()`](#removewebhook)
  - [`.sendAudio(chatId, audio, extra)`](#sendaudio)
  - [`.sendChatAction(chatId, action)`](#sendchataction)
  - [`.sendContact(chatId, phoneNumber, firstName, extra)`](#sendcontact)
  - [`.sendDocument(chatId, doc, extra)`](#senddocument)
  - [`.sendLocation(chatId, latitude, longitude, extra)`](#sendlocation)
  - [`.sendMessage(chatId, text, extra)`](#sendmessage)
  - [`.sendPhoto(chatId, photo, extra)`](#sendphoto)
  - [`.sendSticker(chatId, sticker, extra)`](#sendsticker)
  - [`.sendVenue(chatId, latitude, longitude, title, address, extra)`](#sendvenue)
  - [`.sendVideo(chatId, video, extra)`](#sendvideo)
  - [`.sendVoice(chatId, voice, extra)`](#sendvoice)
  - [`.setWebHook(url, cert)`](#setwebhook)
  - [`.unbanChatMember(chatId, userId)`](#unbanchatmember)

* * *

<a name="new-telegram"></a>
#### `new Telegram(token, options)`

Initialize new Telegraf app.

| Param | Type | Description |
| --- | --- | --- |
| token | `string` | [Bot Token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) |
| options | `object` | Options |

 
* * *

<a name="answercallbackquery"></a>
#### `telegram.answerCallbackQuery(callbackQueryId, text, showAlert) => Promise`

Use this method to send answers to callback queries.

| Param | Type | Description |
| --- | --- | --- |
| callbackQueryId | `string` | Query id |
| [text] | `string` | Notification text |
| [showAlert] | `bool` | Show alert instead of notification |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#answercallbackquery)</sub>

* * *

<a name="answerinlinequery"></a>
#### `telegram.answerInlineQuery(inlineQueryId, results, extra) => Promise`

Use this method to send answers to an inline query.

| Param | Type | Description |
| --- | --- | --- |
| inlineQueryId | `string` | Query id |
| results | `object[]` | Results |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#answerinlinequery)|

* * *

<a name="editmessagecaption"></a>
#### `telegram.editMessageCaption(chatId, messageId, inlineMessageId, caption, extra) => Promise`

Use this method to edit captions of messages sent by the bot or via the bot

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| caption | `string` | Caption |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagecaption)|

* * *

<a name="editmessagereplymarkup"></a>
#### `telegram.editMessageReplyMarkup(chatId, messageId, inlineMessageId, markup, extra) => Promise`

Use this method to edit only the reply markup of messages sent by the bot or via the bot.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| markup | `object` | Keyboard markup |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagereplymarkup)|

* * *

<a name="editmessagetext"></a>
#### `telegram.editMessageText(chatId, messageId, inlineMessageId, text, extra) => Promise`

Use this method to edit text messages sent by the bot or via the bot.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| text | `string` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagetext)|

* * *

<a name="forwardmessage"></a>
#### `telegram.forwardMessage(chatId, fromChatId, messageId, extra) => Promise`

Forwards message.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Target Chat id |
| fromChatId | `number`\|`string` | Source Chat id |
| messageId | `number` | Message id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#forwardmessage)|


* * *

<a name="sendcopy"></a>
#### `telegram.sendCopy(chatId, message, extra) => Promise`

Sends message copy.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Target Chat id |
| message | `object` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendmessage)|

* * *

<a name="getchat"></a>
#### `telegram.getChat(chatId) => Promise`

Use this method to get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.).

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getchat)</sub>

* * *

<a name="getchatadministrators"></a>
#### `telegram.getChatAdministrators(chatId) => Promise`

Use this method to get a list of administrators in a chat. On success, returns an Array of ChatMember objects that contains information about all chat administrators except other bots. If the chat is a group or a supergroup and no administrators were appointed, only the creator will be returned.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getchatadministrators)</sub>

* * *

<a name="getchatmember"></a>
#### `telegram.getChatMember(chatId) => Promise`

Use this method to get information about a member of a chat.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getchatmember)</sub>


<a name="getchatmemberscount"></a>
#### `telegram.getChatMembersCount(chatId) => Promise`

Use this method to get the number of members in a chat.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getchatmemberscount)</sub>

* * *

<a name="getfile"></a>
#### `telegram.getFile(fileId) => Promise`

Returns basic info about a file and prepare it for downloading.

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string` | File id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getfile)</sub>

* * *

<a name="getFileLink"></a>
#### `telegram.getFileLink(fileId) => Promise`

Returns link to file.

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string` | File id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getFileLink)</sub>

* * *

<a name="getme"></a>
#### `telegram.getMe() => Promise`

Returns basic information about the bot.

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getme)</sub>

* * *

<a name="getuserprofilephotos"></a>
#### `telegram.getUserProfilePhotos(userId, offset, limit) => Promise`

Returns profiles photos for provided user.

| Param | Type | Description |
| --- | --- | --- |
| userId | `number` | Chat id |
| offset | `number` | Offset |
| limit | `number` | Limit |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getuserprofilephotos)</sub>

* * *

<a name="kickchatmember"></a>
#### `telegram.kickChatMember(chatId, userId) => Promise`

Use this method to kick a user from a group or a supergroup.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| userId | `number` | User id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#kickchatmember)</sub>


* * *

<a name="leavechat"></a>
#### `telegram.leaveChat(chatId) => Promise`

Use this method for your bot to leave a group, supergroup or channel.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#leavechat)</sub>

* * *

<a name="removewebhook"></a>
#### `telegram.removeWebHook() => Promise`

Removes webhook. Shortcut for `Telegram.setWebHook('')`

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#removewebhook)</sub>

* * *

<a name="sendaudio"></a>
#### `telegram.sendAudio(chatId, audio, extra) => Promise`

Sends audio.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| audio | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendaudio)|

* * *

<a name="sendchataction"></a>
#### `telegram.sendChatAction(chatId, action) => Promise`

Sends chat action.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| action | `string` | [Chat action](https://core.telegram.org/bots/api#sendchataction) |

* * *

<a name="sendcontact"></a>
#### `telegram.sendContact(chatId, phoneNumber, firstName, extra) => Promise`

Sends document.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| phoneNumber | `string` | Contact phone number |
| firstName | `string` | Contact first name |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendcontact)|

* * *

<a name="senddocument"></a>
#### `telegram.sendDocument(chatId, doc, extra) => Promise`

Sends document.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| doc | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#senddocument)|

* * *

<a name="sendlocation"></a>
#### `telegram.sendLocation(chatId, latitude, longitude, extra) => Promise`

Sends location.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| latitude | `number` | Latitude |
| longitude | `number` | Longitude |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendlocation)|

* * *

<a name="sendmessage"></a>
#### `telegram.sendMessage(chatId, text, extra) => Promise`

Sends text message.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| text | `string` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendmessage)|

* * *

<a name="sendphoto"></a>
#### `telegram.sendPhoto(chatId, photo, extra) => Promise`

Sends photo.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| photo | [`File`](#file) | Photo |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendphoto)|

* * *

<a name="sendsticker"></a>
#### `telegram.sendSticker(chatId, sticker, extra) => Promise`

Sends sticker.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| sticker | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendsticker)|

* * *

<a name="sendvenue"></a>
#### `telegram.sendVenue(chatId, latitude, longitude, title, address, extra) => Promise`

Sends venue information.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| latitude | `number` | Latitude |
| longitude | `number` | Longitude |
| title | `string` | Venue title |
| address | `string` | Venue address |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvenue)|

* * *

<a name="sendvideo"></a>
#### `telegram.sendVideo(chatId, video, extra) => Promise`

Sends video.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| video | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvideo)|

* * *

<a name="sendvoice"></a>
#### `telegram.sendVoice(chatId, voice, extra) => Promise`

Sends voice.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| voice | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvoice)|

* * *

<a name="setwebhook"></a>
#### `telegram.setWebHook(url, [cert]) => Promise`

Specifies an url to receive incoming updates via an outgoing webhook.

| Param | Type | Description |
| ---  | --- | --- |
| url  | `string` | Public url for webhook |
| [cert] | [`File`](#file) | SSL public certificate |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#setwebhook)</sub>

* * *

<a name="unbanchatmember"></a>
#### `telegram.unbanChatMember(chatId, userId) => Promise`

Use this method to unban a previously kicked user in a supergroup.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| userId | `number` | User id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#unbanchatmember)</sub>

* * *

### Update types

Supported update types:

- `message`
- `edited_message`
- `callback_query`
- `inline_query`
- `chosen_inline_result`

Available update sub-types:
`text`, `audio`, `document`, `photo`, `sticker`, `video`, `voice`, `contact`, `location`, `venue`, `new_chat_member`, `left_chat_member`, `new_chat_title`, `new_chat_photo`, `delete_chat_photo`, `group_chat_created`, `supergroup_chat_created`, `channel_chat_created`, `migrate_to_chat_id`, `migrate_from_chat_id`, `pinned_message`.

```js

// Handle message update
telegraf.on('message', (ctx) =>  {
  return ctx.reply('Hey there!')
})

// Handle sticker update
telegraf.on(['sticker', 'photo'], (ctx) =>  {
  console.log(ctx.message)
  return ctx.reply('Cool!')
})

```
<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#message)</sub>

## File

This object represents the contents of a file to be uploaded.

Supported file sources:

- `Existing file_id`
- `File path`
- `Url`
- `Buffer`
- `ReadStream`

Also you can provide optional name of file as `filename`. 

*FYI: Telegram servers detect content type using file extension (May 2016).*

Example:
```js

  // resend existing file by file_id
  telegram.sendSticker('chatId', '123123jkbhj6b')

  // send file
  telegram.sendVideo('chatId', {
    source: '/path/to/video.mp4'
  })

   // send stream
  telegram.sendVideo('chatId', {
    source: fs.createReadStream('/path/to/video.mp4')
  })
  
  // send buffer
  telegram.sendVoice('chatId', {
    source: new Buffer()
  })

  // send url
  telegram.sendPhoto('chatId', {
    url: 'http://lorempixel.com/400/200/cats/',
    filename: 'kitten.jpg'
  })
```

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#file)</sub>

### Webhooks

```js

const app = new Telegraf(process.env.BOT_TOKEN)

// TLS options
const tlsOptions = {
  key:  fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem'),
  ca: [ 
    // This is necessary only if the client uses the self-signed certificate.
    fs.readFileSync('client-cert.pem') 
  ]
}

// Set telegram webhook
app.telegram.setWebHook('https://server.tld:8443/secret-path', {
  content: 'server-cert.pem'
})

// Start https webhook
app.startWebHook('/secret-path', tlsOptions, 8443)


// Http webhook, for nginx/heroku users.
app.startWebHook('/secret-path', null, 5000)


// Use webHookCallback() if you want to attach telegraf to existing http server
require('http')
  .createServer(app.webHookCallback('/secret-path'))
  .listen(3000)

require('https')
  .createServer(tlsOptions, app.webHookCallback('/secret-path'))
  .listen(8443)

// Connect/Express.js integration
const express = require('express')
const expressApp = express()

expressApp.use(app.webHookCallback('/secret-path'))

expressApp.get('/', (req, res) => {
  res.send('Hello World!')
})

expressApp.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})

```
