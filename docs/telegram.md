# Telegram

Telegram API wrapper reference

```js
const { Telegram } = require('telegraf')
```

### Constructor

Initialize new Telegraf app.

`telegram.new Telegram(token, options)`

| Param | Type | Description |
| --- | --- | --- |
| token | `string` | [Bot Token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) |
| options | `object` | Telegram options |

Telegram options:

```js
{
  agent: null,        // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
  webhookReply: true  // Reply via webhook
}
```

### webhookReply

Use this property to control `reple via webhook` feature.

`telegram.webhookReply = [bool]`

### answerCallbackQuery

Use this method to send answers to callback queries.

`telegram.answerCallbackQuery(callbackQueryId, text, url, showAlert, cacheTime) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| callbackQueryId | `string` | Query id |
| [text] | `string` | Notification text |
| [url] | `string` | Notification text |
| [showAlert] | `bool` | Show alert instead of notification |
| [cacheTime] | `number` | The maximum amount of time in seconds that the result of the callback query may be cached client-side. Telegram apps will support caching starting in version 3.14. Defaults to 0. |

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#answercallbackquery)</sub>

### answerInlineQuery

Use this method to send answers to an inline query.

`telegram.answerInlineQuery(inlineQueryId, results, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| inlineQueryId | `string` | Query id |
| results | `object[]` | Results |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#answerinlinequery)|

### editMessageCaption

Use this method to edit captions of messages sent by the bot or via the bot

`telegram.editMessageCaption(chatId, messageId, inlineMessageId, caption, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| caption | `string` | Caption |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagecaption)|

### editMessageReplyMarkup

Use this method to edit only the reply markup of messages sent by the bot or via the bot.

`telegram.editMessageReplyMarkup(chatId, messageId, inlineMessageId, markup, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| markup | `object` | Keyboard markup |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagereplymarkup)|

### editMessageText

Use this method to edit text messages sent by the bot or via the bot.

`telegram.editMessageText(chatId, messageId, inlineMessageId, text, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| text | `string` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagetext)|

### forwardMessage

Forwards message.

`telegram.forwardMessage(chatId, fromChatId, messageId, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Target Chat id |
| fromChatId | `number`\|`string` | Source Chat id |
| messageId | `number` | Message id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#forwardmessage)|


### sendCopy

Sends message copy.

`telegram.sendCopy(chatId, message, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Target Chat id |
| message | `object` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendmessage)|

### getWebhookInfo

Use this method to get current webhook status. Requires no parameters. On success, returns a WebhookInfo object. If the bot is using getUpdates, will return an object with the url field empty.

`telegram.getWebhookInfo() => Promise`

### getChat

Use this method to get up to date information about the chat (current name of the user for one-on-one conversatio
ns, current username of a user, group or channel, etc.).

`telegram.getChat(chatId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#getchat)</sub>

### getChatAdministrators

Use this method to get a list of administrators in a chat. On success, returns an Array of ChatMember objects that contains information about all chat administrators except other bots. If the chat is a group or a supergroup and no administrators were appointed, only the creator will be returned.

`telegram.getChatAdministrators(chatId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#getchatadministrators)</sub>


### setGameScore

Use this method to set the score of the specified user in a game. On success, if the message was sent by the bot, returns the edited Message, otherwise returns True. Returns an error, if the new score is not greater than the user's current score in the chat.

`telegram.setGameScore(userId, score, inlineMessageId, chatId, messageId, editMessage, force) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| userId | `number`\ | Target User id |
| score | `number`\ | Target User id |
| inlineMessageId | `string` | Inline message id(optional) |
| chatId | `number`\|`string` | Target Chat id(optional) |
| messageId | `number`\|`string` | Message id(optional) |
| editMessage | `boolean` | edit target message, default value is True |
| force | `boolean` | Pass True, if the high score is allowed to decrease. This can be useful when fixing mistakes or banning cheaters(optional) |

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#setgamescore)</sub>

### getGameHighScores

Use this method to get data for high score tables. Will return the score of the specified user and several of his neighbors in a game. On success, returns an Array of GameHighScore objects.

`telegram.getGameHighScores(userId, inlineMessageId, chatId, messageId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| userId | `number`\ | Target User id |
| inlineMessageId | `string` | Inline message id(optional) |
| chatId | `number`\|`string` | Target Chat id(optional) |
| messageId | `number`\|`string` | Message id(optional) |

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#getgamehighscores)</sub>

### getChatMember

Use this method to get information about a member of a chat.

`telegram.getChatMember(chatId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#getchatmember)</sub>


### getChatMembersCount

Use this method to get the number of members in a chat.

`telegram.getChatMembersCount(chatId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#getchatmemberscount)</sub>

### getFile

Returns basic info about a file and prepare it for downloading.

`telegram.getFile(fileId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string` | File id |

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#getfile)</sub>

### getFileLink

Returns link to file.

`telegram.getFileLink(fileId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string` | File id |

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#getFileLink)</sub>

### getMe

Returns basic information about the bot.

`telegram.getMe() => Promise`

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#getme)</sub>

### getUserProfilePhotos

Returns profiles photos for provided user.

`telegram.getUserProfilePhotos(userId, offset, limit) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| userId | `number` | Chat id |
| offset | `number` | Offset |
| limit | `number` | Limit |

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#getuserprofilephotos)</sub>

### kickChatMember

Use this method to kick a user from a group or a supergroup.

`telegram.kickChatMember(chatId, userId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| userId | `number` | User id |

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#kickchatmember)</sub>

### leaveChat

Use this method for your bot to leave a group, supergroup or channel.

`telegram.leaveChat(chatId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#leavechat)</sub>

### deleteWebhook

Removes webhook integration.

`telegram.deleteWebhook() => Promise`

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#deletewebhook)</sub>

### sendAudio

Sends audio.

`telegram.sendAudio(chatId, audio, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| audio | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendaudio)|


### sendGame

Sends game.

`telegram.sendGame(chatId, gameName, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| gameName | `String` | Game short name |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendgame)|

### sendChatAction

Sends chat action.

`telegram.sendChatAction(chatId, action) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| action | `string` | [Chat action](https://core.telegram.org/bots/api#sendchataction) |

### sendContact

Sends document.

`telegram.sendContact(chatId, phoneNumber, firstName, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| phoneNumber | `string` | Contact phone number |
| firstName | `string` | Contact first name |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendcontact)|

### sendDocument

Sends document.

`telegram.sendDocument(chatId, doc, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| doc | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#senddocument)|

### sendLocation

Sends location.

`telegram.sendLocation(chatId, latitude, longitude, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| latitude | `number` | Latitude |
| longitude | `number` | Longitude |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendlocation)|

### sendMessage

Sends text message.

`telegram.sendMessage(chatId, text, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| text | `string` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendmessage)|

### sendPhoto

Sends photo.

`telegram.sendPhoto(chatId, photo, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| photo | `File` | Photo |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendphoto)|

### sendSticker

Sends sticker.

`telegram.sendSticker(chatId, sticker, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| sticker | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendsticker)|

### sendVenue

Sends venue information.

`telegram.sendVenue(chatId, latitude, longitude, title, address, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| latitude | `number` | Latitude |
| longitude | `number` | Longitude |
| title | `string` | Venue title |
| address | `string` | Venue address |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvenue)|

### sendVideo

Sends video.

`telegram.sendVideo(chatId, video, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| video | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvideo)|

### sendVoice

Sends voice.

`telegram.sendVoice(chatId, voice, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| voice | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvoice)|

### setWebhook

Specifies an url to receive incoming updates via an outgoing webhook.

`telegram.setWebhook(url, [cert], [maxConnections], [allowedUpdates]) => Promise`

| Param | Type | Description |
| ---  | --- | --- |
| url  | `string` | Public url for webhook |
| [cert] | `File` | SSL public certificate |
| [maxConnections] | `number` | User id |
| [allowedUpdates] | `string[]` | List the types of updates you want your bot to receive |
<sub>[See Telegram api docs](https://core.telegram.org/bots/api#setwebhook)</sub>

### unbanChatMember

Use this method to unban a previously kicked user in a supergroup.

`telegram.unbanChatMember(chatId, userId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| userId | `number` | User id |

<sub>[See Telegram api docs](https://core.telegram.org/bots/api#unbanchatmember)</sub>
