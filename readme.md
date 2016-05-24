[![npm](https://img.shields.io/npm/l/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![NPM Version](https://img.shields.io/npm/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![node](https://img.shields.io/node/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![David](https://img.shields.io/david/telegraf/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)
[![Build Status](https://img.shields.io/travis/telegraf/telegraf.svg?branch=master&style=flat-square)](https://travis-ci.org/telegraf/telegraf)

📢 Modern Telegram bot framework for node.js.

## Features

- Full [Telegram Bot API 2.1](https://core.telegram.org/bots/api) support
- [Inline mode](https://core.telegram.org/bots/api#inline-mode)
- [Middlewares](https://www.npmjs.com/search?q=telegraf-)
- http/https/Connect/express.js webhooks
- Reply via webhook

## Installation

```js
$ npm install telegraf
```

## Example
  
```js
var Telegraf = require('telegraf');
var telegraf = new Telegraf(process.env.BOT_TOKEN);

// Message handling
telegraf.on('message', function * () {
  this.reply('*42*', { parse_mode: 'Markdown' })
})

telegraf.startPolling()
```

### One more example

```js
var Telegraf = require('telegraf');
var telegraf = new Telegraf(process.env.BOT_TOKEN);

// Look ma, middleware!
var sayYoMiddleware = function * (next) {
  yield this.reply('yo')
  yield next
}

// Command handling
telegraf.hears('/command', sayYoMiddleware, function * () {
  this.reply('Sure')
})

// Wow! RegEx
telegraf.hears(/reverse (.+)/, sayYoMiddleware, function * () {
  this.reply(this.match[1].split('').reverse().join(''))
})

telegraf.startPolling()
```

There are some other [examples](https://github.com/telegraf/telegraf/tree/master/examples).

## API

### Application

A Telegraf application is an object containing an array of middleware generator functions
which are composed and executed in a stack-like manner upon request. Telegraf is similar to many
other middleware systems that you may have encountered such as Koa, Ruby's Rack, Connect, and so on -
however a key design decision was made to provide high level "sugar" at the otherwise low-level
middleware layer. This improves interoperability, robustness, and makes writing middleware much
more enjoyable. 

```js
var telegraf = new Telegraf(process.env.BOT_TOKEN)

telegraf.on('text', function * (){
  this.reply('Hello World')
})

telegraf.startPolling()
```

### Cascading

Telegraf middleware cascade in a more traditional way as you may be used to with similar tools -
this was previously difficult to make user friendly with node's use of callbacks.
However with generators we can achieve "true" middleware. Contrasting Connect's implementation which
simply passes control through series of functions until one returns, Telegraf yields "downstream", then
control flows back "upstream".

The following example bot will reply with "Hello World", however first the message flows through
the `logger` middleware to mark when the message has been received. When a middleware invokes `yield next`
the function suspends and passes control to the next middleware defined. After there are no more
middleware to execute downstream, the stack will unwind and each middleware is resumed to perform
its upstream behaviour.

```js
var telegraf = new Telegraf(process.env.BOT_TOKEN)

// Logger middleware
telegraf.use(function * (next){
  var start = new Date
  this.state.started = start
  yield next
  var ms = new Date - start
  debug('response time %sms', ms)
})

telegraf.on('text', function * (){
  this.reply('Hello World')
})
```

### Context

A Telegraf Context encapsulates telegram message.
Context is created per request, and is referenced in middleware as the receiver, or the this identifier, as shown in the following snippet:

```js
telegraf.use(function * () {
  this.telegraf             // Telegraf instance
  this.updateType           // Update type(message, inline_query, etc.)
  [this.updateSubType]      // Update subtype(text, sticker, audio, etc.)
  [this.message]            // Received message
  [this.editedMessage]      // Edited message
  [this.inlineQuery]        // Received inline query
  [this.chosenInlineResult] // Received inline query result
  [this.callbackQuery]      // Received callback query
  [this.chat]               // Current chat info
  [this.from]               // Sender info
  [this.match]              // Regex match (available only for `hears` handler)
})
```

The recommended way to extend application context.

```js
var telegraf = new Telegraf(process.env.BOT_TOKEN)

telegraf.context.db = {
  getScores: function () { return 42 }
}

telegraf.on('text', function * (){
  var scores = this.db.getScores(this.message.from.username)
  this.reply(`${this.message.from.username}: ${score}`)
})
```

### Update types

Supported update types:

- `message`
- `edited_message`
- `inline_query`
- `chosen_inline_result`
- `callback_query`

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
- `new_chat_member`
- `left_chat_member`
- `new_chat_title`
- `new_chat_photo`
- `delete_chat_photo`
- `group_chat_created`
- `supergroup_chat_created`
- `channel_chat_created`
- `migrate_to_chat_id`
- `migrate_from_chat_id`
- `pinned_message`

```js

// Handle message update
telegraf.on('message', function * () {
  this.reply('Hey there!')
})

// Handle sticker update
telegraf.on(['sticker', 'photo'], function * () {
  console.log(this.message)
  this.reply('Cool!')
})

```
<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#message)</sub>

### State

The recommended namespace to share information between middlewares.

```js
var telegraf = new Telegraf(process.env.BOT_TOKEN)

telegraf.use(function * (next) {
  this.state.role = getUserRole(this.message) 
  yield next
})

telegraf.on('text', function * (){
  this.reply(`Hello ${this.state.role}`)
})
```

### Session

```js
var telegraf = new Telegraf(process.env.BOT_TOKEN)

// Session state will be lost on app restart
telegraf.use(Telegraf.memorySession())

telegraf.on('text', function * (){
  this.session.counter = this.session.counter || 0
  this.session.counter++
  this.reply(`Message counter:${this.session.counter}`)
})
```

**Important: For production environment use any of [`telegraf-session-*`](https://www.npmjs.com/search?q=telegraf-session) middleware.**


### Telegram WebHook

```js

var telegraf = new Telegraf(process.env.BOT_TOKEN)

// TLS options
var tlsOptions = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem'),
  // This is necessary only if the client 
  // uses the self-signed certificate.
  ca: [ fs.readFileSync('client-cert.pem') ]
}

// Set telegram webhook
telegraf.setWebHook('https://server.tld:8443/secret-path', {
  content: 'server-cert.pem'
})

// Start https webhook
telegraf.startWebHook('/secret-path', tlsOptions, 8443)


// Http webhook, for nginx/heroku users.
telegraf.startWebHook('/secret-path', null, 5000)


// Use webHookCallback() if you want attach telegraf to existing http server
require('http')
  .createServer(telegraf.webHookCallback('/secret-path'))
  .listen(3000)

require('https')
  .createServer(tlsOptions, telegraf.webHookCallback('/secret-path'))
  .listen(8443)

// Connect/Express.js integration
var express = require('express')
var app = express()

app.use(telegraf.webHookCallback('/secret-path'))

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

```

### Error Handling

By default Telegraf will print all errors to stderr and rethrow error. 
To perform custom error-handling logic you can set `onError` handler:

```js
telegraf.onError = function(err){
  log.error('server error', err)
  throw err
}
```

### Shortcuts

Telegraf context shortcuts:

Available shortcuts:

**message** update:

- `getChat() -> `[`telegraf.getChat()`](#getchat)
- `getChatAdministrators() -> `[`telegraf.getChatAdministrators()`](#getchatadministrators)
- `getChatMember() -> `[`telegraf.getChatMember()`](#getchatmember)
- `getChatMembersCount() -> `[`telegraf.getChatMembersCount()`](#getchatmemberscount)
- `leaveChat() -> `[`telegraf.leaveChat()`](#leavechat)
- `reply() -> `[`telegraf.sendMessage()`](#sendmessage)
- `replyWithAudio() -> `[`telegraf.sendAudio()`](#sendaudio)
- `replyWithChatAction() -> `[`telegraf.sendChatAction()`](#sendchataction)
- `replyWithDocument() -> `[`telegraf.sendDocument()`](#senddocument)
- `replyWithLocation() -> `[`telegraf.sendLocation()`](#sendlocation)
- `replyWithPhoto() -> `[`telegraf.sendPhoto()`](#sendphoto)
- `replyWithSticker() -> `[`telegraf.sendSticker()`](#sendsticker)
- `replyWithVideo() -> `[`telegraf.sendVideo()`](#sendvideo)
- `replyWithVoice() -> `[`telegraf.sendVoice()`](#sendvoice)

**callback_query** update:

- `answerCallbackQuery() -> `[`telegraf.answerCallbackQuery()`](#answercallbackquery)
- `getChat() -> `[`telegraf.getChat()`](#getchat)
- `getChatAdministrators() -> `[`telegraf.getChatAdministrators()`](#getchatadministrators)
- `getChatMember() -> `[`telegraf.getChatMember()`](#getchatmember)
- `getChatMembersCount() -> `[`telegraf.getChatMembersCount()`](#getchatmemberscount)
- `leaveChat() -> `[`telegraf.leaveChat()`](#leavechat)
- `reply() -> `[`telegraf.sendMessage()`](#sendmessage)
- `replyWithAudio() -> `[`telegraf.sendAudio()`](#sendaudio)
- `replyWithChatAction() -> `[`telegraf.sendChatAction()`](#sendchataction)
- `replyWithDocument() -> `[`telegraf.sendDocument()`](#senddocument)
- `replyWithLocation() -> `[`telegraf.sendLocation()`](#sendlocation)
- `replyWithPhoto() -> `[`telegraf.sendPhoto()`](#sendphoto)
- `replyWithSticker() -> `[`telegraf.sendSticker()`](#sendsticker)
- `replyWithVideo() -> `[`telegraf.sendVideo()`](#sendvideo)
- `replyWithVoice() -> `[`telegraf.sendVoice()`](#sendvoice)

**inline_query** update:

- `answerInlineQuery() -> `[`telegraf.answerInlineQuery()`](#answerinlinequery)

#### Examples

```js
var telegraf = new Telegraf(process.env.BOT_TOKEN)

telegraf.on('text', function * (){
  // Simple usage 
  telegraf.sendMessage(this.message.chat.id, `Hello ${this.state.role}`)
  
  // Using shortcut
  this.reply(`Hello ${this.state.role}`)

  // If you want to mark message as reply to source message
  this.reply(`Hello ${this.state.role}`, { reply_to_message_id: this.message.id })
})

telegraf.on('/quit', function * (){
  // Simple usage 
  telegraf.leaveChat(this.message.chat.id)
  
  // Using shortcut
  this.leaveChat()
})

telegraf.on('callback_query', function * (){
  // Simple usage 
  telegraf.answerCallbackQuery(this.callbackQuery.id)
  
  // Using shortcut
  this.answerCallbackQuery()
})

telegraf.on('inline_query', function * (){
  var result = []
  // Simple usage 
  telegraf.answerInlineQuery(this.inlineQuery.id, result)
  
  // Using shortcut
  this.answerInlineQuery(result)
})
```

## API reference

- [`Telegraf.handler(messageType, handler, [handler...])`](#handler)
- [`Telegraf.compose(handlers)`](#compose)
- [`new Telegraf(token)`](#new)
  - [`.answerCallbackQuery(callbackQueryId, text, showAlert)`](#answercallbackquery)
  - [`.answerInlineQuery(inlineQueryId, results, extra)`](#answerinlinequery)
  - [`.editMessageCaption(chatId, messageId, caption, extra)`](#editmessagecaption)
  - [`.editMessageReplyMarkup(chatId, messageId, markup, extra)`](#editmessagereplymarkup)
  - [`.editMessageText(chatId, messageId, text, extra)`](#editmessagetext)
  - [`.forwardMessage(chatId, fromChatId, messageId, extra)`](#forwardmessage)
  - [`.getChat(chatId)`](#getchat)
  - [`.getChatAdministrators(chatId)`](#getchatadministrators)
  - [`.getChatMember(chatId, userId)`](#getchatmember)
  - [`.getChatMembersCount(chatId)`](#getchatmemberscount)
  - [`.getFile(fileId)`](#getfile)
  - [`.getFileLink(fileId)`](#getFileLink)
  - [`.getMe()`](#getme)
  - [`.getUserProfilePhotos(userId, offset, limit)`](#getuserprofilephotos)
  - [`.handleUpdate(rawUpdate, response)`](#handleupdate)
  - [`.hears(string|ReGex, handler, [handler...])`](#hears)
  - [`.kickChatMember(chatId, userId)`](#kickchatmember)
  - [`.leaveChat(chatId)`](#leavechat)
  - [`.on(messageType, handler, [handler...])`](#on)
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
  - [`.startPolling(timeout, limit)`](#startPolling)
  - [`.startWebHook(webHookPath, tlsOptions, port, [host])`](#startwebhook)
  - [`.stop()`](#stop)
  - [`.unbanChatMember(chatId, userId)`](#unbanchatmember)
  - [`.use(function)`](#use)
  - [`.webHookCallback(webHookPath)`](#webhookcallback)

***

<a name="handler"></a>
##### `Telegraf.handler(updateType, handler, [handler...]) => GeneratorFunction`

Generates middleware for handling provided [update type](#update-types).

| Param | Type | Description |
| --- | --- | --- |
| updateType | `string`\|`string[]` | [update type](#update-types) |
| handler | `GeneratorFunction` | Handler |

* * *

<a name="compose"></a>
##### `Telegraf.compose(handlers) => GeneratorFunction`

Compose `middleware` returning a fully valid middleware comprised of all those which are passed.

| Param | Type | Description |
| --- | --- | --- |
| handlers | `GeneratorFunction[]` | Array of handlers |

* * *


<a name="new"></a>
##### `new Telegraf(token)`

Initialize new Telegraf app.

| Param | Type | Description |
| --- | --- | --- |
| token | `string` | [Bot Token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) |

* * *

<a name="answercallbackquery"></a>
##### `.answerCallbackQuery(callbackQueryId, text, showAlert) => Promise`

Use this method to send answers to callback queries.

| Param | Type | Description |
| --- | --- | --- |
| callbackQueryId | `string` | Query id |
| [text] | `string` | Notification text |
| [showAlert] | `bool` | Show alert instead of notification |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#answercallbackquery)</sub>

* * *

<a name="answerinlinequery"></a>
##### `.answerInlineQuery(inlineQueryId, results, extra) => Promise`

Use this method to send answers to an inline query.

| Param | Type | Description |
| --- | --- | --- |
| inlineQueryId | `string` | Query id |
| results | `object[]` | Results |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#answerinlinequery)|

* * *

<a name="editmessagecaption"></a>
##### `.editMessageCaption(chatId, messageId, caption, extra) => Promise`

Use this method to edit captions of messages sent by the bot or via the bot

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `string` | Message id |
| caption | `string` | Caption |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagecaption)|

* * *

<a name="editmessagereplymarkup"></a>
##### `.editMessageReplyMarkup(chatId, messageId, markup, extra) => Promise`

Use this method to edit only the reply markup of messages sent by the bot or via the bot.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `string` | Message id |
| markup | `object` | Keyboard markup |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagereplymarkup)|

* * *

<a name="editmessagetext"></a>
##### `.editMessageText(chatId, messageId, text, extra) => Promise`

Use this method to edit text messages sent by the bot or via the bot.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `string` | Message id |
| text | `string` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagetext)|

* * *

<a name="forwardmessage"></a>
##### `.forwardMessage(chatId, fromChatId, messageId, extra) => Promise`

Forwards message.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Source Chat id |
| fromChatId | `number`\|`string` | Target Chat id |
| messageId | `number` | Message id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#forwardmessage)|

* * *

<a name="getchat"></a>
##### `.getChat(chatId) => Promise`

Use this method to get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.).

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getchat)</sub>

* * *

<a name="getchatadministrators"></a>
##### `.getChatAdministrators(chatId) => Promise`

Use this method to get a list of administrators in a chat. On success, returns an Array of ChatMember objects that contains information about all chat administrators except other bots. If the chat is a group or a supergroup and no administrators were appointed, only the creator will be returned.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getchatadministrators)</sub>

* * *

<a name="getchatmember"></a>
##### `.getChatMember(chatId) => Promise`

Use this method to get information about a member of a chat.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getchatmember)</sub>


<a name="getchatmemberscount"></a>
##### `.getChatMembersCount(chatId) => Promise`

Use this method to get the number of members in a chat.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getchatmemberscount)</sub>

* * *

<a name="getfile"></a>
##### `.getFile(fileId) => Promise`

Returns basic info about a file and prepare it for downloading.

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string` | File id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getfile)</sub>

* * *

<a name="getFileLink"></a>
##### `.getFileLink(fileId) => Promise`

Returns link to file.

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string` | File id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getFileLink)</sub>

* * *

<a name="getme"></a>
##### `.getMe() => Promise`

Returns basic information about the bot.

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getme)</sub>

* * *

<a name="getuserprofilephotos"></a>
##### `.getUserProfilePhotos(userId, offset, limit) => Promise`

Returns profiles photos for provided user.

| Param | Type | Description |
| --- | --- | --- |
| userId | `number` | Chat id |
| offset | `number` | Offset |
| limit | `number` | Limit |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getuserprofilephotos)</sub>

* * *

<a name="handleupdate"></a>
##### `.handleUpdate(rawUpdate, [webHookResponse])`

Handle raw Telegram update. 
In case you use centralized webhook server, queue, etc.  

| Param | Type | Description |
| --- | --- | --- |
| rawUpdate | `object` | Telegram update payload |
| [webHookResponse] | `object` | (Optional) [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) |

* * *

<a name="hears"></a>
##### `.hears(pattern, handler, [handler...])`

Registers handler only for `text` updates using string pattern or RegEx.

| Param | Type | Description |
| --- | --- | --- |
| pattern | `string`\|`RegEx` | Pattern or RegEx |
| handler | `GeneratorFunction` | Handler |

* * *

<a name="kickchatmember"></a>
##### `.kickChatMember(chatId, userId) => Promise`

Use this method to kick a user from a group or a supergroup.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| userId | `number` | User id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#kickchatmember)</sub>


* * *

<a name="leavechat"></a>
##### `.leaveChat(chatId) => Promise`

Use this method for your bot to leave a group, supergroup or channel.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#leavechat)</sub>

* * *

<a name="on"></a>
##### `.on(updateType, handler, [handler...])`

Registers handler for provided [update type](#update-types).

| Param | Type | Description |
| --- | --- | --- |
| updateType | `string`\|`string[]` | [update type](#update-types) |
| handler | `GeneratorFunction` | Handler |

* * *

<a name="removewebhook"></a>
##### `.removeWebHook() => Promise`

Removes webhook. Shortcut for `Telegraf.setWebHook('')`

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#removewebhook)</sub>
* * *

<a name="sendaudio"></a>
##### `.sendAudio(chatId, audio, extra) => Promise`

Sends audio.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| audio | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendaudio)|

* * *

<a name="sendchataction"></a>
##### `.sendChatAction(chatId, action) => Promise`

Sends chat action.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| action | `string` | [Chat action](https://core.telegram.org/bots/api#sendchataction) |

* * *

<a name="sendcontact"></a>
##### `.sendContact(chatId, phoneNumber, firstName, extra) => Promise`

Sends document.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| phoneNumber | `string` | Contact phone number |
| firstName | `string` | Contact first name |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendcontact)|

* * *

<a name="senddocument"></a>
##### `.sendDocument(chatId, doc, extra) => Promise`

Sends document.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| doc | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#senddocument)|

* * *

<a name="sendlocation"></a>
##### `.sendLocation(chatId, latitude, longitude, extra) => Promise`

Sends location.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| latitude | `number` | Latitude |
| longitude | `number` | Longitude |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendlocation)|

* * *

<a name="sendmessage"></a>
##### `.sendMessage(chatId, text, extra) => Promise`

Sends text message.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| text | `string` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendmessage)|

* * *

<a name="sendphoto"></a>
##### `.sendPhoto(chatId, photo, extra) => Promise`

Sends photo.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| photo | [`File`](#file) | Photo |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendphoto)|

* * *

<a name="sendsticker"></a>
##### `.sendSticker(chatId, sticker, extra) => Promise`

Sends sticker.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| sticker | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendsticker)|

* * *

<a name="sendvenue"></a>
##### `.sendVenue(chatId, latitude, longitude, title, address, extra) => Promise`

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
##### `.sendVideo(chatId, video, extra) => Promise`

Sends video.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| video | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvideo)|

* * *

<a name="sendvoice"></a>
##### `.sendVoice(chatId, voice, extra) => Promise`

Sends voice.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| voice | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvoice)|

* * *

<a name="setwebhook"></a>
##### `.setWebHook(url, [cert]) => Promise`

Specifies an url to receive incoming updates via an outgoing webhook.

| Param | Type | Description |
| ---  | --- | --- |
| url  | `string` | Public url for webhook |
| [cert] | [`File`](#file) | SSL public certificate |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#setwebhook)</sub>

* * *

<a name="startwebhook"></a>
##### `.startWebHook(webHookPath, tlsOptions, port, [host])`

Start listening @ `https://host:port/webHookPath` for Telegram calls.

| Param | Type | Description |
| ---  | --- | --- |
| webHookPath | `string` | Webhook url path (see Telegraf.setWebHook) |
| tlsOptions | `object` | (Optional) [TLS server options](https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener). Pass null to use http |
| port | `number` | Port number |
| [host] | `string` | (Optional) Hostname |

* * *

<a name="startPolling"></a>
##### `.startPolling(timeout, limit)`

Start poll updates.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| timeout | `number` | 0 | Poll timeout |
| limit | `number` | 100 | Limits the number of updates to be retrieved |

* * *

<a name="stop"></a>
##### `.stop()`

Stop WebHook and polling

* * *

<a name="unbanchatmember"></a>
##### `.unbanChatMember(chatId, userId) => Promise`

Use this method to unban a previously kicked user in a supergroup.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| userId | `number` | User id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#unbanchatmember)</sub>

* * *

<a name="use"></a>
##### `.use(middleware)`

Registers a middleware.

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware function |

* * *

<a name="webhookcallback"></a>
##### `.webHookCallback(webHookPath) => Function`

Return a callback function suitable for the http[s].createServer() method to handle a request. 
You may also use this callback function to mount your telegraf app in a Koa/Connect/Express app.

| Param | Type | Description |
| ---  | --- | --- |
| webHookPath | `string` | Webhook url path (see Telegraf.setWebHook) |

### File

This object represents the contents of a file to be uploaded.

Supported file sources:

- `Existing file_id`
- `File path`
- `Url`
- `Buffer`
- `ReadStream`

Example:
```js

  // resend existing file by file_id
  telegraf.sendSticker('chatId', '123123jkbhj6b')

  // send file
  telegraf.sendVideo('chatId', {
    source: '/path/to/video.mp4'
  })

   // send stream
  telegraf.sendVideo('chatId', {
    source: fs.createReadStream('/path/to/video.mp4'),
    extension: 'mp4'
  })
  
  // send buffer
  telegraf.sendVoice('chatId', {
    source: new Buffer()
  })

  // send url
  telegraf.sendAudio('chatId', {
    url: 'http://lorempixel.com/image_output/cats-q-c-640-480-7.jpg'
  })

```

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#file)</sub>

## License

The MIT License (MIT)

Copyright (c) 2016 Telegraf

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
