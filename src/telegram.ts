import * as tg from './core/types/typegram'
import * as tt from './telegram-types'
import ApiClient from './core/network/client'
import { isAbsolute } from 'path'
import { URL } from 'url'

export class Telegram extends ApiClient {
  /**
   * Get basic information about the bot
   */
  getMe() {
    return this.callApi('getMe', {})
  }

  /**
   * Get basic info about a file and prepare it for downloading
   * @param fileId Id of file to get link to
   */
  getFile(fileId: string) {
    return this.callApi('getFile', { file_id: fileId })
  }

  /**
   * Get download link to a file
   */
  async getFileLink(fileId: string | tg.File) {
    if (typeof fileId === 'string') {
      fileId = await this.getFile(fileId)
    } else if (fileId.file_path === undefined) {
      fileId = await this.getFile(fileId.file_id)
    }

    // Local bot API instances return the absolute path to the file
    if (fileId.file_path !== undefined && isAbsolute(fileId.file_path)) {
      const url = new URL(this.options.apiRoot)
      url.port = ''
      url.pathname = fileId.file_path
      url.protocol = 'file:'
      return url
    }

    return new URL(
      `./file/${this.options.apiMode}${this.token}/${fileId.file_path!}`,
      this.options.apiRoot
    )
  }

  /**
   * Directly request incoming updates.
   * You should probably use `Telegraf::launch` instead.
   */
  getUpdates(
    timeout: number,
    limit: number,
    offset: number,
    allowedUpdates: readonly tt.UpdateType[] | undefined
  ) {
    return this.callApi('getUpdates', {
      allowed_updates: allowedUpdates,
      limit,
      offset,
      timeout,
    })
  }

  getWebhookInfo() {
    return this.callApi('getWebhookInfo', {})
  }

  getGameHighScores(
    userId: number,
    inlineMessageId: string | undefined,
    chatId: number | undefined,
    messageId: number | undefined
  ) {
    return this.callApi('getGameHighScores', {
      user_id: userId,
      inline_message_id: inlineMessageId,
      chat_id: chatId,
      message_id: messageId,
    })
  }

  setGameScore(
    userId: number,
    score: number,
    inlineMessageId: string | undefined,
    chatId: number | undefined,
    messageId: number | undefined,
    editMessage = true,
    force = false
  ) {
    return this.callApi('setGameScore', {
      force,
      score,
      user_id: userId,
      inline_message_id: inlineMessageId,
      chat_id: chatId,
      message_id: messageId,
      disable_edit_message: !editMessage,
    })
  }

  /**
   * Specify a url to receive incoming updates via an outgoing webhook
   * @param url HTTPS url to send updates to. Use an empty string to remove webhook integration
   */
  setWebhook(url: string, extra?: tt.ExtraSetWebhook) {
    return this.callApi('setWebhook', {
      url,
      ...extra,
    })
  }

  /**
   * Remove webhook integration
   */
  deleteWebhook(extra?: { drop_pending_updates?: boolean }) {
    return this.callApi('deleteWebhook', {
      ...extra,
    })
  }

  /**
   * Send a text message
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param text Text of the message to be sent
   */
  sendMessage(
    chatId: number | string,
    text: string,
    extra?: tt.ExtraReplyMessage
  ) {
    return this.callApi('sendMessage', { chat_id: chatId, text, ...extra })
  }

  /**
   * Forward existing message.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param fromChatId Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername)
   * @param messageId Message identifier in the chat specified in from_chat_id
   */
  forwardMessage(
    chatId: number | string,
    fromChatId: number | string,
    messageId: number,
    extra?: { disable_notification?: boolean }
  ) {
    return this.callApi('forwardMessage', {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId,
      ...extra,
    })
  }

  /**
   * Use this method when you need to tell the user that something is happening on the bot's side.
   * The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status).
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendChatAction(chatId: number | string, action: tt.ChatAction) {
    return this.callApi('sendChatAction', { chat_id: chatId, action })
  }

  getUserProfilePhotos(userId: number, offset?: number, limit?: number) {
    return this.callApi('getUserProfilePhotos', {
      user_id: userId,
      offset,
      limit,
    })
  }

  /**
   * Send point on the map
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendLocation(
    chatId: number | string,
    latitude: number,
    longitude: number,
    extra?: tt.ExtraLocation
  ) {
    return this.callApi('sendLocation', {
      chat_id: chatId,
      latitude,
      longitude,
      ...extra,
    })
  }

  sendVenue(
    chatId: number | string,
    latitude: number,
    longitude: number,
    title: string,
    address: string,
    extra?: tt.ExtraVenue
  ) {
    return this.callApi('sendVenue', {
      latitude,
      longitude,
      title,
      address,
      chat_id: chatId,
      ...extra,
    })
  }

  /**
   * @param chatId Unique identifier for the target private chat
   */
  sendInvoice(
    chatId: number | string,
    invoice: tt.NewInvoiceParameters,
    extra?: tt.ExtraInvoice
  ) {
    return this.callApi('sendInvoice', {
      chat_id: chatId,
      ...invoice,
      ...extra,
    })
  }

