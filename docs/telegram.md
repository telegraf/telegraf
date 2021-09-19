# Telegram

Telegram client API reference.

```js
const Telegram = require('telegraf/telegram')
```

## Constructor

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

## webhookReply

Use this property to control `reply via webhook` feature.

`telegram.webhookReply = [bool]`

## addStickerToSet

Use this method to add a new sticker to a set created by the bot.

`telegram.addStickerToSet(ownerId, name, stickerData) => Promise`
[Official documentation](https://core.telegram.org/bots/api#addstickertoset)

| Param | Type | Description |
| --- | --- | --- |
| ownerId | `string` | User identifier of sticker set owner |
| name | `string` | Sticker set name |
| stickerData | `Object` | Sticker data({png_sticker: 'stiker file', emojis: '😉', mask__position: '' }) |

## answerCbQuery

Use this method to send answers to callback queries.

`telegram.answerCbQuery(callbackQueryId, text, [showAlert], [extra]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#answercallbackquery)

| Param | Type | Description |
| --- | --- | --- |
| callbackQueryId | `string` | Query id |
| [text] | `string` | Notification text |
| [showAlert] | `bool` | Show alert instead of notification |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#answercallbackquery) |

## answerGameQuery

Use this method to send answers to game query.

`telegram.answerGameQuery(callbackQueryId, url) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| callbackQueryId | `string` | Query id |
| url | `string` | Notification text |

## answerShippingQuery

Use this method to send answers to shipping query.

`telegram.answerShippingQuery(shippingQueryId, ok, shippingOptions, [errorMessage]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| shippingQueryId | `string` | Shipping Query id |
| ok | `bool` | Specify True if delivery to the specified address is possible |
| shippingOptions | `object` | [Shipping Options](https://core.telegram.org/bots/api#answershippingquery) |
| [errorMessage] | `string` | Error message in human readable form  |

## answerPreCheckoutQuery

Use this method to send answers to shipping query.

`telegram.answerPreCheckoutQuery(preCheckoutQueryId, ok, [errorMessage]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| preCheckoutQueryId | `string` | Shipping Query id |
| ok | `bool` | Specify True if everything is alright (goods are available, etc.) |
| [errorMessage] | `string` | Error message in human readable form  |

## answerInlineQuery

Use this method to send answers to an inline query.

`telegram.answerInlineQuery(inlineQueryId, results, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| inlineQueryId | `string` | Query id |
| results | `object[]` | Results |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#answerinlinequery)|

## createNewStickerSet

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

## deleteChatStickerSet

Use this method to delete a group sticker set from a supergroup.

`telegram.deleteChatStickerSet(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#deletechatstickerset)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

## deleteMessage

Use this method to delete bot messages.

`telegram.deleteMessage(chatId, messageId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#deletemessage)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |

## deleteMyCommands

Use this method to delete the list of the bot's commands for the given scope and user language.

`telegram.deleteMyCommands([extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#deletemycommands) |

## setStickerSetThumb

Use this method to set the thumbnail of a sticker set.

`telegram.setStickerSetThumb(name, userId, [thumb]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setstickersetthumb)

| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Sticker set name |
| userId | `string` | User identifier of the sticker set owner |
| thumb | `File` | A PNG image with the thumbnail, must be up to 128 kilobytes in size and have width and height exactly 100px, or a TGS animation with the thumbnail up to 32 kilobytes in size |

## deleteStickerFromSet

Use this method to delete a sticker from a set created by the bot.

`telegram.deleteStickerFromSet(stickerId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#deletestickerfromset)

| Param | Type | Description |
| --- | --- | --- |
| stickerId | `string` | File identifier of the sticker |

## editMessageCaption

Use this method to edit captions of messages sent by the bot or via the bot.

`telegram.editMessageCaption(chatId, messageId, inlineMessageId, caption, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| caption | `string` | Caption |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagecaption)|

## editMessageMedia

Use this method to edit media of messages sent by the bot or via the bot.

`telegram.editMessageMedia(chatId, messageId, inlineMessageId, media, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| media | `InputMedia` | [InputMedia](https://core.telegram.org/bots/api#inputmedia) |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagemedia)|

## editMessageLiveLocation

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
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagelivelocation)|

## editMessageReplyMarkup

Use this method to edit only the reply markup of messages sent by the bot or via the bot.

`telegram.editMessageReplyMarkup(chatId, messageId, inlineMessageId, markup, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| markup | `object` | Keyboard markup |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagereplymarkup)|

## editMessageText

Use this method to edit text messages sent by the bot or via the bot.

`telegram.editMessageText(chatId, messageId, inlineMessageId, text, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| text | `string` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editmessagetext)|

## forwardMessage

Forwards message.

`telegram.forwardMessage(chatId, fromChatId, messageId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Target Chat id |
| fromChatId | `number/string` | Source Chat id |
| messageId | `number` | Message id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#forwardmessage)|

## sendCopy

Sends message copy.

`telegram.sendCopy(chatId, message, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Target Chat id |
| message | `object` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendmessage)|

## copyMessage

Use this method to copy messages of any kind.

`telegram.copyMessage(chatId, message, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Target Chat id |
| fromChatId | `number/string` | Source Chat id |
| messageId | `number` | Message id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#copymessage)|

## getWebhookInfo

Use this method to get current webhook status. Requires no parameters. On success, returns a WebhookInfo object. If the bot is using getUpdates, will return an object with the url field empty.

`telegram.getWebhookInfo() => Promise`

## getChat

Use this method to get up to date information about the chat (current name of the user for one-on-one conversatio
ns, current username of a user, group or channel, etc.).

`telegram.getChat(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getchat)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

## getChatAdministrators

Use this method to get a list of administrators in a chat. On success, returns an Array of ChatMember objects that contains information about all chat administrators except other bots. If the chat is a group or a supergroup and no administrators were appointed, only the creator will be returned.

`telegram.getChatAdministrators(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getchatadministrators)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

## setGameScore

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

## getGameHighScores

Use this method to get data for high score tables. Will return the score of the specified user and several of his neighbors in a game. On success, returns an Array of GameHighScore objects.

`telegram.getGameHighScores(userId, inlineMessageId, chatId, messageId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getgamehighscores)

| Param | Type | Description |
| --- | --- | --- |
| userId | `number`\ | Target User id |
| inlineMessageId | `string` | Inline message id |
| chatId | `number/string` | Target Chat id |
| messageId | `number/string` | Message id |

## getChatMember

Use this method to get information about a member of a chat.

`telegram.getChatMember(chatId, userId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getchatmember)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| userId | `number` |   User identifier |

## getChatMemberCount

Use this method to get the number of members in a chat.

`telegram.getChatMemberCount(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getchatmembercount)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

## getFile

Returns basic info about a file and prepare it for downloading.

`telegram.getFile(fileId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getfile)

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string` | File id |

## getFileLink

Returns link to file.

`telegram.getFileLink(fileId) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| fileId | `string/object` | File id or file object |

## getMe

Returns basic information about the bot.

`telegram.getMe() => Promise`
[Official documentation](https://core.telegram.org/bots/api#getme)

## getMyCommands

Use this method to get the current list of the bot's commands for the given scope and user language.

`telegram.getMyCommands([extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#getmycommands) |

## getStickerSet

Use this method to get a sticker set.

`telegram.getStickerSet(name) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Short name of the sticker set |
[Official documentation](https://core.telegram.org/bots/api#getstickerset)

## getUserProfilePhotos

Returns profiles photos for provided user.

`telegram.getUserProfilePhotos(userId, [offset], [limit]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#getuserprofilephotos)

| Param | Type | Description |
| --- | --- | --- |
| userId | `number` | Chat id |
| [offset] | `number` | Offset |
| [limit] | `number` | Limit |

## setChatPermissions

Use this method to set default chat permissions for all members.

`telegram.setChatPermissions(chatId, permissions) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| permissions | `object` | [New default chat permissions](https://core.telegram.org/bots/api#chatpermissions)|

## banChatMember

Use this method to ban a user in a group, a supergroup or a channel.

`telegram.banChatMember(chatId, userId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| userId | `number` | User id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#banchatmember)|

## restrictChatMember

Use this method to restrict a user in a supergroup.

`telegram.restrictChatMember(chatId, userId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| userId | `number` | User id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#restrictchatmember)|

## promoteChatMember

Use this method to promote or demote a user in a supergroup or a channel.

`telegram.promoteChatMember(chatId, userId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| userId | `number` | User id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#promotechatmember)|

## setChatAdministratorCustomTitle

New custom title for the administrator; 0-16 characters, emoji are not allowed

`telegram.setChatAdministratorCustomTitle(chatId, userId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| userId | `number` | User id |
| title | `string` | Custom title |

## exportChatInviteLink

Use this method to export an invite link to a supergroup or a channel.

`telegram.exportChatInviteLink(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#exportchatinvitelink)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

## createChatInviteLink

Use this method to create an additional invite link for a chat.

`telegram.createChatInviteLink(chatId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#createchatinvitelink) |

## editChatInviteLink

Use this method to edit a non-primary invite link created by the bot.

`telegram.editChatInviteLink(chatId, inviteLink, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| inviteLink | `string` | The invite link to edit |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#editchatinvitelink) |

## revokeChatInviteLink

Use this method to revoke an invite link created by the bot.

`telegram.revokeChatInviteLink(chatId, inviteLink) => Promise`
[Official documentation](https://core.telegram.org/bots/api#revokechatinvitelink)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| inviteLink | `string` | The invite link to revoke |

## setChatPhoto

Use this method to set a new profile photo for the chat.

`telegram.setChatPhoto(chatId, photo) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setchatphoto)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| photo | `File` | New chat photo |

## deleteChatPhoto

Use this method to delete a chat photo.

`telegram.deleteChatPhoto(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#deletechatphoto)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

## setChatTitle

Use this method to change the title of a chat.

`telegram.setChatTitle(chatId, title) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setchattitle)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| title | `string` | New chat title, 1-255 characters |

## setChatDescription

Use this method to change the description of a supergroup or a channel.

`telegram.setChatDescription(chatId, description) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setchattitle)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| description | `string` | New chat description, 0-255 characters |

## setChatStickerSet

Use this method to set a new group sticker set for a supergroup.

`telegram.setChatStickerSet(chatId, stickerSetName) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setchatstickerset)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| stickerSetName | `string` | Name of the sticker set |

## pinChatMessage

Use this method to pin a message in a supergroup.

`telegram.pinChatMessage(chatId, messageId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `number` | Message id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#pinchatmessage)|

## unpinChatMessage

Use this method to unpin a message in a supergroup chat.

`telegram.unpinChatMessage(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#unpinchatmessage)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#unpinchatmessage)|

## unpinAllChatMessages

Use this method to clear the list of pinned messages in a chat

`telegram.unpinAllChatMessages(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#unpinallchatmessages)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

## leaveChat

Use this method for your bot to leave a group, supergroup or channel.

`telegram.leaveChat(chatId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#leavechat)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |

## deleteWebhook

Removes webhook integration.

`telegram.deleteWebhook() => Promise`
[Official documentation](https://core.telegram.org/bots/api#deletewebhook)

| Param | Type | Description |
| ---  | --- | --- |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#deletewebhook) |

## sendAudio

Sends audio.

`telegram.sendAudio(chatId, audio, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| audio | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendaudio)|

## sendGame

Sends game.

`telegram.sendGame(chatId, gameName, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| gameName | `String` | Game short name |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendgame)|

## sendChatAction

Sends chat action.

`telegram.sendChatAction(chatId, action) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| action | `string` | [Chat action](https://core.telegram.org/bots/api#sendchataction) |

## sendContact

Sends document.

`telegram.sendContact(chatId, phoneNumber, firstName, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| phoneNumber | `string` | Contact phone number |
| firstName | `string` | Contact first name |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendcontact)|

## sendDice

Sends dice.

`telegram.sendDice(chatId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#senddice)|

## sendDocument

Sends document.

`telegram.sendDocument(chatId, doc, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| doc | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#senddocument)|

## sendLocation

Sends location.

`telegram.sendLocation(chatId, latitude, longitude, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| latitude | `number` | Latitude |
| longitude | `number` | Longitude |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendlocation)|

## sendMessage

Sends text message.

`telegram.sendMessage(chatId, text, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| text | `string` | Message |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendmessage)|

## sendPhoto

Sends a photo.

`telegram.sendPhoto(chatId, photo, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| photo | `File` | Photo |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendphoto)|

## sendMediaGroup

Sends media album.

`telegram.sendMediaGroup(chatId, media, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| media | `InputMedia[]` | Media array |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendmediagroup)|

## sendSticker

Sends sticker.

`telegram.sendSticker(chatId, sticker, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| sticker | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendsticker)|

## setStickerPositionInSet

Use this method to move a sticker in a set created by the bot to a specific position.

`telegram.setStickerPositionInSet(sticker, position) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| sticker | `string` | File identifier of the sticker |
| position | `number` | New sticker position in the set, zero-based |

## sendVenue

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

## sendInvoice

Sends invoice.

`telegram.sendInvoice(chatId, invoice) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| invoice | `object` | [Invoice object](https://core.telegram.org/bots/api#sendinvoice) |

## sendVideo

Sends video.

`telegram.sendVideo(chatId, video, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| video | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvideo)|

## sendAnimation

Sends video.

`telegram.sendAnimation(chatId, animation, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| animation | `File` | Document |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendanimation)|

## sendVideoNote

Sends round video.

`telegram.sendVideoNote(chatId, video, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| video | `File` | Video note file |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvideonote)|

## sendVoice

Sends voice.

`telegram.sendVoice(chatId, voice, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| voice | `File/string` | File, file id or HTTP URL |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendvoice)|

## sendPoll

Sends a poll.

`telegram.sendPoll(chatId, question, options, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| question | `string` | Poll question |
| options | `string[]` | Answer options |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendpoll)|

## setMyCommands

Use this method to change the list of the bot's commands

`telegram.setMyCommands(commands, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| commands | `object[]` | [List of bot commands](https://core.telegram.org/bots/api#botcommand) |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#setmycommands) |

## sendQuiz

Sends quiz.

`telegram.sendQuiz(chatId, question, options, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| question | `string` | Poll question |
| options | `string[]` | Answer options |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#sendpoll)|

## stopPoll

Stops anonymous poll.

`telegram.stopPoll(chatId, messageId, [extra]) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Poll message id |
| options| `string[]` | Answer options |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#stoppoll)|

## stopMessageLiveLocation

Use this method to stop updating a live location message sent by the bot or via the bot (for inline bots) before live_period expires.

`telegram.stopMessageLiveLocation(chatId, messageId, inlineMessageId, [markup]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#stopmessagelivelocation)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| messageId | `string` | Message id |
| inlineMessageId | `string` | Inline message id |
| [markup] | `object` | Keyboard markup |

## uploadStickerFile

Use this method to upload a .png file with a sticker for later use in createNewStickerSet and addStickerToSet methods.

`telegram.uploadStickerFile(ownerId, stickerFile) => Promise`
[Official documentation](https://core.telegram.org/bots/api#uploadstickerfile)

| Param | Type | Description |
| --- | --- | --- |
| ownerId | `string` | User identifier of sticker file owner |
| stickerFile | `File` | Png image with the sticker |

## setWebhook

Specifies an url to receive incoming updates via an outgoing webhook.

`telegram.setWebhook(url, [extra]) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setwebhook)

| Param | Type | Description |
| ---  | --- | --- |
| url  | `string` | Public url for webhook |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#setwebhook) |

## unbanChatMember

Use this method to unban a previously banned user in a supergroup or channel.

`telegram.unbanChatMember(chatId, userId) => Promise`
[Official documentation](https://core.telegram.org/bots/api#unbanchatmember)

| Param | Type | Description |
| --- | --- | --- |
| chatId | `number/string` | Chat id |
| userId | `number` | User id |
| [extra] | `object` | [Extra parameters](https://core.telegram.org/bots/api#unbanchatmember) |

## setPassportDataErrors

Informs a user that some Telegram Passport elements they provided contains errors. The user will not be able to re-submit their Passport to you until the errors are fixed (the contents of the field for which you returned the error must change).

`telegram.setPassportDataErrors(errors) => Promise`
[Official documentation](https://core.telegram.org/bots/api#setpassportdataerrors)

| Param | Type | Description |
| ---  | --- | --- |
| [errors] | `PassportElementError[]` | An array describing the errors |
