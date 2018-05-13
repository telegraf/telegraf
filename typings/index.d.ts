/// <reference types="node" />

import { IncomingMessage, ServerResponse } from 'http'
import { Agent } from 'https'
import { TlsOptions } from 'tls'

import * as tt from './telegram-types.d'


export interface TelegramOptions {
  /**
   * https.Agent instance, allows custom proxy, certificate, keep alive, etc.
   */
  agent?: Agent

  /**
   * Reply via webhook
   */
  webhookReply?: boolean
}

export interface Context {
  telegram: Telegram
  callbackQuery?: tt.CallbackQuery
  channelPost?: tt.Message
  chat?: tt.Chat
  chosenInlineResult?: tt.ChosenInlineResult
  editedChannelPost?: tt.Message
  editedMessage?: tt.Message
  from?: tt.User
  inlineQuery?: tt.InlineQuery
  me?: string
  message?: tt.IncomingMessage
  preCheckoutQuery?: tt.PreCheckoutQuery
  shippingQuery?: tt.ShippingQuery
}

export interface ContextMessageUpdate extends Context {

  /**
   * Use this method to add a new sticker to a set created by the bot
   * @param ownerId User identifier of sticker set owner
   * @param name Sticker set name
   * @param stickerData Sticker object
   * @param isMasks https://github.com/telegraf/telegraf/blob/87882c42f6c2496576fdb57ca622690205c3e35e/lib/telegram.js#L304
   * @returns Returns True on success.
   */
  addStickerToSet(ownerId: number, name: string, stickerData: tt.StickerData, isMasks: boolean): Promise<boolean>

  /**
   * Use this method to create new sticker set owned by a user. The bot will be able to edit the created sticker set
   * @param ownerId User identifier of created sticker set owner
   * @param name Short name of sticker set, to be used in t.me/addstickers/ URLs (e.g., animals). Can contain only english letters, digits and underscores. Must begin with a letter, can't contain consecutive underscores and must end in “_by_<bot username>”. <bot_username> is case insensitive. 1-64 characters.
   * @param title Sticker set title, 1-64 characters
   * @param stickerData Sticker object
   * @returns Returns True on success.
   */
  createNewStickerSet(ownerId: number, name: string, title: string, stickerData: tt.StickerData): Promise<boolean>

  /**
   * Use this method to delete a chat photo. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @returns True on success
   */
  deleteChatPhoto(): Promise<boolean>

  /**
   * Use this method to delete a sticker from a set created by the bot.
   * @param sticker File identifier of the sticker
   * @returns Returns True on success
   */
  deleteStickerFromSet(sticker: string): Promise<boolean>

  /**
   * Use this method to export an invite link to a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @returns exported invite link as String on success.
   */
  exportChatInviteLink(): Promise<string>

  /**
   * Use this method to get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.)
   * @returns a Chat object on success.
   */
  getChat(): Promise<tt.Chat>

  /**
   * Use this method to get a list of administrators in a chat.
   * @returns On success, returns an Array of ChatMember objects that contains information about all chat administrators except other bots. If the chat is a group or a supergroup and no administrators were appointed, only the creator will be returned.
   */
  getChatAdministrators(): Promise<Array<tt.ChatMember>>

  /**
   * Use this method to get information about a member of a chat.
   * @param userId Unique identifier of the target user
   * @returns a ChatMember object on success
   */
  getChatMember(userId: number): Promise<tt.ChatMember>

  /**
   * Use this method to get the number of members in a chat
   * @returns Number on success
   */
  getChatMembersCount(): Promise<number>

  /**
   * Use this method to get a sticker set
   * @param setName Name of the sticker set
   * @returns On success, a StickerSet object is returned.
   */
  getStickerSet(setName: string): Promise<tt.StickerSet>

  /**
   * Use this method for your bot to leave a group, supergroup or channel
   * @returns True on success
   */
  leaveChat(): Promise<boolean>