  sendContact(
    chatId: number | string,
    phoneNumber: string,
    firstName: string,
    extra?: tt.ExtraContact
  ) {
    return this.callApi('sendContact', {
      chat_id: chatId,
      phone_number: phoneNumber,
      first_name: firstName,
      ...extra,
    })
  }

  /**
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendPhoto(
    chatId: number | string,
    photo: tg.Opts<'sendPhoto'>['photo'],
    extra?: tt.ExtraPhoto
  ) {
    return this.callApi('sendPhoto', { chat_id: chatId, photo, ...extra })
  }

  /**
   * Send a dice, which will have a random value from 1 to 6.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendDice(chatId: number | string, extra?: tt.ExtraDice) {
    return this.callApi('sendDice', { chat_id: chatId, ...extra })
  }

  /**
   * Send general files. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendDocument(
    chatId: number | string,
    document: tg.Opts<'sendDocument'>['document'],
    extra?: tt.ExtraDocument
  ) {
    return this.callApi('sendDocument', { chat_id: chatId, document, ...extra })
  }

  /**
   * Send audio files, if you want Telegram clients to display them in the music player.
   * Your audio must be in the .mp3 format.
   * Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendAudio(
    chatId: number | string,
    audio: tg.Opts<'sendAudio'>['audio'],
    extra?: tt.ExtraAudio
  ) {
    return this.callApi('sendAudio', { chat_id: chatId, audio, ...extra })
  }

  /**
   * Send .webp stickers
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendSticker(
    chatId: number | string,
    sticker: tg.Opts<'sendSticker'>['sticker'],
    extra?: tt.ExtraSticker
  ) {
    return this.callApi('sendSticker', { chat_id: chatId, sticker, ...extra })
  }

  /**
   * Send video files, Telegram clients support mp4 videos (other formats may be sent as Document)
   * Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendVideo(
    chatId: number | string,
    video: tg.Opts<'sendVideo'>['video'],
    extra?: tt.ExtraVideo
  ) {
    return this.callApi('sendVideo', { chat_id: chatId, video, ...extra })
  }

  /**
   * Send .gif animations
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendAnimation(
    chatId: number | string,
    animation: tg.Opts<'sendAnimation'>['animation'],
    extra?: tt.ExtraAnimation
  ) {
    return this.callApi('sendAnimation', {
      chat_id: chatId,
      animation,
      ...extra,
    })
  }

  /**
   * Send video messages
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendVideoNote(
    chatId: number | string,
    videoNote: string | tg.InputFileVideoNote,
    extra?: tt.ExtraVideoNote
  ) {
    return this.callApi('sendVideoNote', {
      chat_id: chatId,
      video_note: videoNote,
      ...extra,
    })
  }

  /**
   * Send audio files, if you want Telegram clients to display the file as a playable voice message. For this to work, your audio must be in an .ogg file encoded with OPUS (other formats may be sent as Audio or Document). On success, the sent Message is returned. Bots can currently send voice messages of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  sendVoice(
    chatId: number | string,
    voice: tg.Opts<'sendVoice'>['voice'],
    extra?: tt.ExtraVoice
  ) {
    return this.callApi('sendVoice', { chat_id: chatId, voice, ...extra })
  }

  /**
   * @param chatId Unique identifier for the target chat
   * @param gameShortName Short name of the game, serves as the unique identifier for the game. Set up your games via Botfather.
   */
  sendGame(chatId: number, gameName: string, extra?: tt.ExtraGame) {
    return this.callApi('sendGame', {
      chat_id: chatId,
      game_short_name: gameName,
      ...extra,
    })
  }

  /**
   * Send a group of photos or videos as an album
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param media A JSON-serialized array describing photos and videos to be sent, must include 2–10 items
   */
  sendMediaGroup(
    chatId: number | string,
    media:
      | ReadonlyArray<tg.InputMediaPhoto | tg.InputMediaVideo>
      | readonly tg.InputMediaAudio[]
      | readonly tg.InputMediaDocument[],
    extra?: tt.ExtraMediaGroup
  ) {
    return this.callApi('sendMediaGroup', { chat_id: chatId, media, ...extra })
  }

