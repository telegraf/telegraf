/** @format */

import * as tt from './telegram-types.d'

import * as https from 'https'
import * as http from 'http'

export interface TelegramOptions {
  /**
   * https.Agent or http.Agent instance, allows custom proxy, certificate, keep alive, etc.
   */
  agent?: https.Agent | http.Agent

  /**
   * Reply via webhook
   */
  webhookReply?: boolean

  /**
   * Path to API. default: https://api.telegram.org
   */
  apiRoot?: string
}

declare class ApiClient {
  protected constructor(token: string, options: object, webhookResponse: any)

  callApi(method: string, data: object): Promise<unknown>
}

export declare class Telegram extends ApiClient {
  /**
   * Initialize new Telegram app.
   * @param token Bot token
   * @param options Telegram options
   */
  constructor(token: string, options?: TelegramOptions)

  /**
   * Use this property to control reply via webhook feature.
   */
  webhookReply: boolean

  /**
   * Use this method to get basic information about the bot
   * @returns a User object on success.
   */
  getMe(): Promise<tt.User>

  /**
   * Use this method to get basic info about a file and prepare it for downloading
   * @param fileId Id of file to get link to
   * @returns a File object on success
   */
  getFile(fileId: string): Promise<tt.File>

  /**
   * Use this method to get link to a file by file id
   * @param fileId Id of file to get link to
   * @returns a String with an url to the file
   */
  getFileLink(fileId: string): Promise<string>

  /**
   * Use this method to get updates from Telegram server. Bot should be in `polling` mode
   * @returns Array of updates
   */
  getUpdates(): Promise<any[]>

  /**
   * Use this method to get information about set webhook
   * @returns a WebhookInfo on success
   */
  getWebhookInfo(): Promise<tt.WebhookInfo>

  /**
   * Use this method to get data for high score tables.
   * Will return the score of the specified user and several of their neighbors in a game.
   *
   * This method will currently return scores for the target user, plus two of their closest neighbors on each side.
   * Will also return the top three users if the user and his neighbors are not among them.
   * Please note that this behavior is subject to change.
   * @param userId Target user id
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @returns On success, an Array of GameHighScore objects.
   */
  getGameHighScores(
    userId: number,
    inlineMessageId?: string,
    chatId?: number,
    messageId?: number
  ): Promise<tt.GameHighScore[]>

  /**
   * Use this method to set the score of the specified user in a game.
   * @param userId User identifier
   * @param score New score, must be non-negative
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param editMessage Pass `false`, if the game message should not be automatically edited to include the current scoreboard
   * @param force Pass True, if the high score is allowed to decrease. This can be useful when fixing mistakes or banning cheaters
   * @returns On success, if the message was sent by the bot, returns the edited Message, otherwise returns True. Returns an error, if the new score is not greater than the user's current score in the chat and force is False.
   */
  setGameScore(
    userId: number,
    score: number,
    inlineMessageId?: string,
    chatId?: number,
    messageId?: number,
    editMessage?: boolean,
    force?: boolean
  ): Promise<tt.Message | boolean>

  /**
   * Use this method to specify a url and receive incoming updates via an outgoing webhook
   * @param url HTTPS url to send updates to. Use an empty string to remove webhook integration
   * @param extra Additional params to set webhook
   * @returns True on success
   */
  setWebhook(
    url: string,
    extra?: tt.ExtraSetWebhook
  ): Promise<boolean>

  /**
   * Use this method to delete webhook
   * @param extra Additional params to delete webhook
   * @returns True on success
   */
  deleteWebhook(
    extra?: tt.ExtraDeleteWebhook
  ): Promise<boolean>

  /**
   * Use this method to send text messages
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param text Text of the message to be sent
   * @param extra SendMessage additional params
   * @returns sent Message if Success
   */
  sendMessage(
    chatId: number | string,
    text: string,
    extra?: tt.ExtraSendMessage
  ): Promise<tt.Message>