  /**
   * Use this method to pin a message in a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights
   * @param messageId Identifier of a message to pin
   * @param extra Pass `{ disable_notification: true }`, if it is not necessary to send a notification to all group members about the new pinned message
   * @returns True on success
   */
  pinChatMessage(messageId: number, extra?: { disable_notification?: boolean }): Promise<boolean>

  /**
   * Use this method to reply on messages in the same chat.
   * @param text Text of the message to be sent
   * @param extra SendMessage additional params
   * @returns sent Message if Success
   */
  reply(text: string, extra?: tt.ExtraReplyMessage): Promise<tt.Message>

  /**
   * Use this method to send audio files to the same chat, if you want Telegram clients to display them in the music player.
   * Your audio must be in the .mp3 format.
   * Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future.
   * @param audio Audio file to send. Pass a file_id as String to send an audio file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an audio file from the Internet, or upload a new one using multipart/form-data
   * @param extra Audio extra parameters
   * @returns On success, the sent Message is returned.
   */
  replyWithAudio(audio: tt.InputFile, extra?: tt.ExtraAudio): Promise<tt.MessageAudio>

  /**
   * Use this method when you need to tell the user that something is happening on the bot's side.
   * The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status).
   * Choose one, depending on what the user is about to receive:
   * - typing for text messages,
   * - upload_photo for photos,
   * - record_video or upload_video for videos,
   * - record_audio or upload_audio for audio files,
   * - upload_document for general files,
   * - find_location for location data,
   * - record_video_note or upload_video_note for video notes.
   * @param action Type of action to broadcast.
   * @returns True on success
   */
  replyWithChatAction(action: tt.ChatAction): Promise<boolean>

  /**
   * Use this method to send general files. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.
   * @param document File to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data
   * @param extra Additional params for send document
   * @returns a Message on success
   */
  replyWithDocument(document: tt.InputFile, extra?: tt.ExtraDocument): Promise<tt.MessageDocument>

  /**
   * Use this method to send a game
   * @param gameShortName Short name of the game, serves as the unique identifier for the game. Set up your games via Botfather.
   * @param extra Additional params for send game
   * @returns a Message on success
   */
  replyWithGame(gameShortName: string, extra?: tt.ExtraGame): Promise<tt.MessageGame>

  /**
   * The Bot API supports basic formatting for messages
   * @param html You can use bold and italic text, as well as inline links and pre-formatted code in your bots' messages.
   * @param extra Additional params to send message
   * @returns a Message on success
   */
  replyWithHTML(html: string, extra?: tt.ExtraEditMessage): Promise<tt.Message>

  /**
   * Use this method to send invoices
   * @param invoice Object with new invoice params
   * @param extra Additional params for send invoice
   * @returns a Message on success
   */
  replyWithInvoice(invoice: tt.NewInvoiceParams, extra?: tt.ExtraInvoice): Promise<tt.MessageInvoice>

  /**
   * Use this method to send point on the map
   * @param latitude Latitude of location
   * @param longitude Longitude of location
   * @param extra Additional params for send location
   * @returns a Message on success
   */
  replyWithLocation(latitude: number, longitude: number, extra?: tt.ExtraLocation): Promise<tt.MessageLocation>

  /**
   * The Bot API supports basic formatting for messages
   * @param markdown You can use bold and italic text, as well as inline links and pre-formatted code in your bots' messages.
   * @param extra Additional params to send message
   * @returns a Message on success
   */
  replyWithMarkdown(markdown: string, extra?: tt.ExtraEditMessage): Promise<tt.Message>

  /**
   * Use this method to send photos
   * @param photo Photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a photo from the Internet, or upload a new photo using multipart/form-data
   * @param extra Additional params to send photo
   * @returns a Message on success
   */
  replyWithPhoto(photo: tt.InputFile, extra?: tt.ExtraPhoto): Promise<tt.MessagePhoto>

  /**
   * Use this method to send .webp stickers
   * @param sticker Sticker to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a .webp file from the Internet, or upload a new one using multipart/form-data
   * @param extra Additional params to send sticker
   * @returns a Message on success
   */
  replyWithSticker(sticker: tt.InputFile, extra?: tt.ExtraSticker): Promise<tt.MessageSticker>