  /**
   * Send a native poll.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param question Poll question, 1-255 characters
   * @param options A JSON-serialized list of answer options, 2-10 strings 1-100 characters each
   */
  sendPoll(
    chatId: number | string,
    question: string,
    options: readonly string[],
    extra?: tt.ExtraPoll
  ) {
    return this.callApi('sendPoll', {
      chat_id: chatId,
      type: 'regular',
      question,
      options,
      ...extra,
    })
  }

  /**
   * Send a native quiz.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param question Poll question, 1-255 characters
   * @param options A JSON-serialized list of answer options, 2-10 strings 1-100 characters each
   */
  sendQuiz(
    chatId: number | string,
    question: string,
    options: readonly string[],
    extra: tt.ExtraPoll
  ) {
    return this.callApi('sendPoll', {
      chat_id: chatId,
      type: 'quiz',
      question,
      options,
      ...extra,
    })
  }

  /**
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Identifier of the original message with the poll
   */
  stopPoll(
    chatId: number | string,
    messageId: number,
    extra?: tt.ExtraStopPoll
  ) {
    return this.callApi('stopPoll', {
      chat_id: chatId,
      message_id: messageId,
      ...extra,
    })
  }

  /**
   * Get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.)
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   */
  getChat(chatId: number | string) {
    return this.callApi('getChat', { chat_id: chatId })
  }

  /**
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   */
  getChatAdministrators(chatId: number | string) {
    return this.callApi('getChatAdministrators', { chat_id: chatId })
  }

  /**
   * Get information about a member of a chat.
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @param userId Unique identifier of the target user
   */
  getChatMember(chatId: string | number, userId: number) {
    return this.callApi('getChatMember', { chat_id: chatId, user_id: userId })
  }

  /**
   * Get the number of members in a chat
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   */
  getChatMembersCount(chatId: string | number) {
    return this.callApi('getChatMembersCount', { chat_id: chatId })
  }

  /**
   * Send answers to an inline query.
   * No more than 50 results per query are allowed.
   */
  answerInlineQuery(
    inlineQueryId: string,
    results: readonly tg.InlineQueryResult[],
    extra?: tt.ExtraAnswerInlineQuery
  ) {
    return this.callApi('answerInlineQuery', {
      inline_query_id: inlineQueryId,
      results,
      ...extra,
    })
  }

  setChatPermissions(chatId: number | string, permissions: tg.ChatPermissions) {
    return this.callApi('setChatPermissions', { chat_id: chatId, permissions })
  }

  /**
   * Kick a user from a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the group on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights
   * @param chatId Unique identifier for the target group or username of the target supergroup or channel (in the format `@channelusername`)
   * @param untilDate Date when the user will be unbanned, unix time. If user is banned for more than 366 days or less than 30 seconds from the current time they are considered to be banned forever
   */
  kickChatMember(
    chatId: number | string,
    userId: number,
    untilDate?: number,
    extra?: tt.ExtraKickChatMember
  ) {
    return this.callApi('kickChatMember', {
      chat_id: chatId,
      user_id: userId,
      until_date: untilDate,
      ...extra,
    })
  }

  /**
   * Promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Pass False for all boolean parameters to demote a user.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format `@channelusername`)
   */
  promoteChatMember(
    chatId: number | string,
    userId: number,
    extra: tt.ExtraPromoteChatMember
  ) {
    return this.callApi('promoteChatMember', {
      chat_id: chatId,
      user_id: userId,
      ...extra,
    })
  }

  /**
   * Restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate admin rights. Pass True for all boolean parameters to lift restrictions from a user.
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   */
  restrictChatMember(
    chatId: string | number,
    userId: number,
    extra: tt.ExtraRestrictChatMember
  ) {
    return this.callApi('restrictChatMember', {
      chat_id: chatId,
      user_id: userId,
      ...extra,
    })
  }

  setChatAdministratorCustomTitle(
    chatId: number | string,
    userId: number,
    title: string
  ) {
    return this.callApi('setChatAdministratorCustomTitle', {
      chat_id: chatId,
      user_id: userId,
      custom_title: title,
    })
  }

