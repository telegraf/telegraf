# API reference

- [Telegraf-API](#telegraf-api)
- [Uploading files](#file)
- [Shortcuts](#shortcuts)

## Telegraf API

- [`Telegraf.mount(messageType, handler)`](#mount)
- [`Telegraf.compose(handlers)`](#compose)
- [`new Telegraf(token)`](#new)
  - [`.answerCallbackQuery(callbackQueryId, text, showAlert)`](#answercallbackquery)
  - [`.answerInlineQuery(inlineQueryId, results, extra)`](#answerinlinequery)
  - [`.editMessageCaption(chatId, messageId, caption, extra)`](#editmessagecaption)
  - [`.editMessageReplyMarkup(chatId, messageId, markup, extra)`](#editmessagereplymarkup)
  - [`.editMessageText(chatId, messageId, text, extra)`](#editmessagetext)
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

<a name="mount"></a>
#### `Telegraf.mount(updateType, handler) => function`

Generates middleware for handling provided [update type](#update-types).

| Param | Type | Description |
| --- | --- | --- |
| updateType | `string`\|`string[]` | [update type](#update-types) |
| handler | `function` | Handler |

* * *

<a name="compose"></a>
#### `Telegraf.compose(handlers) => function`

Compose `middleware` returning a fully valid middleware comprised of all those which are passed.

| Param | Type | Description |
| --- | --- | --- |
| handlers | `function[]` | Array of handlers |

* * *

<a name="new"></a>
#### `new Telegraf(token)`

Initialize new Telegraf app.

| Param | Type | Description |
| --- | --- | --- |
| token | `string` | [Bot Token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) |

* * *

<a name="answercallbackquery"></a>
#### `telegraf.answerCallbackQuery(callbackQueryId, text, showAlert) => Promise`

Use this method to send answers to callback queries.

| Param | Type | Description |
| --- | --- | --- |
| callbackQueryId | `string` | Query id |
| [text] | `string` | Notification text |
| [showAlert] | `bool` | Show alert instead of notification |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#answercallbackquery)</sub>

* * *

<a name="answerinlinequery"></a>
#### `telegraf.answerInlineQuery(inlineQueryId, results, extra) => Promise`

Use this method to send answers to an inline query.

| Param | Type | Description |
| --- | --- | --- |
| inlineQueryId | `string` | Query id |
| results | `object[]` | Results |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#answerinlinequery)|

* * *

<a name="editmessagecaption"></a>
#### `telegraf.editMessageCaption(chatId, messageId, caption, extra) => Promise`

Use this method to edit captions of messages sent by the bot or via the bot

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `string` | Message id |
| caption | `string` | Caption |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagecaption)|

* * *

<a name="editmessagereplymarkup"></a>
#### `telegraf.editMessageReplyMarkup(chatId, messageId, markup, extra) => Promise`

Use this method to edit only the reply markup of messages sent by the bot or via the bot.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `string` | Message id |
| markup | `object` | Keyboard markup |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagereplymarkup)|

* * *

<a name="editmessagetext"></a>
#### `telegraf.editMessageText(chatId, messageId, text, extra) => Promise`

Use this method to edit text messages sent by the bot or via the bot.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `string` | Message id |
| text | `string` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagetext)|

* * *

<a name="forwardmessage"></a>
#### `telegraf.forwardMessage(chatId, fromChatId, messageId, extra) => Promise`

Forwards message.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Target Chat id |
| fromChatId | `number`\|`string` | Source Chat id |
| messageId | `number` | Message id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#forwardmessage)|


* * *

<a name="sendcopy"></a>
#### `telegraf.sendCopy(chatId, message, extra) => Promise`

Sends message copy.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Target Chat id |
| message | `object` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendmessage)|

* * *

<a name="getchat"></a>
#### `telegraf.getChat(chatId) => Promise`

Use this method to get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.).

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getchat)</sub>

* * *

<a name="getchatadministrators"></a>
#### `telegraf.getChatAdministrators(chatId) => Promise`

Use this method to get a list of administrators in a chat. On success, returns an Array of ChatMember objects that contains information about all chat administrators except other bots. If the chat is a group or a supergroup and no administrators were appointed, only the creator will be returned.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getchatadministrators)</sub>

* * *

<a name="getchatmember"></a>
#### `telegraf.getChatMember(chatId) => Promise`

Use this method to get information about a member of a chat.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getchatmember)</sub>


<a name="getchatmemberscount"></a>
#### `telegraf.getChatMembersCount(chatId) => Promise`

Use this method to get the number of members in a chat.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getchatmemberscount)</sub>

* * *

<a name="getfile"></a>
#### `telegraf.getFile(fileId) => Promise`

Returns basic info about a file and prepare it for downloading.

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string` | File id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getfile)</sub>

* * *

<a name="getFileLink"></a>
#### `telegraf.getFileLink(fileId) => Promise`

Returns link to file.

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string` | File id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getFileLink)</sub>

* * *

<a name="getme"></a>
#### `telegraf.getMe() => Promise`

Returns basic information about the bot.

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getme)</sub>

* * *

<a name="getuserprofilephotos"></a>
#### `telegraf.getUserProfilePhotos(userId, offset, limit) => Promise`

Returns profiles photos for provided user.

| Param | Type | Description |
| --- | --- | --- |
| userId | `number` | Chat id |
| offset | `number` | Offset |
| limit | `number` | Limit |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#getuserprofilephotos)</sub>

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

<a name="hears"></a>
#### `telegraf.hears(pattern, handler, [handler...])`

Registers handler only for `text` updates using string pattern or RegEx.

| Param | Type | Description |
| --- | --- | --- |
| pattern | `string`\|`RegEx` | Pattern or RegEx |
| handler | `function` | Handler |

* * *

<a name="kickchatmember"></a>
#### `telegraf.kickChatMember(chatId, userId) => Promise`

Use this method to kick a user from a group or a supergroup.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| userId | `number` | User id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#kickchatmember)</sub>


* * *

<a name="leavechat"></a>
#### `telegraf.leaveChat(chatId) => Promise`

Use this method for your bot to leave a group, supergroup or channel.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#leavechat)</sub>

* * *

<a name="on"></a>
#### `telegraf.on(updateType, handler, [handler...])`

Registers handler for provided [update type](#update-types).

| Param | Type | Description |
| --- | --- | --- |
| updateType | `string`\|`string[]` | [update type](#update-types) |
| handler | `function` | Handler |

* * *

<a name="removewebhook"></a>
#### `telegraf.removeWebHook() => Promise`

Removes webhook. Shortcut for `Telegraf.setWebHook('')`

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#removewebhook)</sub>
* * *

<a name="sendaudio"></a>
#### `telegraf.sendAudio(chatId, audio, extra) => Promise`

Sends audio.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| audio | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendaudio)|

* * *

<a name="sendchataction"></a>
#### `telegraf.sendChatAction(chatId, action) => Promise`

Sends chat action.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| action | `string` | [Chat action](https://core.telegram.org/bots/api#sendchataction) |

* * *

<a name="sendcontact"></a>
#### `telegraf.sendContact(chatId, phoneNumber, firstName, extra) => Promise`

Sends document.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| phoneNumber | `string` | Contact phone number |
| firstName | `string` | Contact first name |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendcontact)|

* * *

<a name="senddocument"></a>
#### `telegraf.sendDocument(chatId, doc, extra) => Promise`

Sends document.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| doc | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#senddocument)|

* * *

<a name="sendlocation"></a>
#### `telegraf.sendLocation(chatId, latitude, longitude, extra) => Promise`

Sends location.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| latitude | `number` | Latitude |
| longitude | `number` | Longitude |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendlocation)|

* * *

<a name="sendmessage"></a>
#### `telegraf.sendMessage(chatId, text, extra) => Promise`

Sends text message.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| text | `string` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendmessage)|

* * *

<a name="sendphoto"></a>
#### `telegraf.sendPhoto(chatId, photo, extra) => Promise`

Sends photo.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| photo | [`File`](#file) | Photo |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendphoto)|

* * *

<a name="sendsticker"></a>
#### `telegraf.sendSticker(chatId, sticker, extra) => Promise`

Sends sticker.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| sticker | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendsticker)|

* * *

<a name="sendvenue"></a>
#### `telegraf.sendVenue(chatId, latitude, longitude, title, address, extra) => Promise`

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
#### `telegraf.sendVideo(chatId, video, extra) => Promise`

Sends video.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| video | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvideo)|