  /**
   * Use this method to send video files, Telegram clients support mp4 videos (other formats may be sent as Document)
   * Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.
   * @param video video to send. Pass a file_id as String to send a video that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a video from the Internet, or upload a new video using multipart/form-data
   * @param extra Additional params to send video
   * @returns a Message on success
   */
  replyWithVideo(video: tt.InputFile, extra?: tt.ExtraVideo): Promise<tt.MessageVideo>


  // ------------------------------------------------------------------------------------------ //
  // ------------------------------------------------------------------------------------------ //
  // ------------------------------------------------------------------------------------------ //


  /**
   * Use this method to send answers to an inline query. On success, True is returned.
   * No more than 50 results per query are allowed.
   * @param results Array of results for the inline query
   * @param extra Extra optional parameters
   */
  answerInlineQuery(results: tt.InlineQueryResult[], extra?: tt.ExtraAnswerInlineQuery): Promise<boolean>

  /**
   * Use this method to send answers to callback queries.
   * @param text Notification text
   * @param url Game url
   * @param showAlert Show alert instead of notification
   * @param cacheTime The maximum amount of time in seconds that the result of the callback query may be cached client-side. Telegram apps will support caching starting in version 3.14. Defaults to 0.
   */
  answerCallbackQuery(text?: string, url?: string, showAlert?: boolean, cacheTime?: number): Promise<boolean>

  /**
   * Use this method to send answers to game query.
   * @param url Notification text
   */
  answerGameQuery(url: string): Promise<boolean>

  /**
   * If you sent an invoice requesting a shipping address and the parameter is_flexible was specified, the Bot API will send an Update with a shipping_query field to the bot. Use this method to reply to shipping queries. On success, True is returned.
   * @param ok  Specify True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible)
   * @param shippingOptions Required if ok is True. A JSON-serialized array of available shipping options.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains why it is impossible to complete the order (e.g. "Sorry, delivery to your desired address is unavailable'). Telegram will display this message to the user.
   */
  answerShippingQuery(ok: boolean, shippingOptions: tt.ShippingOption[], errorMessage: string): Promise<boolean>

  /**
   * Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query. Use this method to respond to such pre-checkout queries. On success, True is returned. Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.
   * @param ok  Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains the reason for failure to proceed with the checkout (e.g. "Sorry, somebody just bought the last of our amazing black T-shirts while you were busy filling out your payment details. Please choose a different color or garment!"). Telegram will display this message to the user.
   */
  answerPreCheckoutQuery(ok: boolean, errorMessage?: string): Promise<boolean>

  /**
   * Use this method to send answers to an inline query.
   * No more than 50 results per query are allowed.
   * @returns On success, True is returned.
   * @param results Array of results for the inline query
   * @param extra Extra optional parameters
   */
  answerInlineQuery(results: tt.InlineQueryResult[], extra?: tt.ExtraAnswerInlineQuery): Promise<boolean>

  /**
   * Use this method to edit text and game messages sent by the bot or via the bot (for inline bots).
   * @returns On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param text New text of the message
   * @param extra Extra params
   */
  editMessageText(text: string, extra?: tt.ExtraEditMessage): Promise<boolean>

  /**
   * Use this method to edit captions of messages sent by the bot or via the bot (for inline bots).
   * On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param caption New caption of the message
   * @param markup Markup of inline keyboard
   */
  editMessageCaption(caption?: string, markup?: tt.InlineKeyboardMarkup): Promise<tt.Message | boolean>

  /**
   * Use this method to edit only the reply markup of messages sent by the bot or via the bot (for inline bots).
   * @returns On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param markup Markup of inline keyboard
   */
  editMessageReplyMarkup(markup?: tt.InlineKeyboardMarkup): Promise<tt.Message | boolean>

