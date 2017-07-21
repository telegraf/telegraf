# Telegram

Telegram wrapper API reference.

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

Use this property to control `reply via webhook` feature.

`telegram.webhookReply = [bool]`

### addStickerToSet

Use this method to add a new sticker to a set created by the bot.

`telegram.addStickerToSet(ownerId, name, stickerData) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| ownerId | `string` | User identifier of sticker set owner |
| name | `string` | Sticker set name |
| stickerData | `Object` | Sticker data({png_sticker: 'stiker file', emojis: '😉', mask__position: '' }) |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#addstickertoset)</sub>

### answerCallbackQuery

Use this method to send answers to callback queries.

`telegram.answerCallbackQuery(callbackQueryId, text, url, showAlert, cacheTime) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| callbackQueryId | `string` | Query id |
| [text] | `string` | Notification text |
| [url] | `string` | Game url |
| [showAlert] | `bool` | Show alert instead of notification |
| [cacheTime] | `number` | The maximum amount of time in seconds that the result of the callback query may be cached client-side. Telegram apps will support caching starting in version 3.14. Defaults to 0. |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#answercallbackquery)</sub>

### answerGameQuery

Use this method to send answers to game query.

`telegram.answerGameQuery(callbackQueryId, url) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| callbackQueryId | `string` | Query id |
| url | `string` | Notification text |


### answerShippingQuery

Use this method to send answers to shipping query.

`telegram.answerShippingQuery(shippingQueryId, ok, shippingOptions, errorMessage) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| shippingQueryId | `string` | Shipping Query id |
| ok | `bool` | Specify True if delivery to the specified address is possible |
| shippingOptions | `bool` | [Shipping Options](https://core.telegram.org/bots/api#answershippingquery) |
| errorMessage | `bool` | Error message in human readable form  |

### answerPreCheckoutQuery

Use this method to send answers to shipping query.

`telegram.answerPreCheckoutQuery(preCheckoutQueryId, ok, errorMessage) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| preCheckoutQueryId | `string` | Shipping Query id |
| ok | `bool` | Specify True if everything is alright (goods are available, etc.) |
| errorMessage | `bool` | Error message in human readable form  |

### answerInlineQuery

Use this method to send answers to an inline query.

`telegram.answerInlineQuery(inlineQueryId, results, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| inlineQueryId | `string` | Query id |
| results | `object[]` | Results |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#answerinlinequery)|

### createNewStickerSet

Use this method to create new sticker set owned by a user.

`telegram.createNewStickerSet(ownerId, name, title, stickerData, isMasks) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| ownerId | `string` | User identifier of sticker set owner |
| name | `string` | Sticker set name |
| title | `string` | Sticker set title |
| stickerData | `Object` | Sticker data({png_sticker: 'stiker file', emojis: '😉', mask__position: '' }) |
| [isMasks] | `bool` | Pass True, if a set of mask stickers should be created |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#createnewstickerset)</sub>

### deleteMessage

Use this method to delete bot messages.

`telegram.deleteMessage(chatId, messageId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `string` | Message id |

### deleteStickerFromSet

Use this method to delete a sticker from a set created by the bot.

`telegram.deleteStickerFromSet(stickerId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| stickerId | |`string` | File identifier of the sticker |

### editMessageCaption

Use this method to edit captions of messages sent by the bot or via the bot.

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

<sub>[Telegram api docs](https://core.telegram.org/bots/api#getchat)</sub>

### getChatAdministrators

Use this method to get a list of administrators in a chat. On success, returns an Array of ChatMember objects that contains information about all chat administrators except other bots. If the chat is a group or a supergroup and no administrators were appointed, only the creator will be returned.

`telegram.getChatAdministrators(chatId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#getchatadministrators)</sub>


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

<sub>[Telegram api docs](https://core.telegram.org/bots/api#setgamescore)</sub>

### getGameHighScores

Use this method to get data for high score tables. Will return the score of the specified user and several of his neighbors in a game. On success, returns an Array of GameHighScore objects.

`telegram.getGameHighScores(userId, inlineMessageId, chatId, messageId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| userId | `number`\ | Target User id |
| inlineMessageId | `string` | Inline message id(optional) |
| chatId | `number`\|`string` | Target Chat id(optional) |
| messageId | `number`\|`string` | Message id(optional) |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#getgamehighscores)</sub>

### getChatMember

Use this method to get information about a member of a chat.

`telegram.getChatMember(chatId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#getchatmember)</sub>


### getChatMembersCount

Use this method to get the number of members in a chat.

`telegram.getChatMembersCount(chatId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#getchatmemberscount)</sub>

### getFile

Returns basic info about a file and prepare it for downloading.

`telegram.getFile(fileId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string` | File id |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#getfile)</sub>

### getFileLink

Returns link to file.

`telegram.getFileLink(fileId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string`\|`object` | File id or file object |

### getMe

Returns basic information about the bot.

`telegram.getMe() => Promise`

<sub>[Telegram api docs](https://core.telegram.org/bots/api#getme)</sub>

### getStickerSet

Use this method to get a sticker set.

`telegram.getStickerSet(name) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Short name of the sticker set |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#getstickerset)</sub>

### getUserProfilePhotos

Returns profiles photos for provided user.

`telegram.getUserProfilePhotos(userId, offset, limit) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| userId | `number` | Chat id |
| offset | `number` | Offset |
| limit | `number` | Limit |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#getuserprofilephotos)</sub>

### kickChatMember

Use this method to kick a user from a group or a supergroup.

`telegram.kickChatMember(chatId, userId, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| userId | `number` | User id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#kickchatmember)|

<sub>[Telegram api docs](https://core.telegram.org/bots/api#kickchatmember)</sub>

### restrictChatMember

Use this method to restrict a user in a supergroup. 

`telegram.restrictChatMember(chatId, userId, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| userId | `number` | User id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#restrictchatmember)|

<sub>[Telegram api docs](https://core.telegram.org/bots/api#restrictchatmember)</sub>

### promoteChatMember

Use this method to promote or demote a user in a supergroup or a channel.

`telegram.promoteChatMember(chatId, userId, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| userId | `number` | User id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#promotechatmember)|

<sub>[Telegram api docs](https://core.telegram.org/bots/api#promotechatmember)</sub>

### exportChatInviteLink

Use this method to export an invite link to a supergroup or a channel.

`telegram.exportChatInviteLink(chatId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#exportchatinvitelink)</sub>

### setChatPhoto

Use this method to set a new profile photo for the chat.

`telegram.setChatPhoto(chatId, photo) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| photo | `File` | New chat photo |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#setchatphoto)</sub>

### deleteChatPhoto

Use this method to delete a chat photo.

`telegram.deleteChatPhoto(chatId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#deletechatphoto)</sub>

### setChatTitle

Use this method to change the title of a chat.

`telegram.setChatTitle(chatId, title) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| title | `string` | New chat title, 1-255 characters |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#setchattitle)</sub>

### setChatDescription

Use this method to change the description of a supergroup or a channel.

`telegram.setChatDescription(chatId, description) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| description | `string` | New chat description, 0-255 characters |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#setchattitle)</sub>

### pinChatMessage

Use this method to pin a message in a supergroup.

`telegram.pinChatMessage(chatId, messageId, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| messageId | `number` | Message id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#pinchatmessage)|
<sub>[Telegram api docs](https://core.telegram.org/bots/api#pinchatmessage)</sub>

### unpinChatMessage

Use this method to unpin a message in a supergroup chat.

`telegram.unpinChatMessage(chatId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
<sub>[Telegram api docs](https://core.telegram.org/bots/api#unpinchatmessage)</sub>

### leaveChat

Use this method for your bot to leave a group, supergroup or channel.

`telegram.leaveChat(chatId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#leavechat)</sub>

### deleteWebhook

Removes webhook integration.

`telegram.deleteWebhook() => Promise`

<sub>[Telegram api docs](https://core.telegram.org/bots/api#deletewebhook)</sub>

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

### setStickerPositionInSet

Use this method to move a sticker in a set created by the bot to a specific position.

`telegram.setStickerPositionInSet(sticker, position) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| sticker | `string` | File identifier of the sticker |
| position | `number` | New sticker position in the set, zero-based |

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

### sendInvoice

Sends invoice.

`telegram.sendInvoice(chatId, invoice) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| invoice | `File` | [Invoice object](https://core.telegram.org/bots/api#sendinvoice) |

### sendVideo

Sends video.

`telegram.sendVideo(chatId, video, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| video | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvideo)|

### sendVideoNote

Sends round video.

`telegram.sendVideoNote(chatId, video, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| video | `File` | Video note file |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvideonote)|

### sendVoice

Sends voice.

`telegram.sendVoice(chatId, voice, extra) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| voice | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvoice)|


### uploadStickerFile

Use this method to upload a .png file with a sticker for later use in createNewStickerSet and addStickerToSet methods.

`telegram.uploadStickerFile(ownerId, stickerFile) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| ownerId | `string` | User identifier of sticker file owner |
| png_sticker | `File` | Png image with the sticker |

### setWebhook

Specifies an url to receive incoming updates via an outgoing webhook.

`telegram.setWebhook(url, [cert], [maxConnections], [allowedUpdates]) => Promise`

| Param | Type | Description |
| ---  | --- | --- |
| url  | `string` | Public url for webhook |
| [cert] | `File` | SSL public certificate |
| [maxConnections] | `number` | User id |
| [allowedUpdates] | `string[]` | List the types of updates you want your bot to receive |
<sub>[Telegram api docs](https://core.telegram.org/bots/api#setwebhook)</sub>

### unbanChatMember

Use this method to unban a previously kicked user in a supergroup.

`telegram.unbanChatMember(chatId, userId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number`\|`string` | Chat id |
| userId | `number` | User id |

<sub>[Telegram api docs](https://core.telegram.org/bots/api#unbanchatmember)</sub>