  /**
   * Use this method to forward exists message.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param fromChatId Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername)
   * @param messageId Message identifier in the chat specified in from_chat_id
   * @param extra Pass `{ disable_notification: true }`, if it is not necessary to send a notification for forwarded message
   * @returns On success, the sent Message is returned.
   */
  forwardMessage(
    chatId: number | string,
    fromChatId: number | string,
    messageId: string | number,
    extra?: { disable_notification?: boolean }
  ): Promise<tt.Message>

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
  sendChatAction(
    chatId: number | string,
    action: tt.ChatAction
  ): Promise<boolean>

  /**
   * Use this method to get a list of profile pictures for a user.
   * @param userId
   * @param offset
   * @param limit
   * @returns UserProfilePhotos object
   */
  getUserProfilePhotos(
    userId: number,
    offset?: number,
    limit?: number
  ): Promise<tt.UserProfilePhotos>

  /**
   * Use this method to send point on the map
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param latitude Latitude of location
   * @param longitude Longitude of location
   * @param extra Additional params for send location
   * @returns a Message on success
   */
  sendLocation(
    chatId: number | string,
    latitude: number,
    longitude: number,
    extra?: tt.ExtraLocation
  ): Promise<tt.MessageLocation>

  /**
   * Use this method to send information about a venue
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param latitude Latitude of location
   * @param longitude Longitude of location
   * @param title Name of the venue
   * @param address Address of the venue
   * @param extra Additional params for sendVenue
   * @returns a Message on success
   */
  sendVenue(
    chatId: number | string,
    latitude: number,
    longitude: number,
    title: string,
    address: string,
    extra?: tt.ExtraVenue
  ): Promise<tt.MessageVenue>

  /**
   * Use this method to send invoices
   * @param chatId Unique identifier for the target private chat
   * @param invoice Object with new invoice params
   * @param extra Additional params for send invoice
   * @returns a Message on success
   */
  sendInvoice(
    chatId: number,
    invoice: tt.NewInvoiceParameters,
    extra?: tt.ExtraInvoice
  ): Promise<tt.MessageInvoice>

  /**
   * Use this method to send phone contacts
   * @param chatId Unique identifier for the target private chat
   * @param phoneNumber Contact's phone number
   * @param firstName Contact's first name
   * @param extra Additional params for sendContact
   * @returns a Message on success
   */
  sendContact(
    chatId: number,
    phoneNumber: string,
    firstName: string,
    extra?: tt.ExtraContact
  ): Promise<tt.MessageContact>

  /**
   * Use this method to send photos
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param photo Photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a photo from the Internet, or upload a new photo using multipart/form-data
   * @param extra Additional params to send photo
   * @returns a Message on success
   */
  sendPhoto(
    chatId: number | string,
    photo: tt.InputFile,
    extra?: tt.ExtraPhoto
  ): Promise<tt.MessagePhoto>

  /**
   * Use this method to send a dice, which will have a random value from 1 to 6. On success, the sent Message is returned. (Yes, we're aware of the “proper” singular of die. But it's awkward, and we decided to help it change. One dice at a time!)
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param extra Additional params to send dice
   * @returns a Message on success
   */
  sendDice(
    chatId: number | string,
    extra?: tt.ExtraDice
  ): Promise<tt.MessageDice>

  /**
   * Use this method to send general files. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param document File to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data
   * @param extra Additional params for send document
   * @returns a Message on success
   */
  sendDocument(
    chatId: number | string,
    document: tt.InputFile,
    extra?: tt.ExtraDocument
  ): Promise<tt.MessageDocument>

  /**
   * Use this method to send audio files, if you want Telegram clients to display them in the music player.
   * Your audio must be in the .mp3 format.
   * Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param audio Audio file to send. Pass a file_id as String to send an audio file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an audio file from the Internet, or upload a new one using multipart/form-data
   * @param extra Audio extra parameters
   * @returns On success, the sent Message is returned.
   */
  sendAudio(
    chatId: number | string,
    audio: tt.InputFile,
    extra?: tt.ExtraAudio
  ): Promise<tt.MessageAudio>