  /**
   * Use this method to delete a message, including service messages, with the following limitations:
   * - A message can only be deleted if it was sent less than 48 hours ago.
   * - Bots can delete outgoing messages in groups and supergroups.
   * - Bots granted can_post_messages permissions can delete outgoing messages in channels.
   * - If the bot is an administrator of a group, it can delete any message there.
   * - If the bot has can_delete_messages permission in a supergroup or a channel, it can delete any message there.
   * @returns Returns True on success.
   */
  deleteMessage(): Promise<boolean>

  /**
   * Use this method to upload a .png file with a sticker for later use in createNewStickerSet and addStickerToSet methods (can be used multiple times)
   * https://core.telegram.org/bots/api#sending-files
   * @param ownerId User identifier of sticker file owner
   * @param stickerFile Png image with the sticker, must be up to 512 kilobytes in size, dimensions must not exceed 512px, and either width or height must be exactly 512px.
   * @returns Returns the uploaded File on success
   */
  uploadStickerFile(ownerId: number, stickerFile: tt.InputFile): Promise<tt.File>

  /**
   * Use this method to move a sticker in a set created by the bot to a specific position
   * @param sticker File identifier of the sticker
   * @param position New sticker position in the set, zero-based
   * @returns Returns True on success.
   */
  setStickerPositionInSet(sticker: string, position: number): Promise<boolean>

}

export interface Middleware<C extends ContextMessageUpdate> {
  (ctx: C, next?: () => any): any
}

export type HearsTriggers = string[] | string | RegExp | RegExp[] | Function

export class Telegram {
  /**
   * Use this property to control reply via webhook feature.
   */
  public webkhookReply: boolean

  /**
   * Initialize new Telegram app.
   * @param token Bot token
   * @param options Telegram options
   */
  constructor(token: string, options: TelegramOptions)


  /**
   * Use this method to send answers to callback queries.
   * @param callbackQueryId Query id
   * @param text Notification text
   * @param url Game url
   * @param showAlert Show alert instead of notification
   * @param cacheTime The maximum amount of time in seconds that the result of the callback query may be cached client-side. Telegram apps will support caching starting in version 3.14. Defaults to 0.
   */
  answerCallbackQuery(callbackQueryId: string, text?: string, url?: string, showAlert?: boolean, cacheTime?: number): Promise<boolean>

  /**
   * Use this method to send answers to game query.
   * @param callbackQueryId Query id
   * @param url Notification text
   */
  answerGameQuery(callbackQueryId: string, url: string): Promise<boolean>

  /**
   * If you sent an invoice requesting a shipping address and the parameter is_flexible was specified,
   * the Bot API will send an Update with a shipping_query field to the bot.
   * Use this method to reply to shipping queries.
   * On success, True is returned.
   * @param shippingQueryId Unique identifier for the query to be answered
   * @param ok  Specify True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible)
   * @param shippingOptions Required if ok is True. A JSON-serialized array of available shipping options.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains why it is impossible to complete the order (e.g. "Sorry, delivery to your desired address is unavailable'). Telegram will display this message to the user.
   */
  answerShippingQuery(shippingQueryId: string, ok: boolean, shippingOptions: Array<tt.ShippingOption>, errorMessage: string): Promise<boolean>

  /**
   * Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query.
   * Use this method to respond to such pre-checkout queries. On success, True is returned.
   * Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.
   * @param preCheckoutQueryId  Unique identifier for the query to be answered
   * @param ok  Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains the reason for failure to proceed with the checkout (e.g. "Sorry, somebody just bought the last of our amazing black T-shirts while you were busy filling out your payment details. Please choose a different color or garment!"). Telegram will display this message to the user.
   */
  answerPreCheckoutQuery(preCheckoutQueryId: string, ok: boolean, errorMessage?: string): Promise<boolean>

  /**
   * Use this method to send answers to an inline query. On success, True is returned.
   * No more than 50 results per query are allowed.
   * @param inlineQueryId Unique identifier for the answered query
   * @param results Array of results for the inline query
   * @param extra Extra optional parameters
   */
  answerInlineQuery(inlineQueryId: string, results: Array<tt.InlineQueryResult>, extra?: tt.ExtraAnswerInlineQuery): Promise<boolean>