* * *

<a name="sendvoice"></a>
#### `telegraf.sendVoice(chatId, voice, extra) => Promise`

Sends voice.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| voice | [`File`](#file) | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvoice)|

* * *

<a name="setwebhook"></a>
#### `telegraf.setWebHook(url, [cert]) => Promise`

Specifies an url to receive incoming updates via an outgoing webhook.

| Param | Type | Description |
| ---  | --- | --- |
| url  | `string` | Public url for webhook |
| [cert] | [`File`](#file) | SSL public certificate |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#setwebhook)</sub>

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

<a name="startPolling"></a>
#### `telegraf.startPolling(timeout, limit)`

Start poll updates.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| timeout | `number` | 0 | Poll timeout |
| limit | `number` | 100 | Limits the number of updates to be retrieved |

* * *

<a name="stop"></a>
#### `telegraf.stop()`

Stop WebHook and polling

* * *

<a name="unbanchatmember"></a>
#### `telegraf.unbanChatMember(chatId, userId) => Promise`

Use this method to unban a previously kicked user in a supergroup.

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| userId | `number` | User id |

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#unbanchatmember)</sub>

* * *

<a name="use"></a>
#### `telegraf.use(middleware)`

Registers a middleware.

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware function |

* * *

<a name="webhookcallback"></a>
#### `telegraf.webHookCallback(webHookPath) => Function`

Return a callback function suitable for the http[s].createServer() method to handle a request. 
You may also use this callback function to mount your telegraf app in a Koa/Connect/Express app.

| Param | Type | Description |
| ---  | --- | --- |
| webHookPath | `string` | Webhook url path (see Telegraf.setWebHook) |

* * *

### Update types

Supported update types:

- `message`
- `edited_message`
- `inline_query`
- `chosen_inline_result`
- `callback_query`

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
  telegraf.sendSticker('chatId', '123123jkbhj6b')

  // send file
  telegraf.sendVideo('chatId', {
    source: '/path/to/video.mp4'
  })

   // send stream
  telegraf.sendVideo('chatId', {
    source: fs.createReadStream('/path/to/video.mp4')
  })
  
  // send buffer
  telegraf.sendVoice('chatId', {
    source: new Buffer()
  })

  // send url
  telegraf.sendPhoto('chatId', {
    url: 'http://lorempixel.com/400/200/cats/',
    filename: 'kitten.jpg'
  })
```

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#file)</sub>

## Shortcuts

Available shortcuts for **message** update:

- `ctx.getChat() -> `[`telegraf.getChat()`](#getchat)
- `ctx.getChatAdministrators() -> `[`telegraf.getChatAdministrators()`](#getchatadministrators)
- `ctx.getChatMember() -> `[`telegraf.getChatMember()`](#getchatmember)
- `ctx.getChatMembersCount() -> `[`telegraf.getChatMembersCount()`](#getchatmemberscount)
- `ctx.leaveChat() -> `[`telegraf.leaveChat()`](#leavechat)
- `ctx.reply() -> `[`telegraf.sendMessage()`](#sendmessage)
- `ctx.replyWithMarkdown() -> `[`telegraf.sendMessage()`](#sendmessage)
- `ctx.replyWithHTML() -> `[`telegraf.sendMessage()`](#sendmessage)
- `ctx.replyWithAudio() -> `[`telegraf.sendAudio()`](#sendaudio)
- `ctx.replyWithChatAction() -> `[`telegraf.sendChatAction()`](#sendchataction)
- `ctx.replyWithDocument() -> `[`telegraf.sendDocument()`](#senddocument)
- `ctx.replyWithLocation() -> `[`telegraf.sendLocation()`](#sendlocation)
- `ctx.replyWithPhoto() -> `[`telegraf.sendPhoto()`](#sendphoto)
- `ctx.replyWithSticker() -> `[`telegraf.sendSticker()`](#sendsticker)
- `ctx.replyWithVideo() -> `[`telegraf.sendVideo()`](#sendvideo)
- `ctx.replyWithVoice() -> `[`telegraf.sendVoice()`](#sendvoice)

Available shortcuts for **callback_query** update:

- `ctx.answerCallbackQuery() -> `[`telegraf.answerCallbackQuery()`](#answercallbackquery)
- `ctx.getChat() -> `[`telegraf.getChat()`](#getchat)
- `ctx.getChatAdministrators() -> `[`telegraf.getChatAdministrators()`](#getchatadministrators)
- `ctx.getChatMember() -> `[`telegraf.getChatMember()`](#getchatmember)
- `ctx.getChatMembersCount() -> `[`telegraf.getChatMembersCount()`](#getchatmemberscount)
- `ctx.leaveChat() -> `[`telegraf.leaveChat()`](#leavechat)
- `ctx.reply() -> `[`telegraf.sendMessage()`](#sendmessage)
- `ctx.replyWithMarkdown() -> `[`telegraf.sendMessage()`](#sendmessage)
- `ctx.replyWithHTML() -> `[`telegraf.sendMessage()`](#sendmessage)
- `ctx.replyWithAudio() -> `[`telegraf.sendAudio()`](#sendaudio)
- `ctx.replyWithChatAction() -> `[`telegraf.sendChatAction()`](#sendchataction)
- `ctx.replyWithDocument() -> `[`telegraf.sendDocument()`](#senddocument)
- `ctx.replyWithLocation() -> `[`telegraf.sendLocation()`](#sendlocation)
- `ctx.replyWithPhoto() -> `[`telegraf.sendPhoto()`](#sendphoto)
- `ctx.replyWithSticker() -> `[`telegraf.sendSticker()`](#sendsticker)
- `ctx.replyWithVideo() -> `[`telegraf.sendVideo()`](#sendvideo)
- `ctx.replyWithVoice() -> `[`telegraf.sendVoice()`](#sendvoice)

Available shortcuts for **inline_query** update:

- `ctx.answerInlineQuery() -> `[`telegraf.answerInlineQuery()`](#answerinlinequery)

### Examples

```js
var bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('text', (ctx) => {
  // Simple usage 
  bot.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`)
  
  // Using shortcut
  ctx.reply(`Hello ${ctx.state.role}`)

  // If you want to mark message as reply to source message
  ctx.reply(`Hello ${ctx.state.role}`, { reply_to_message_id: ctx.message.id })
})

bot.on('/quit', (ctx) => {
  // Simple usage 
  bot.leaveChat(ctx.message.chat.id)
  
  // Using shortcut
  ctx.leaveChat()
})

bot.on('callback_query', (ctx) => {
  // Simple usage 
  bot.answerCallbackQuery(ctx.callbackQuery.id)
  
  // Using shortcut
  ctx.answerCallbackQuery()
})

bot.on('inline_query', (ctx) => {
  var result = []
  // Simple usage 
  bot.answerInlineQuery(ctx.inlineQuery.id, result)
  
  // Using shortcut
  ctx.answerInlineQuery(result)
})
```