  /**
   * Use this method to send .webp stickers
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param sticker Sticker to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a .webp file from the Internet, or upload a new one using multipart/form-data
   * @param extra Additional params to send sticker
   * @returns a Message on success
   */
  sendSticker(
    chatId: number | string,
    sticker: tt.InputFile,
    extra?: tt.ExtraSticker
  ): Promise<tt.MessageSticker>

  /**
   * Use this method to send video files, Telegram clients support mp4 videos (other formats may be sent as Document)
   * Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param video video to send. Pass a file_id as String to send a video that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a video from the Internet, or upload a new video using multipart/form-data
   * @param extra Additional params to send video
   * @returns a Message on success
   */
  sendVideo(
    chatId: number | string,
    video: tt.InputFile,
    extra?: tt.ExtraVideo
  ): Promise<tt.MessageVideo>

  /**
   * Use this method to send .gif animations
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param animation Animation to send. Pass a file_id as String to send a GIF that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a GIF from the Internet, or upload a new GIF using multipart/form-data
   * @param extra Additional params for sendAnimation
   * @returns a Message on success
   */
  sendAnimation(
    chatId: number | string,
    animation: tt.InputFile,
    extra?: tt.ExtraAnimation
  ): Promise<tt.MessageAnimation>

  /**
   * Use this method to send video messages
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param videoNote video note to send. Pass a file_id as String to send a video note that exists on the Telegram servers (recommended) or upload a new video using multipart/form-data. Sending video notes by a URL is currently unsupported
   * @param extra Additional params for sendVideoNote
   * @returns a Message on success
   */
  sendVideoNote(
    chatId: number | string,
    videoNote: tt.InputFileVideoNote,
    extra?: tt.ExtraVideoNote
  ): Promise<tt.MessageVideoNote>

  /**
   * Use this method to send audio files, if you want Telegram clients to display the file as a playable voice message. For this to work, your audio must be in an .ogg file encoded with OPUS (other formats may be sent as Audio or Document). On success, the sent Message is returned. Bots can currently send voice messages of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param voice Audio file to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data
   * @param extra Additional params to send voice
   * @returns a Message on success
   */
  sendVoice(
    chatId: number | string,
    voice: tt.InputFile,
    extra?: tt.ExtraVoice
  ): Promise<tt.MessageVoice>

  /**
   * Use this method to send a game
   * @param chatId Unique identifier for the target chat
   * @param gameShortName Short name of the game, serves as the unique identifier for the game. Set up your games via Botfather.
   * @param extra Additional params for send game
   * @returns a Message on success
   */
  sendGame(
    chatId: number | string,
    gameShortName: string,
    extra?: tt.ExtraGame
  ): Promise<tt.MessageGame>

  /**
   * Use this method to send a group of photos or videos as an album
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param media A JSON-serialized array describing photos and videos to be sent, must include 2–10 items
   * @param extra Additional params to send media group
   * @returns On success, an array of the sent Messages is returned
   */
  sendMediaGroup(
    chatId: number | string,
    media: (tt.InputMediaAudio | tt.InputMediaDocument | tt.InputMediaPhoto | tt.InputMediaVideo)[],
    extra?: tt.ExtraMediaGroup
  ): Promise<Array<tt.Message>>

  /**
   * Use this method to send a native poll.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param question Poll question, 1-300 characters
   * @param options A JSON-serialized list of answer options, 2-10 strings 1-100 characters each
   * @param extra Additional params to send poll
   * @returns On success, the sent Message is returned.
   */
  sendPoll(
    chatId: number | string,
    question: string,
    options: string[],
    extra: tt.ExtraPoll
  ): Promise<tt.MessagePoll>