  /**
   * Use this method to edit text and game messages sent by the bot or via the bot (for inline bots).
   * On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param text New text of the message
   * @param extra Extra params
   */
  editMessageText(chatId: number | string | void, messageId: number | void, inlineMessageId: string | void, text: string, extra?: tt.ExtraEditMessage): Promise<tt.Message | boolean>

  /**
   * Use this method to edit captions of messages sent by the bot or via the bot (for inline bots).
   * On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param caption New caption of the message
   * @param markup A JSON-serialized object for an inline keyboard.
   */
  editMessageCaption(chatId?: number | string, messageId?: number, inlineMessageId?: string, caption?: string, markup?: string): Promise<tt.Message | boolean>

  /**
   * Use this method to edit only the reply markup of messages sent by the bot or via the bot (for inline bots).
   * On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param markup A JSON-serialized object for an inline keyboard.
   */
  editMessageReplyMarkup(chatId?: number | string, messageId?: number, inlineMessageId?: string, markup?: string): Promise<tt.Message | boolean>

  /**
   * Use this method to delete a message, including service messages, with the following limitations:
   * - A message can only be deleted if it was sent less than 48 hours ago.
   * - Bots can delete outgoing messages in groups and supergroups.
   * - Bots granted can_post_messages permissions can delete outgoing messages in channels.
   * - If the bot is an administrator of a group, it can delete any message there.
   * - If the bot has can_delete_messages permission in a supergroup or a channel, it can delete any message there.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Identifier of the message to delete
   * @returns Returns True on success.
   */
  deleteMessage(chatId: number | string, messageId: number): Promise<boolean>

  /**
   * Use this method to get a sticker set
   * @param setName Name of the sticker set
   * @returns On success, a StickerSet object is returned.
   */
  getStickerSet(setName: string): Promise<tt.StickerSet>

  /**
   * Use this method to upload a .png file with a sticker for later use in createNewStickerSet and addStickerToSet methods (can be used multiple times)
   * https://core.telegram.org/bots/api#sending-files
   * @param ownerId User identifier of sticker file owner
   * @param stickerFile Png image with the sticker, must be up to 512 kilobytes in size, dimensions must not exceed 512px, and either width or height must be exactly 512px.
   * @returns Returns the uploaded File on success
   */
  uploadStickerFile(ownerId: number, stickerFile: tt.InputFile): Promise<tt.File>

  /**
   * Use this method to create new sticker set owned by a user. The bot will be able to edit the created sticker set
   * @param ownerId User identifier of created sticker set owner
   * @param name Short name of sticker set, to be used in t.me/addstickers/ URLs (e.g., animals). Can contain only english letters, digits and underscores. Must begin with a letter, can't contain consecutive underscores and must end in “_by_<bot username>”. <bot_username> is case insensitive. 1-64 characters.
   * @param title Sticker set title, 1-64 characters
   * @param stickerData Sticker object
   * @returns Returns True on success.
   */
  createNewStickerSet(ownerId: number, name: string, title: string, stickerData: tt.StickerData): Promise<boolean>

  /**
   * Use this method to add a new sticker to a set created by the bot
   * @param ownerId User identifier of sticker set owner
   * @param name Sticker set name
   * @param stickerData Sticker object
   * @param isMasks https://github.com/telegraf/telegraf/blob/87882c42f6c2496576fdb57ca622690205c3e35e/lib/telegram.js#L304
   * @returns Returns True on success.
   */
  addStickerToSet(ownerId: number, name: string, stickerData: tt.StickerData, isMasks: boolean): Promise<boolean>

  /**
   * Use this method to move a sticker in a set created by the bot to a specific position
   * @param sticker File identifier of the sticker
   * @param position New sticker position in the set, zero-based
   * @returns Returns True on success.
   */
  setStickerPositionInSet(sticker: string, position: number): Promise<boolean>

  /**
   * Use this method to delete a sticker from a set created by the bot.
   * @param sticker File identifier of the sticker
   * @returns Returns True on success
   */
  deleteStickerFromSet(sticker: string): Promise<boolean>