  /**
   * Export an invite link to a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  exportChatInviteLink(chatId: number | string) {
    return this.callApi('exportChatInviteLink', { chat_id: chatId })
  }

  createChatInviteLink(
    chatId: number | string,
    extra?: tt.ExtraCreateChatInviteLink
  ) {
    return this.callApi('createChatInviteLink', {
      chat_id: chatId,
      ...extra,
    })
  }

  editChatInviteLink(
    chatId: number | string,
    inviteLink: string,
    extra?: tt.ExtraEditChatInviteLink
  ) {
    return this.callApi('editChatInviteLink', {
      chat_id: chatId,
      invite_link: inviteLink,
      ...extra,
    })
  }

  revokeChatInviteLink(chatId: number | string, inviteLink: string) {
    return this.callApi('revokeChatInviteLink', {
      chat_id: chatId,
      invite_link: inviteLink,
    })
  }

  setChatPhoto(
    chatId: number | string,
    photo: tg.Opts<'setChatPhoto'>['photo']
  ) {
    return this.callApi('setChatPhoto', { chat_id: chatId, photo })
  }

  deleteChatPhoto(chatId: number | string) {
    return this.callApi('deleteChatPhoto', { chat_id: chatId })
  }

  /**
   * Change the title of a chat. Titles can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights
   * @param chatId Unique identifier for the target group or username of the target supergroup or channel (in the format `@channelusername`)
   * @param title New chat title, 1-255 characters
   */
  setChatTitle(chatId: number | string, title: string) {
    return this.callApi('setChatTitle', { chat_id: chatId, title })
  }

  setChatDescription(chatId: number | string, description?: string) {
    return this.callApi('setChatDescription', { chat_id: chatId, description })
  }

  /**
   * Pin a message in a group, a supergroup, or a channel. The bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' admin right in the supergroup or 'can_edit_messages' admin right in the channel.
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   */
  pinChatMessage(
    chatId: number | string,
    messageId: number,
    extra?: { disable_notification?: boolean }
  ) {
    return this.callApi('pinChatMessage', {
      chat_id: chatId,
      message_id: messageId,
      ...extra,
    })
  }

  /**
   * Unpin a message in a group, a supergroup, or a channel. The bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' admin right in the supergroup or 'can_edit_messages' admin right in the channel.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  unpinChatMessage(chatId: number | string, messageId?: number) {
    return this.callApi('unpinChatMessage', {
      chat_id: chatId,
      message_id: messageId,
    })
  }

  /**
   * Clear the list of pinned messages in a chat
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  unpinAllChatMessages(chatId: number | string) {
    return this.callApi('unpinAllChatMessages', { chat_id: chatId })
  }

  /**
   * Use this method for your bot to leave a group, supergroup or channel
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   */
  leaveChat(chatId: number | string) {
    return this.callApi('leaveChat', { chat_id: chatId })
  }

  /**
   * Unban a user from a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights
   * @param chatId Unique identifier for the target group or username of the target supergroup or channel (in the format @username)
   * @param userId Unique identifier of the target user
   */
  unbanChatMember(
    chatId: number | string,
    userId: number,
    extra?: { only_if_banned?: boolean }
  ) {
    return this.callApi('unbanChatMember', {
      chat_id: chatId,
      user_id: userId,
      ...extra,
    })
  }

  answerCbQuery(
    callbackQueryId: string,
    text?: string,
    extra?: tt.ExtraAnswerCbQuery
  ) {
    return this.callApi('answerCallbackQuery', {
      text,
      callback_query_id: callbackQueryId,
      ...extra,
    })
  }

  answerGameQuery(callbackQueryId: string, url: string) {
    return this.callApi('answerCallbackQuery', {
      url,
      callback_query_id: callbackQueryId,
    })
  }

  /**
   * If you sent an invoice requesting a shipping address and the parameter is_flexible was specified,
   * the Bot API will send an Update with a shipping_query field to the bot.
   * Reply to shipping queries.
   * @param ok  Specify True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible)
   * @param shippingOptions Required if ok is True. A JSON-serialized array of available shipping options.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains why it is impossible to complete the order (e.g. "Sorry, delivery to your desired address is unavailable'). Telegram will display this message to the user.
   */
  answerShippingQuery(
    shippingQueryId: string,
    ok: boolean,
    shippingOptions: readonly tg.ShippingOption[] | undefined,
    errorMessage: string | undefined
  ) {
    return this.callApi('answerShippingQuery', {
      ok,
      shipping_query_id: shippingQueryId,
      shipping_options: shippingOptions,
      error_message: errorMessage,
    })
  }