  /**
   * Use this method to send a native quiz.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param question Poll question, 1-255 characters
   * @param options A JSON-serialized list of answer options, 2-10 strings 1-100 characters each
   * @param extra Additional params to send quiz
   * @returns On success, the sent Message is returned.
   */
  sendQuiz(
    chatId: number | string,
    question: string,
    options: string[],
    extra: tt.ExtraQuiz
  ): Promise<tt.MessagePoll>

  /**
   * Use this method to send a native quiz.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Identifier of the original message with the poll
   * @param extra Additional params to stop poll
   * @returns On success, the stopped Poll with the final results is returned.
   */
  stopPoll(
    chatId: number | string,
    messageId: number,
    extra: tt.ExtraStopPoll
  ): Promise<tt.Poll>

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
   * Use this method to send answers to an inline query. On success, True is returned.
   * No more than 50 results per query are allowed.
   * @param inlineQueryId Unique identifier for the answered query
   * @param results Array of results for the inline query
   * @param extra Extra optional parameters
   */
  answerInlineQuery(
    inlineQueryId: string,
    results: Array<tt.InlineQueryResult>,
    extra?: tt.ExtraAnswerInlineQuery
  ): Promise<boolean>

  /**
   * Use this method to set default chat permissions for all members.
   * The bot must be an administrator in the group or a supergroup for this to work and must have the can_restrict_members admin rights.
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @param permissions New default chat permissions
   * @returns True on success
   */
  setChatPermissions(
    chatId: string | number,
    permissions: tt.ChatPermissions
  ): Promise<boolean>

  /**
   * Use this method to kick a user from a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the group on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights
   * @param chatId Unique identifier for the target group or username of the target supergroup or channel (in the format `@channelusername`)
   * @param userId Unique identifier of the target user
   * @param untilDate Date when the user will be unbanned, unix time. If user is banned for more than 366 days or less than 30 seconds from the current time they are considered to be banned forever
   * @returns True on success
   */
  kickChatMember(
    chatId: number | string,
    userId: number,
    untilDate?: number
  ): Promise<boolean>

  /**
   * Use this method to promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Pass False for all boolean parameters to demote a user.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format `@channelusername`)
   * @param userId Unique identifier of the target user
   * @param extra Extra parameters for promoteChatMember
   * @returns True on success
   */
  promoteChatMember(
    chatId: number | string,
    userId: number,
    extra: tt.ExtraPromoteChatMember
  ): Promise<boolean>

  /**
   * Use this method to restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate admin rights. Pass True for all boolean parameters to lift restrictions from a user. Returns True on success.
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   * @param userId Unique identifier of the target user
   * @param extra Additional params for restrict chat member
   * @returns True on success
   */
  restrictChatMember(
    chatId: string | number,
    userId: number,
    extra?: tt.ExtraRestrictChatMember
  ): Promise<boolean>

  /**
   * Use this method to set a custom title for an administrator in a supergroup promoted by the bot
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   * @param userId Unique identifier of the target user
   * @param title New custom title for the administrator; 0-16 characters, emoji are not allowed
   * @returns True on success
   */
  setChatAdministratorCustomTitle(
    chatId: string | number,
    userId: number,
    title: string
  ): Promise<boolean>

  /**
   * Use this method to export an invite link to a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @returns exported invite link as String on success.
   */
  exportChatInviteLink(chatId: number | string): Promise<string>

  /**
   * Use this method to set a new profile photo for the chat. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param photo New chat photo
   * @returns True on success.
   */
  setChatPhoto(chatId: number | string, photo: tt.InputFile): Promise<boolean>

  /**
   * Use this method to delete a chat photo. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @returns True on success
   */
  deleteChatPhoto(chatId: number | string): Promise<boolean>

  /**
   * Use this method to change the title of a chat. Titles can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights
   * @param chatId Unique identifier for the target group or username of the target supergroup or channel (in the format `@channelusername`)
   * @param title New chat title, 1-255 characters
   * @returns True on success
   */
  setChatTitle(chatId: number | string, title: string): Promise<boolean>