  /**
   * Use this method to send copy of exists message.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param message Received message object
   * @param extra Specified params for message
   * @returns On success, the sent Message is returned.
   */
  sendCopy(chatId: number | string, message?: tt.Message, extra?: object): Promise<tt.Message>

  /**
   * Use this method to delete a chat photo. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @returns True on success
   */
  deleteChatPhoto(chatId: number | string): Promise<boolean>

  /**
   * Use this method to export an invite link to a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @returns exported invite link as String on success.
   */
  exportChatInviteLink(chatId: number | string): Promise<string>

  /**
   * Use this method to get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.)
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @returns a Chat object on success.
   */
  getChat(chatId: number | string): Promise<tt.Chat>

  /**
   * Use this method to get a list of administrators in a chat.
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @returns On success, returns an Array of ChatMember objects that contains information about all chat administrators except other bots. If the chat is a group or a supergroup and no administrators were appointed, only the creator will be returned.
   */
  getChatAdministrators(chatId: number | string): Promise<Array<tt.ChatMember>>

  /**
   * Use this method to get information about a member of a chat.
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @param userId Unique identifier of the target user
   * @returns a ChatMember object on success
   */
  getChatMember(chatId: string | number, userId: number): Promise<tt.ChatMember>

  /**
   * Use this method to get the number of members in a chat
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @returns Number on success
   */
  getChatMembersCount(chatId: string | number): Promise<number>

  /**
   * Use this method for your bot to leave a group, supergroup or channel
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @returns True on success
   */
  leaveChat(chatId: number | string): Promise<boolean>

  /**
   * Use this method to pin a message in a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   * @param messageId Identifier of a message to pin
   * @param extra Pass `{ disable_notification: true }`, if it is not necessary to send a notification to all group members about the new pinned message
   * @returns True on success
   */
  pinChatMessage(chatId: number | string, messageId: number, extra?: { disable_notification?: boolean }): Promise<boolean>

  /**
   * Use this method to send text messages
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param text Text of the message to be sent
   * @param extra SendMessage additional params
   * @returns sent Message if Success
   */
  sendMessage(chatId: number | string, text: string, extra?: tt.ExtraReplyMessage): Promise<tt.Message>

  /**
   * Use this method to send audio files, if you want Telegram clients to display them in the music player.
   * Your audio must be in the .mp3 format.
   * Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param audio Audio file to send. Pass a file_id as String to send an audio file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an audio file from the Internet, or upload a new one using multipart/form-data
   * @param extra Audio extra parameters
   * @returns On success, the sent Message is returned.
   */
  sendAudio(chatId: number | string, audio: tt.InputFile, extra?: tt.ExtraAudio): Promise<tt.MessageAudio>

  /**
   * Use this method when you need to tell the user that something is happening on the bot's side.
   * The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status).
   * Choose one, depending on what the user is about to receive:
   * - typing for text messages,
   * - upload_photo for photos,
   * - record_video or upload_video for videos,
   * - record_audio or upload_audio for audio files,
   * - upload_document for general files,
   * - find_location for location data,
   * - record_video_note or upload_video_note for video notes.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param action Type of action to broadcast.
   * @returns True on success
   */
  sendChatAction(chatId: number | string, action: tt.ChatAction): Promise<boolean>

  /**
   * Use this method to send general files. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param document File to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data
   * @param extra Additional params for send document
   * @returns a Message on success
   */
  sendDocument(chatId: number | string, document: tt.InputFile, extra?: tt.ExtraDocument): Promise<tt.MessageDocument>

  /**
   * Use this method to send a game
   * @param chatId Unique identifier for the target chat
   * @param gameShortName Short name of the game, serves as the unique identifier for the game. Set up your games via Botfather.
   * @param extra Additional params for send game
   * @returns a Message on success
   */
  sendGame(chatId: number | string, gameShortName: string, extra?: tt.ExtraGame): Promise<tt.MessageGame>