  /**
   * Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query.
   * Respond to such pre-checkout queries. On success, True is returned.
   * Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.
   * @param ok  Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains the reason for failure to proceed with the checkout (e.g. "Sorry, somebody just bought the last of our amazing black T-shirts while you were busy filling out your payment details. Please choose a different color or garment!"). Telegram will display this message to the user.
   */
  answerPreCheckoutQuery(
    preCheckoutQueryId: string,
    ok: boolean,
    errorMessage?: string
  ) {
    return this.callApi('answerPreCheckoutQuery', {
      ok,
      pre_checkout_query_id: preCheckoutQueryId,
      error_message: errorMessage,
    })
  }

  /**
   * Edit text and game messages sent by the bot or via the bot (for inline bots).
   * On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param text New text of the message
   */
  editMessageText(
    chatId: number | string | undefined,
    messageId: number | undefined,
    inlineMessageId: string | undefined,
    text: string,
    extra?: tt.ExtraEditMessageText
  ) {
    return this.callApi('editMessageText', {
      text,
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      ...extra,
    })
  }

  /**
   * Edit captions of messages sent by the bot or via the bot (for inline bots).
   * On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param caption New caption of the message
   * @param markup A JSON-serialized object for an inline keyboard.
   */
  editMessageCaption(
    chatId: number | string | undefined,
    messageId: number | undefined,
    inlineMessageId: string | undefined,
    caption: string | undefined,
    extra?: tt.ExtraEditMessageCaption
  ) {
    return this.callApi('editMessageCaption', {
      caption,
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      ...extra,
    })
  }