  /**
   * Use this method to change the title of a chat. Titles can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights
   * @param chatId Unique identifier for the target group or username of the target supergroup or channel (in the format `@channelusername`)
   * @param description New chat description, 0-255 characters
   * @returns True on success
   */
  setChatDescription(chatId: number | string, description: string): Promise<boolean>

  /**
   * Use this method to pin a message in a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   * @param messageId Identifier of a message to pin
   * @param extra Pass `{ disable_notification: true }`, if it is not necessary to send a notification to all group members about the new pinned message
   * @returns True on success
   */
  pinChatMessage(
    chatId: number | string,
    messageId: number,
    extra?: { disable_notification?: boolean }
  ): Promise<boolean>

  /**
   * Use this method to unpin a message in a group, a supergroup, or a channel.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param extra Extra params
   * @returns True on success
   */
  unpinChatMessage(chatId: number | string, extra?: tt.ExtraUnpinMessage): Promise<boolean>

  /**
   * Use this method to clear the list of pinned messages in a chat
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @returns True on success
   */
  unpinAllChatMessages(chatId: number | string): Promise<boolean>

  /**
   * Use this method for your bot to leave a group, supergroup or channel
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @returns True on success
   */
  leaveChat(chatId: number | string): Promise<boolean>

  /**
   * Use this method to unban a user from a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights
   * @param chatId Unique identifier for the target group or username of the target supergroup or channel (in the format @username)
   * @param userId Unique identifier of the target user
   * @param extra Extra params
   * @returns True on success
   */
  unbanChatMember(
    chatId: number | string,
    userId: number,
    extra?: tt.ExtraUnban
  ): Promise<boolean>

  /**
   * Use this method to send answers to game query.
   * @param callbackQueryId Query id
   * @param text Text of the notification. If not specified, nothing will be shown to the user, 0-200 characters
   * @param showAlert If true, an alert will be shown by the client instead of a notification at the top of the chat screen. Defaults to false.
   * @param extra Extra parameters for answerCallbackQuery
   * @returns True on success
   */
  answerCbQuery(
    callbackQueryId: string,
    text?: string,
    showAlert?: boolean,
    extra?: tt.ExtraAnswerCallbackQuery
  ): Promise<boolean>

  /**
   * Use this method to send answers to game query.
   * @param callbackQueryId Query id
   * @param url Notification text
   * @returns True on success
   */
  answerGameQuery(callbackQueryId: string, url: string): Promise<boolean>

  /**
   * If you sent an invoice requesting a shipping address and the parameter is_flexible was specified,
   * the Bot API will send an Update with a shipping_query field to the bot.
   * Use this method to reply to shipping queries.
   * @param shippingQueryId Unique identifier for the query to be answered
   * @param ok  Specify True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible)
   * @param shippingOptions Required if ok is True. A JSON-serialized array of available shipping options.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains why it is impossible to complete the order (e.g. "Sorry, delivery to your desired address is unavailable'). Telegram will display this message to the user.
   * @returns True on success
   */
  answerShippingQuery(
    shippingQueryId: string,
    ok: boolean,
    shippingOptions: Array<tt.ShippingOption>,
    errorMessage: string
  ): Promise<boolean>

  /**
   * Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query.
   * Use this method to respond to such pre-checkout queries.
   * Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.
   * @param preCheckoutQueryId  Unique identifier for the query to be answered
   * @param ok  Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains the reason for failure to proceed with the checkout (e.g. "Sorry, somebody just bought the last of our amazing black T-shirts while you were busy filling out your payment details. Please choose a different color or garment!"). Telegram will display this message to the user.
   * @returns True on success
   */
  answerPreCheckoutQuery(
    preCheckoutQueryId: string,
    ok: boolean,
    errorMessage?: string
  ): Promise<boolean>

  /**
   * Use this method to edit text and game messages sent by the bot or via the bot (for inline bots).
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param text New text of the message
   * @param extra Extra params
   * @returns On success, if the edited message was sent by the bot, the edited Message is returned, otherwise True is returned.
   */
  editMessageText(
    chatId: number | string | void,
    messageId: number | void,
    inlineMessageId: string | void,
    text: string,
    extra?: tt.ExtraEditMessage
  ): Promise<tt.Message | boolean>

