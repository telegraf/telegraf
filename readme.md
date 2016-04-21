# Telegraf
[![Build Status](https://img.shields.io/travis/telegraf/telegraf.svg?branch=master&style=flat-square)](https://travis-ci.org/telegraf/telegraf)
[![NPM Version](https://img.shields.io/npm/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)

Telegram bot framework for node.js

## Installation

```js
$ npm install telegraf
```

## Example
  
```js
var Telegraf = require('telegraf');

var app = Telegraf(process.env.BOT_TOKEN);

// Look ma, middleware!
var sayYoMiddleware = function * (next) {
  yield this.reply('yo')
  yield next
}

// Text messages handling
app.hears('/answer', sayYoMiddleware, function * () {
  this.reply('*12*', { parse_mode: 'Markdown' })
})

// Wow! RegEx
app.hears(/reverse (.+)/, function * () {
  // Copy/Pasted from StackOverflow
  function reverse (s) {
    for (var i = s.length - 1, o = ''; i >= 0; o += s[i--]) { }
    return o
  }
  this.reply(reverse(this.match[1]))
})

app.startPolling()
```

There are some other examples on [examples](https://github.com/telegraf/telegraf/tree/master/examples).

## API

### Application

A Telegraf application is an object containing an array of middleware generator functions
which are composed and executed in a stack-like manner upon request. Telegraf is similar to many
other middleware systems that you may have encountered such as Ruby's Rack, Connect, and so on -
however a key design decision was made to provide high level "sugar" at the otherwise low-level
middleware layer. This improves interoperability, robustness, and makes writing middleware much
more enjoyable. 

```js
var Telegraf = require('telegraf')
var app = Telegraf('BOT TOKEN')

app.on('text', function * (){
  this.reply('Hello World')
})

app.startPolling()
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
var app = Telegraf('BOT TOKEN')

// Logger middleware
app.use(function * (next){
  var start = new Date
  this.state.started = start
  yield next
  var ms = new Date - start
  debug('response time %sms', ms)
})

app.on('text', function * (){
  this.reply('Hello World')
})
```

## Context

A Telegraf Context encapsulates telegram message.
Context is created per request, and is referenced in middleware as the receiver, or the this identifier, as shown in the following snippet:

```js
app.use(function * (){
  this.message; // Received message
  this.inlineQuery; // Received inline query
  this.chosenInlineResult; // Received inline query result
  this.callbackQuery; // Received callback query
});
```

The recommended way to extend application context.

```js
var app = Telegraf('BOT TOKEN')

app.context.db = {
  getScores: function () { return 42 }
}

app.on('text', function * (){
  var scores = this.db.getScores(this.message.from.username)
  this.reply(`${this.message.from.username}: ${score}`)
})
```

## State

The recommended namespace to share information between middlewares.

```js
var app = Telegraf('BOT TOKEN')

app.use(function * (next) {
  this.state.role = getUserRole(this.message) 
  yield next
})

app.on('text', function * (){
  this.reply(`Hello ${this.state.role}`)
})
```
## Error Handling

By default outputs all errors to stderr.
To perform custom error-handling logic such as centralized logging you can set `onerror` handler:

```js
app.onerror = function(err){
  log.error('server error', err)
}
```

## API reference

* `Telegraf`
  * [`new Telegraf(token)`](#new)
  * [`.startPolling(timeout, limit)`](#startPolling)
  * [`.startWebHook(token, tlsOptions, port, [host])`](#startWebHook)
  * [`.stop()`](#stop)
  * [`.use(function)`](#use)
  * [`.on(messageType, function)`](#on)
  * [`.hear(string|ReGex, function)`](#hear)
  * [`.sendMessage(chatId, text, extra)`](#sendmessage)
  * [`.forwardMessage(chatId, fromChatId, messageId, extra)`](#forwardmessage)
  * [`.sendLocation(chatId, latitude, longitude, extra)`](#sendlocation)
  * [`.sendPhoto(chatId, photo, extra)`](#sendphoto)
  * [`.sendDocument(chatId, doc, extra)`](#senddocument)
  * [`.sendAudio(chatId, audio, extra)`](#sendaudio)
  * [`.sendSticker(chatId, sticker, extra)`](#sendsticker)
  * [`.sendVideo(chatId, video, extra)`](#sendvideo)
  * [`.sendVoice(chatId, voice, extra)`](#sendvoice)
  * [`.sendChatAction(chatId, action)`](#sendchataction)
  * [`.getMe()`](#getme)
  * [`.getUserProfilePhotos(userId, offset, limit)`](#getuserprofilephotos)
  * [`.getFile(fileId)`](#getfile)
  * [`.getFileLink(fileId)`](#getFileLink)
  * [`.setWebHook(url, cert)`](#setwebhook)
  * [`.removeWebHook()`](#removewebhook)
  * [`.kickChatMember(chatId, userId)`](#kickchatmember)
  * [`.unbanChatMember(chatId, userId)`](#unbanchatmember)
  * [`.answerInlineQuery(inlineQueryId, results, extra)`](#answerinlinequery)
  * [`.answerCallbackQuery(callbackQueryId, text, showAlert)`](#answercallbackquery)
  * [`.editMessageText(chatId, messageId, text, extra)`](#editmessagetext)
  * [`.editMessageCaption(chatId, messageId, caption, extra)`](#editmessagecaption)
  * [`.editMessageReplyMarkup(chatId, messageId, markup, extra)`](#editmessagereplymarkup)

<a name="new"></a>
#### `Telegraf.new(token)`

Initialize new app.

| Param | Type | Description |
| --- | --- | --- |
| token | `String` | Bot Token |

* * *

<a name="startPolling"></a>
#### `Telegraf.startPolling(timeout, limit)`

Start poll updates.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| timeout | `Int` | 0 | Poll timeout |
| limit | `Int` | 100 | Limits the number of updates to be retrieved |

* * *

<a name="startWebHook"></a>
#### `Telegraf.startWebHook(token, tlsOptions, port, [host])`

Start listening @ `https://host:port/token` for Telegram calls.

| Param | Type | Description |
| ---  | --- | --- |
| token | `String` | Token |
| tlsOptions | `Object` | [tls server options](https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener) |
| port | `Int` | Port number |
| host | `String` | Hostname |

* * *

<a name="stop"></a>
#### `Telegraf.stop()`

Stop WebHook and polling

* * *

<a name="use"></a>
#### `Telegraf.use(middleware)`

Registers a middleware.

| Param | Type | Description |
| --- | --- | --- |
| middleware | `Function` | Middleware function |

* * *

<a name="on"></a>
#### `Telegraf.on(eventType, handler)`

Registers handler for provided [event type](#events).

| Param | Type | Description |
| --- | --- | --- |
| eventType | `String` | [Event type](#events) |
| handler | `Function` | Handler |

* * *

<a name="hear"></a>
#### `Telegraf.hear(pattern, handler)`

Registers handler only for `text` events using string pattern or RegEx.

| Param | Type | Description |
| --- | --- | --- |
| pattern | `String`/`RegEx` | Pattern or RegEx |
| handler | `Function` | Handler |

* * *

<a name="sendmessage"></a>
#### `Telegraf.sendMessage(chatId, text, extra)` => `Promise`

Sends text message.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| text | `String` | Message |
| extra | `Object` | [Optional parameters](https://core.telegram.org/bots/api#sendmessage)|
[Related Telegram api docs](https://core.telegram.org/bots/api#sendmessage)
* * *

<a name="forwardmessage"></a>
#### `Telegraf.forwardMessage(chatId, fromChatId, messageId, extra)` => `Promise`

Forwards message.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Source Chat id |
| fromChatId | `Integer`/`String` | Target Chat id |
| messageId | `Integer` | Message id |
| extra | `Object` | [Optional parameters](https://core.telegram.org/bots/api#forwardmessage)|

[Related Telegram api docs](https://core.telegram.org/bots/api#forwardmessage)
* * *

<a name="sendlocation"></a>
#### `Telegraf.sendLocation(chatId, latitude, longitude, extra)` => `Promise`

Sends location.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| latitude | `Integer` | Latitude |
| longitude | `Integer` | Longitude |
| extra | `Object` | [Optional parameters](https://core.telegram.org/bots/api#sendlocation)|

[Related Telegram api docs](https://core.telegram.org/bots/api#sendlocation)
* * *

<a name="sendphoto"></a>
#### `Telegraf.sendPhoto(chatId, photo, extra)` => `Promise`

Sends photo.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| photo | [`File`](#file) | Photo |
| extra | `Object` | [Optional parameters](https://core.telegram.org/bots/api#sendphoto)|

[Related Telegram api docs](https://core.telegram.org/bots/api#sendphoto)
* * *

<a name="senddocument"></a>
#### `Telegraf.sendDocument(chatId, doc, extra)` => `Promise`

Sends document.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| doc | [`File`](#file) | Document |
| extra | `Object` | [Optional parameters](https://core.telegram.org/bots/api#senddocument)|

[Related Telegram api docs](https://core.telegram.org/bots/api#senddocument)
* * *

<a name="sendaudio"></a>
#### `Telegraf.sendAudio(chatId, audio, extra)` => `Promise`

Sends audio.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| audio | [`File`](#file) | Document |
| extra | `Object` | [Optional parameters](https://core.telegram.org/bots/api#sendaudio)|

[Related Telegram api docs](https://core.telegram.org/bots/api#sendaudio)
* * *

<a name="sendsticker"></a>
#### `Telegraf.sendSticker(chatId, sticker, extra)` => `Promise`

Sends sticker.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| sticker | [`File`](#file) | Document |
| extra | `Object` | [Optional parameters](https://core.telegram.org/bots/api#sendsticker)|

[Related Telegram api docs](https://core.telegram.org/bots/api#sendsticker)
* * *

<a name="sendvideo"></a>
#### `Telegraf.sendVideo(chatId, video, extra)` => `Promise`

Sends video.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| video | [`File`](#file) | Document |
| extra | `Object` | [Optional parameters](https://core.telegram.org/bots/api#sendvideo)|

[Related Telegram api docs](https://core.telegram.org/bots/api#sendvideo)
* * *

<a name="sendvoice"></a>
#### `Telegraf.sendVoice(chatId, voice, extra)` => `Promise`

Sends voice.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| voice | [`File`](#file) | Document |
| extra | `Object` | [Optional parameters](https://core.telegram.org/bots/api#sendvoice)|

[Related Telegram api docs](https://core.telegram.org/bots/api#sendvoice)
* * *

<a name="sendchataction"></a>
#### `Telegraf.sendChatAction(chatId, action)` => `Promise`

Sends chat action.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| action | `String` | [Chat action](https://core.telegram.org/bots/api#sendchataction) |

[Related Telegram api docs](https://core.telegram.org/bots/api#sendchataction)
* * *

<a name="getme"></a>
#### `Telegraf.getMe()` => `Promise`

Returns basic information about the bot.

[Related Telegram api docs](https://core.telegram.org/bots/api#getme)
* * *

<a name="getuserprofilephotos"></a>
#### `Telegraf.getUserProfilePhotos(userId, offset, limit)` => `Promise`

Returns profiles photos for provided user.

| Param | Type | Description |
| --- | --- | --- |
| userId | `Integer` | Chat id |
| offset | `Integer` | Offset |
| userId | `limit` | Limit |

[Related Telegram api docs](https://core.telegram.org/bots/api#getuserprofilephotos)
* * *

<a name="getfile"></a>
#### `Telegraf.getFile(fileId)` => `Promise`

Returns basic info about a file and prepare it for downloading.

| Param | Type | Description |
| --- | --- | --- |
| fileId | `String` | File id |

[Related Telegram api docs](https://core.telegram.org/bots/api#getfile)
* * *

<a name="getFileLink"></a>
#### `Telegraf.getFileLink(fileId)` => `Promise`

Returns link to file.

| Param | Type | Description |
| --- | --- | --- |
| fileId | `String` | File id |


[Related Telegram api docs](https://core.telegram.org/bots/api#getFileLink)
* * *

<a name="setwebhook"></a>
#### `Telegraf.setWebHook(url, [cert])` => `Promise`

Specifies an url to receive incoming updates via an outgoing webHook.

| Param | Type | Description |
| ---  | --- | --- |
| url  | `String` | File id |
| cert | [`File`](#file) | SSL public certificate |

[Related Telegram api docs](https://core.telegram.org/bots/api#setwebhook)
* * *

<a name="removewebhook"></a>
#### `Telegraf.removeWebHook()` => `Promise`

Removes webhook. Shortcut for `Telegraf.setWebHook('')`

[Related Telegram api docs](https://core.telegram.org/bots/api#removewebhook)

* * *
<a name="kickchatmember"></a>
#### `Telegraf.kickChatMember(chatId, userId)` => `Promise`

Use this method to kick a user from a group or a supergroup.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| userId | `Integer` | User id |

[Related Telegram api docs](https://core.telegram.org/bots/api#kickchatmember)
* * *

<a name="unbanchatmember"></a>
#### `Telegraf.unbanChatMember(chatId, userId)` => `Promise`

Use this method to unban a previously kicked user in a supergroup.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| userId | `Integer` | User id |

[Related Telegram api docs](https://core.telegram.org/bots/api#unbanchatmember)
* * *

<a name="answerinlinequery"></a>
#### `Telegraf.answerInlineQuery(inlineQueryId, results, extra)` => `Promise`

Use this method to send answers to an inline query.

| Param | Type | Description |
| --- | --- | --- |
| inlineQueryId | `String` | Query id |
| results | `Array` | Results |
| extra | `Object` | [Optional parameters](https://core.telegram.org/bots/api#answerinlinequery)|

[Related Telegram api docs](https://core.telegram.org/bots/api#answerinlinequery)
* * *

<a name="answercallbackquery"></a>
#### `Telegraf.answerCallbackQuery(callbackQueryId, text, showAlert)` => `Promise`

Use this method to send answers to callback queries.

| Param | Type | Description |
| --- | --- | --- |
| callbackQueryId | `String` | Query id |
| text | `String` | Notification text |
| showAlert | `Bool` | Show alert instead of notification |

[Related Telegram api docs](https://core.telegram.org/bots/api#answercallbackquery)
* * *

<a name="editmessagetext"></a>
#### `Telegraf.editMessageText(chatId, messageId, text, extra)` => `Promise`

Use this method to edit text messages sent by the bot or via the bot.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| messageId | `String` | Message id |
| text | `String` | Message |
| extra | `Object` | [Optional parameters](https://core.telegram.org/bots/api#editmessagetext)|

[Related Telegram api docs](https://core.telegram.org/bots/api#editmessagetext)
* * *

<a name="editmessagecaption"></a>
#### `Telegraf.editMessageCaption(chatId, messageId, caption, extra)` => `Promise`

Use this method to edit captions of messages sent by the bot or via the bot

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| messageId | `String` | Message id |
| caption | `String` | Caption |
| extra | `Object` | [Optional parameters](https://core.telegram.org/bots/api#editmessagecaption)|

[Related Telegram api docs](https://core.telegram.org/bots/api#editmessagecaption)
* * *

<a name="editmessagereplymarkup"></a>
#### `Telegraf.editMessageReplyMarkup(chatId, messageId, markup, extra)` => `Promise`

Use this method to edit only the reply markup of messages sent by the bot or via the bot.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `Integer`/`String` | Chat id |
| messageId | `String` | Message id |
| markup | `Object` | Keyboard markup |
| extra | `Object` | [Optional parameters](https://core.telegram.org/bots/api#editmessagereplymarkup)|

[Related Telegram api docs](https://core.telegram.org/bots/api#editmessagereplymarkup)

#### File

This object represents the contents of a file to be uploaded.

Supported file sources:

* `File path`
* `Buffer`
* `ReadStream`
* `Existing file_id`

Example:
```js
  // send file
  app.sendVideo('chatId', {source: '/path/to/video.mp4'}})
  
  // send buffer
  app.sendVoice('chatId', {source: new Buffer(...)})

  // send stream
  app.sendAudio('chatId', {source: fs.createReadStream('/path/to/video.mp4')})

  // resend existing file
  app.sendSticker('chatId', '123123jkbhj6b')
```

[Related Telegram api docs](https://core.telegram.org/bots/api#file)

### Events

Supported events:

* `text`
* `audio`
* `document`
* `photo`
* `sticker`
* `video`
* `voice`
* `contact`
* `location`
* `venue`
* `new_chat_participant`
* `left_chat_participant`
* `new_chat_title`
* `new_chat_photo`
* `delete_chat_photo`
* `group_chat_created`
* `supergroup_chat_created`
* `channel_chat_created`
* `migrate_to_chat_id`
* `migrate_from_chat_id`
* `pinned_message`
* `inline_query`
* `chosen_inline_result`
* `callback_query`

Also, Telegraf will emit `message` event for for all messages except `inline_query`, `chosen_inline_result` and `callback_query`.

```js
// Handle all messages
app.on('message', function * () {
  this.reply('Hey there!')
})
```
[Related Telegram api docs](https://core.telegram.org/bots/api#message)

### Shortcuts

Telegraf context have many handy shortcuts.

    Note: shortcuts are not available for `inline_query` and `chosen_inline_result` events.

```js
var app = Telegraf('BOT TOKEN')

app.on('text', function * (){
  // Simple usage 
  app.sendMessage(this.message.chat.id, `Hello ${this.state.role}`)
  
  // Using shortcut
  this.reply(`Hello ${this.state.role}`)

  // If you want to mark message as reply to source message
  this.reply(`Hello ${this.state.role}`, { reply_to_message_id: this.message.id })
})
```

* `reply()` -> `app.sendMessage()`
* `replyWithPhoto()` -> `app.sendPhoto()`
* `replyWithAudio()` -> `app.sendAudio()`
* `replyWithDocument()` -> `app.sendDocument()`
* `replyWithSticker()` -> `app.sendSticker()`
* `replyWithVideo()` -> `app.sendVideo()`
* `replyWithVoice()` -> `app.sendVoice()`
* `replyWithChatAction()` -> `app.sendChatAction()`
* `replyWithLocation()` -> `app.sendLocation()`

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