  /**
   * Use this method to send invoices
   * @param chatId Unique identifier for the target private chat
   * @param invoice Object with new invoice params
   * @param extra Additional params for send invoice
   * @returns a Message on success
   */
  sendInvoice(chatId: number, invoice: tt.NewInvoiceParams, extra?: tt.ExtraInvoice): Promise<tt.MessageInvoice>

  /**
   * Use this method to send point on the map
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param latitude Latitude of location
   * @param longitude Longitude of location
   * @param extra Additional params for send location
   * @returns a Message on success
   */
  sendLocation(chatId: number | string, latitude: number, longitude: number, extra?: tt.ExtraLocation): Promise<tt.MessageLocation>

  /**
   * Use this method to send photos
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param photo Photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a photo from the Internet, or upload a new photo using multipart/form-data
   * @param extra Additional params to send photo
   * @returns a Message on success
   */
  sendPhoto(chatId: number | string, photo: tt.InputFile, extra?: tt.ExtraPhoto): Promise<tt.MessagePhoto>

  /**
   * Use this method to send .webp stickers
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param sticker Sticker to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a .webp file from the Internet, or upload a new one using multipart/form-data
   * @param extra Additional params to send sticker
   * @returns a Message on success
   */
  sendSticker(chatId: number | string, sticker: tt.InputFile, extra?: tt.ExtraSticker): Promise<tt.MessageSticker>

  /**
   * Use this method to send video files, Telegram clients support mp4 videos (other formats may be sent as Document)
   * Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param video video to send. Pass a file_id as String to send a video that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a video from the Internet, or upload a new video using multipart/form-data
   * @param extra Additional params to send video
   * @returns a Message on success
   */
  sendVideo(chatId: number | string, video: tt.InputFile, extra?: tt.ExtraVideo): Promise<tt.MessageVideo>
}


export interface TelegrafOptions {
  /**
   * Telegram options
   */
  telegram?: TelegramOptions

  /**
   * Bot username
   */
  username?: string
}

export class Composer<C extends ContextMessageUpdate> {

  constructor(...middlewares: Array<Middleware<C>>)

  /**
   * Registers a middleware.
   * @param middleware Middleware function
   */
  use(middleware: Middleware<C>, ...middlewares: Array<Middleware<C>>): Telegraf<C>

  /**
   * Registers middleware for provided update type.
   * @param updateTypes Update type
   * @param middlewares Middleware functions
   */
  on(updateTypes: tt.UpdateType | tt.UpdateType[] | tt.MessageSubTypes | tt.MessageSubTypes[], middleware: Middleware<C>, ...middlewares: Array<Middleware<C>>): Composer<C>

  /**
   * Registers middleware for handling text messages.
   * @param triggers Triggers
   * @param middlewares Middleware functions
   */
  hears(triggers: HearsTriggers, middleware: Middleware<C>, ...middlewares: Array<Middleware<C>>): Composer<C>

  /**
   * Command handling.
   * @param command Commands
   * @param middlwares Middleware functions
   */
  command(command: string | string[], middleware: Middleware<C>, ...middlewares: Array<Middleware<C>>): Composer<C>

  /**
   * Registers middleware for handling callback_data actions with game query.
   * @param middlewares Middleware functions
   */
  gameQuery(middleware: Middleware<C>, ...middlewares: Array<Middleware<C>>): Composer<C>

  /**
   * Registers middleware for handling callback_data actions on start.
   * @param middlewares Middleware functions
   */
  start(middleware: Middleware<C>, ...middlewares: Array<Middleware<C>>): Composer<C>

  /**
   * Compose middlewares returning a fully valid middleware comprised of all those which are passed.
   * @param middlewares Array of middlewares functions
   */
  static compose<R extends ContextMessageUpdate>(middlewares: Array<Middleware<any>>): Middleware<R>

  /**
   * Generates middleware for handling provided update types.
   * @param updateTypes Update type
   * @param middleware Middleware function
   */
  static mount<C extends ContextMessageUpdate, R extends ContextMessageUpdate>
    (updateTypes: tt.UpdateType | tt.UpdateType[], middleware: Middleware<C>): Middleware<R>