  /**
   * Edit animation, audio, document, photo, or video messages.
   * If a message is a part of a message album, then it can be edited only to a photo or a video.
   * Otherwise, message type can be changed arbitrarily.
   * When inline message is edited, new file can't be uploaded.
   * Use previously uploaded file via its file_id or specify a URL.
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param media New media of message
   * @param markup Markup of inline keyboard
   */
  editMessageMedia(
    chatId: number | string | undefined,
    messageId: number | undefined,
    inlineMessageId: string | undefined,
    media: tg.InputMedia,
    extra?: tt.ExtraEditMessageMedia
  ) {
    return this.callApi('editMessageMedia', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      media,
      ...extra,
    })
  }

  /**
   * Edit only the reply markup of messages sent by the bot or via the bot (for inline bots).
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param markup A JSON-serialized object for an inline keyboard.
   * @returns If edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   */
  editMessageReplyMarkup(
    chatId: number | string | undefined,
    messageId: number | undefined,
    inlineMessageId: string | undefined,
    markup: tg.InlineKeyboardMarkup | undefined
  ) {
    return this.callApi('editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      reply_markup: markup,
    })
  }

  editMessageLiveLocation(
    chatId: number | string | undefined,
    messageId: number | undefined,
    inlineMessageId: string | undefined,
    latitude: number,
    longitude: number,
    extra?: tt.ExtraEditMessageLiveLocation
  ) {
    return this.callApi('editMessageLiveLocation', {
      latitude,
      longitude,
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      ...extra,
    })
  }

  stopMessageLiveLocation(
    chatId: number | string | undefined,
    messageId: number | undefined,
    inlineMessageId: string | undefined,
    markup?: tg.InlineKeyboardMarkup
  ) {
    return this.callApi('stopMessageLiveLocation', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      reply_markup: markup,
    })
  }

  /**
   * Delete a message, including service messages, with the following limitations:
   * - A message can only be deleted if it was sent less than 48 hours ago.
   * - Bots can delete outgoing messages in groups and supergroups.
   * - Bots granted can_post_messages permissions can delete outgoing messages in channels.
   * - If the bot is an administrator of a group, it can delete any message there.
   * - If the bot has can_delete_messages permission in a supergroup or a channel, it can delete any message there.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   */
  deleteMessage(chatId: number | string, messageId: number) {
    return this.callApi('deleteMessage', {
      chat_id: chatId,
      message_id: messageId,
    })
  }

  setChatStickerSet(chatId: number | string, setName: string) {
    return this.callApi('setChatStickerSet', {
      chat_id: chatId,
      sticker_set_name: setName,
    })
  }

  deleteChatStickerSet(chatId: number | string) {
    return this.callApi('deleteChatStickerSet', { chat_id: chatId })
  }

  getStickerSet(name: string) {
    return this.callApi('getStickerSet', { name })
  }

  /**
   * Upload a .png file with a sticker for later use in createNewStickerSet and addStickerToSet methods (can be used multiple times)
   * https://core.telegram.org/bots/api#sending-files
   * @param ownerId User identifier of sticker file owner
   * @param stickerFile Png image with the sticker, must be up to 512 kilobytes in size, dimensions must not exceed 512px, and either width or height must be exactly 512px.
   */
  uploadStickerFile(
    ownerId: number,
    stickerFile: tg.Opts<'uploadStickerFile'>['png_sticker']
  ) {
    return this.callApi('uploadStickerFile', {
      user_id: ownerId,
      png_sticker: stickerFile,
    })
  }

  /**
   * Create new sticker set owned by a user. The bot will be able to edit the created sticker set
   * @param ownerId User identifier of created sticker set owner
   * @param name Short name of sticker set, to be used in t.me/addstickers/ URLs (e.g., animals). Can contain only english letters, digits and underscores. Must begin with a letter, can't contain consecutive underscores and must end in “_by_<bot username>”. <bot_username> is case insensitive. 1-64 characters.
   * @param title Sticker set title, 1-64 characters
   */
  createNewStickerSet(
    ownerId: number,
    name: string,
    title: string,
    stickerData: tt.ExtraCreateNewStickerSet
  ) {
    return this.callApi('createNewStickerSet', {
      name,
      title,
      user_id: ownerId,
      ...stickerData,
    })
  }

  /**
   * Add a new sticker to a set created by the bot
   * @param ownerId User identifier of sticker set owner
   * @param name Sticker set name
   */
  addStickerToSet(
    ownerId: number,
    name: string,
    stickerData: tt.ExtraAddStickerToSet
  ) {
    return this.callApi('addStickerToSet', {
      name,
      user_id: ownerId,
      ...stickerData,
    })
  }

  /**
   * Move a sticker in a set created by the bot to a specific position
   * @param sticker File identifier of the sticker
   * @param position New sticker position in the set, zero-based
   */
  setStickerPositionInSet(sticker: string, position: number) {
    return this.callApi('setStickerPositionInSet', {
      sticker,
      position,
    })
  }

  setStickerSetThumb(
    name: string,
    userId: number,
    thumb: tg.Opts<'setStickerSetThumb'>['thumb']
  ) {
    return this.callApi('setStickerSetThumb', { name, user_id: userId, thumb })
  }

  /**
   * Delete a sticker from a set created by the bot.
   * @param sticker File identifier of the sticker
   */
  deleteStickerFromSet(sticker: string) {
    return this.callApi('deleteStickerFromSet', { sticker })
  }

  /**
   * Get the current list of the bot's commands.
   */
  getMyCommands(extra: tg.Opts<'getMyCommands'> = {}) {
    return this.callApi('getMyCommands', extra)
  }

  /**
   * Change the list of the bot's commands.
   * @param commands A list of bot commands to be set as the list of the bot's commands. At most 100 commands can be specified.
   */
  setMyCommands(
    commands: readonly tg.BotCommand[],
    extra?: tt.ExtraSetMyCommands
  ) {
    return this.callApi('setMyCommands', { commands, ...extra })
  }

  deleteMyCommands(extra: tg.Opts<'deleteMyCommands'> = {}) {
    return this.callApi('deleteMyCommands', extra)
  }

  setPassportDataErrors(
    userId: number,
    errors: readonly tg.PassportElementError[]
  ) {
    return this.callApi('setPassportDataErrors', {
      user_id: userId,
      errors: errors,
    })
  }

  /**
   * Send copy of existing message.
   * @deprecated use `copyMessage` instead
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param message Received message object
   */
  sendCopy(
    chatId: number | string,
    message: tg.Message,
    extra?: tt.ExtraCopyMessage
  ): Promise<tg.MessageId> {
    return this.copyMessage(chatId, message.chat.id, message.message_id, extra)
  }

  /**
   * Send copy of existing message
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param fromChatId Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername)
   * @param messageId Message identifier in the chat specified in from_chat_id
   */
  copyMessage(
    chatId: number | string,
    fromChatId: number | string,
    messageId: number,
    extra?: tt.ExtraCopyMessage
  ) {
    return this.callApi('copyMessage', {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId,
      ...extra,
    })
  }

  /**
   * Log out from the cloud Bot API server before launching the bot locally
   */
  logOut() {
    return this.callApi('logOut', {})
  }

  /**
   * Close the bot instance before moving it from one local server to another
   */
  close() {
    return this.callApi('close', {})
  }
}

export default Telegram