  /**
   * Use this method to edit captions of messages sent by the bot or via the bot (for inline bots).
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param caption New caption of the message
   * @param extra Extra params
   * @returns On success, if the edited message was sent by the bot, the edited Message is returned, otherwise True is returned.
   */
  editMessageCaption(
    chatId?: number | string,
    messageId?: number,
    inlineMessageId?: string,
    caption?: string,
    extra?: tt.ExtraEditCaption
  ): Promise<tt.Message | boolean>

  /**
   * Use this method to edit animation, audio, document, photo, or video messages.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param media New media of message
   * @param extra Extra params
   * @returns On success, if the edited message was sent by the bot, the edited Message is returned, otherwise True is returned.
   */
  editMessageMedia(
    chatId: number | string | void,
    messageId: number | void,
    inlineMessageId: string | void,
    media: tt.MessageMedia,
    extra?: tt.ExtraEditMessageMedia
  ): Promise<tt.Message | boolean>

  /**
   * Use this method to edit only the reply markup of messages sent by the bot or via the bot (for inline bots).
   * On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param markup Markup of inline keyboard
   */
  editMessageReplyMarkup(
    chatId?: number | string,
    messageId?: number,
    inlineMessageId?: string,
    markup?: tt.InlineKeyboardMarkup
  ): Promise<tt.Message | boolean>

  /**
   * Use this method to edit live location messages
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param latitude Latitude of location
   * @param longitude Longitude of location
   * @param extra Extra params
   * @returns On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned.
   */
  editMessageLiveLocation(
    chatId: number | string | void,
    messageId: number | void,
    inlineMessageId: string | void,
    latitude: number,
    longitude: number,
    extra?: tt.ExtraEditLocation
  ): Promise<tt.MessageLocation | boolean>

  /**
   * Use this method to stop updating a live location message before live_period expires.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param extra Extra params
   * @returns On success, if the message was sent by the bot, the sent Message is returned, otherwise True is returned.
   */
  stopMessageLiveLocation(
    chatId: number | string | void,
    messageId: number | void,
    inlineMessageId: string | void,
    extra?: tt.ExtraStopLiveLocation
  ): Promise<tt.MessageLocation | boolean>

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
   * Use this method to set a new group sticker set for a supergroup.
   * The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * Use the field can_set_sticker_set optionally returned in getChat requests to check if the bot can use this method
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   * @param setName Name of the sticker set to be set as the group sticker set
   * @returns True on success.
   */
  setChatStickerSet(
    chatId: number | string,
    setName: string
  ): Promise<boolean>

  /**
   * Use this method to delete a group sticker set from a supergroup.
   * The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * Use the field can_set_sticker_set optionally returned in getChat requests to check if the bot can use this method
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   * @returns True on success.
   */
  deleteChatStickerSet(
    chatId: number | string
  ): Promise<boolean>

  /**
   * Use this method to get a sticker set
   * @param name Name of the sticker set
   * @returns On success, a StickerSet object is returned.
   */
  getStickerSet(name: string): Promise<tt.StickerSet>

  /**
   * Use this method to upload a .png file with a sticker for later use in createNewStickerSet and addStickerToSet methods (can be used multiple times)
   * https://core.telegram.org/bots/api#sending-files
   * @param ownerId User identifier of sticker file owner
   * @param stickerFile Png image with the sticker, must be up to 512 kilobytes in size, dimensions must not exceed 512px, and either width or height must be exactly 512px.
   * @returns Returns the uploaded File on success
   */
  uploadStickerFile(
    ownerId: number,
    stickerFile: tt.InputFile
  ): Promise<tt.File>