  /**
   * Generates middleware for handling text messages with regular expressions.
   * @param triggers Triggers
   * @param handler Handler
   */
  static hears<C extends ContextMessageUpdate, R extends ContextMessageUpdate>
    (triggers: HearsTriggers, handler: Middleware<C>): Middleware<R>

  /**
   * Generates middleware for handling callbackQuery data with regular expressions.
   * @param triggers Triggers
   * @param handler Handler
   */
  static action<C extends ContextMessageUpdate, R extends ContextMessageUpdate>
    (triggers: HearsTriggers, handler: Middleware<C>): Middleware<R>

  /**
   * Generates pass thru middleware.
   */
  static passThru<C extends ContextMessageUpdate>(): Middleware<C>

  /**
   * Generates safe version of pass thru middleware.
   */
  static safePassThru<C extends ContextMessageUpdate>(): Middleware<C>

  /**
   * Generates optional middleware.
   * @param test Value or predicate (ctx) => bool
   * @param middleware Middleware function
   */
  static optional<C extends ContextMessageUpdate, R extends ContextMessageUpdate>
    (test: boolean | ((ctx: C) => boolean), middleware: Middleware<C>): Middleware<R>

  /**
   * Generates filter middleware.
   * @param test  Value or predicate (ctx) => bool
   */
  static filter<C extends ContextMessageUpdate>
    (test: boolean | ((ctx: C) => boolean)): Middleware<C>

  /**
   * Generates branch middleware.
   * @param test Value or predicate (ctx) => bool
   * @param trueMiddleware true action middleware
   * @param falseMiddleware false action middleware
   */
  static branch<C extends ContextMessageUpdate, T extends ContextMessageUpdate, F extends ContextMessageUpdate, R extends ContextMessageUpdate>
    (test: boolean | ((ctx: C) => boolean), trueMiddleware: Middleware<T>, falseMiddleware: Middleware<F>): Middleware<R>

  static reply<C extends ContextMessageUpdate>(text: string, extra?: tt.ExtraReplyMessage): Middleware<C>
}


export class Telegraf<C extends ContextMessageUpdate> extends Composer<C> {
  /**
   * Use this property to get/set bot token
   */
  public token: string

  /**
   * Use this property to control reply via webhook feature.
   */
  public webhookReply: boolean

  /**
   * Initialize new Telegraf app.
   * @param token Bot token
   * @param options options
   * @example
   * new Telegraf(token, options)
   */
  constructor(token: string, options?: TelegrafOptions)

  /**
   * Start poll updates.
   * @param timeout Poll timeout in seconds
   * @param limit Limits the number of updates to be retrieved
   * @param allowedUpdates List the types of updates you want your bot to receive
   */
  startPolling(timeout?: number, limit?: number, allowedUpdates?: tt.UpdateType[]): Telegraf<C>

  /**
   * Start listening @ https://host:port/webhookPath for Telegram calls.
   * @param webhookPath Webhook url path (see Telegraf.setWebhook)
   * @param tlsOptions TLS server options. Pass null to use http
   * @param port Port number
   * @param host Hostname
   */
  startWebhook(webhookPath: string, tlsOptions: TlsOptions, port: number, host?: string): Telegraf<C>

  /**
   * Stop Webhook and polling
   */
  stop(): Telegraf<C>

  /**
   * Return a callback function suitable for the http[s].createServer() method to handle a request.
   * You may also use this callback function to mount your telegraf app in a Koa/Connect/Express app.
   * @param webhookPath Webhook url path (see Telegraf.setWebhook)
   */
  webhookCallback(webhookPath: string): (req: IncomingMessage, res: ServerResponse) => void

  /**
   * Handle raw Telegram update. In case you use centralized webhook server, queue, etc.
   * @param rawUpdate Telegram update payload
   * @param webhookResponse http.ServerResponse
   */
  handleUpdate(rawUpdate: tt.Update, webhookResponse?: ServerResponse): Promise<any>
}


export default Telegraf