  /**
   * Use this method to create new sticker set owned by a user. The bot will be able to edit the created sticker set
   * @param ownerId User identifier of created sticker set owner
   * @param name Short name of sticker set, to be used in t.me/addstickers/ URLs (e.g., animals). Can contain only english letters, digits and underscores. Must begin with a letter, can't contain consecutive underscores and must end in “_by_<bot username>”. <bot_username> is case insensitive. 1-64 characters.
   * @param title Sticker set title, 1-64 characters
   * @param stickerData Sticker object
   * @returns True on success.
   */
  createNewStickerSet(
    ownerId: number,
    name: string,
    title: string,
    stickerData: tt.StickerData
  ): Promise<boolean>

  /**
   * Use this method to add a new sticker to a set created by the bot
   * @param ownerId User identifier of sticker set owner
   * @param name Sticker set name
   * @param stickerData Sticker object
   * @param isMasks https://github.com/telegraf/telegraf/blob/87882c42f6c2496576fdb57ca622690205c3e35e/lib/telegram.js#L304
   * @returns True on success.
   */
  addStickerToSet(
    ownerId: number,
    name: string,
    stickerData: tt.StickerData,
    isMasks: boolean
  ): Promise<boolean>

  /**
   * Use this method to move a sticker in a set created by the bot to a specific position
   * @param sticker File identifier of the sticker
   * @param position New sticker position in the set, zero-based
   * @returns True on success.
   */
  setStickerPositionInSet(sticker: string, position: number): Promise<boolean>

  /**
   * Use this method to set the thumbnail of a sticker set.
   * Animated thumbnails can be set for animated sticker sets only
   * @param name Sticker set name
   * @param userId User identifier of the sticker set owner
   * @param thumb New thumbnail. See [documentation](https://core.telegram.org/bots/api#setstickersetthumb)
   * @returns True on success.
   */
  setStickerSetThumb(
    name: string,
    userId: number,
    thumb: tt.InputFile,
  ): Promise<boolean>

  /**
   * Use this method to delete a sticker from a set created by the bot.
   * @param sticker File identifier of the sticker
   * @returns Returns True on success
   */
  deleteStickerFromSet(sticker: string): Promise<boolean>

  /**
   * Use this method to get the current list of the bot's commands. Requires no parameters.
   * @returns Array of BotCommand on success.
   */
  getMyCommands(): Promise<tt.BotCommand[]>

  /**
   * Use this method to change the list of the bot's commands.
   * @param commands A list of bot commands to be set as the list of the bot's commands. At most 100 commands can be specified.
   * @returns True on success
   */
  setMyCommands(commands: tt.BotCommand[]): Promise<boolean>

  /**
   * Informs a user that some of the Telegram Passport elements they provided contains errors.
   * The user will not be able to re-submit their Passport to you until the errors are fixed (the contents of the field for which you returned the error must change).
   *
   * Use this if the data submitted by the user doesn't satisfy the standards your service requires for any reason.
   * For example, if a birthday date seems invalid, a submitted document is blurry, a scan shows evidence of tampering, etc.
   * Supply some details in the error message to make sure the user knows how to correct the issues.
   * @param userId User identifier
   * @param errors An array describing the errors
   * @returns True on success.
   */
  setPassportDataErrors(
    userId: number,
    errors: tt.PassportElementError[]
  ): Promise<boolean>

  /**
   * Use this method to send copy of exists message.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param message Received message object
   * @param extra Specified params for message
   * @returns On success, the sent Message is returned.
   */
  sendCopy(
    chatId: number | string,
    message?: tt.Message,
    extra?: object
  ): Promise<tt.Message>

  /**
   * Use this method to send copy of exists message.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param fromChatId Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername)
   * @param messageId Message identifier in the chat specified in from_chat_id
   * @param extra Additional params to send modified copy of message
   * @returns the MessageId of the sent message on success
   */
  copyMessage(
    chatId: number | string,
    fromChatId: number | string,
    messageId: number,
    extra?: tt.ExtraCopyMessage
  ): Promise<tt.MessageId>
}
