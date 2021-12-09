const UpdateTypes = [
  'callback_query',
  'channel_post',
  'chosen_inline_result',
  'edited_channel_post',
  'edited_message',
  'inline_query',
  'shipping_query',
  'pre_checkout_query',
  'message',
  'poll',
  'poll_answer',
  'my_chat_member',
  'chat_member'
]

const MessageSubTypes = [
  'voice',
  'video_note',
  'video',
  'animation',
  'venue',
  'text',
  'supergroup_chat_created',
  'successful_payment',
  'sticker',
  'pinned_message',
  'photo',
  'new_chat_title',
  'new_chat_photo',
  'new_chat_members',
  'migrate_to_chat_id',
  'migrate_from_chat_id',
  'location',
  'left_chat_member',
  'invoice',
  'group_chat_created',
  'game',
  'dice',
  'document',
  'delete_chat_photo',
  'contact',
  'channel_chat_created',
  'audio',
  'connected_website',
  'passport_data',
  'poll',
  'forward_date',
  'message_auto_delete_timer_changed',
  'voice_chat_started',
  'voice_chat_ended',
  'voice_chat_participants_invited',
  'voice_chat_scheduled'
]

const MessageSubTypesMapping = {
  forward_date: 'forward'
}

class TelegrafContext {
  constructor (update, telegram, options) {
    this.tg = telegram
    this.update = update
    this.options = options
    this.updateType = UpdateTypes.find((key) => key in this.update)
    if (this.updateType === 'message' || (this.options.channelMode && this.updateType === 'channel_post')) {
      this.updateSubTypes = MessageSubTypes
        .filter((key) => key in this.update[this.updateType])
        .map((type) => MessageSubTypesMapping[type] || type)
    } else {
      this.updateSubTypes = []
    }
    Object.getOwnPropertyNames(TelegrafContext.prototype)
      .filter((key) => key !== 'constructor' && typeof this[key] === 'function')
      .forEach((key) => (this[key] = this[key].bind(this)))
  }

  get me () {
    return this.options && this.options.username
  }

  get telegram () {
    return this.tg
  }

  get message () {
    return this.update.message
  }

  get editedMessage () {
    return this.update.edited_message
  }

  get inlineQuery () {
    return this.update.inline_query
  }

  get shippingQuery () {
    return this.update.shipping_query
  }

  get preCheckoutQuery () {
    return this.update.pre_checkout_query
  }

  get chosenInlineResult () {
    return this.update.chosen_inline_result
  }

  get channelPost () {
    return this.update.channel_post
  }

  get editedChannelPost () {
    return this.update.edited_channel_post
  }

  get callbackQuery () {
    return this.update.callback_query
  }

  get poll () {
    return this.update.poll
  }

  get pollAnswer () {
    return this.update.poll_answer
  }

  get myChatMember () {
    return this.update.my_chat_member
  }

  get chatMember () {
    return this.update.chat_member
  }

  get chat () {
    return (this.message && this.message.chat) ||
      (this.editedMessage && this.editedMessage.chat) ||
      (this.callbackQuery && this.callbackQuery.message && this.callbackQuery.message.chat) ||
      (this.channelPost && this.channelPost.chat) ||
      (this.editedChannelPost && this.editedChannelPost.chat) ||
      (this.myChatMember && this.myChatMember.chat) ||
      (this.chatMember && this.chatMember.chat)
  }

  get from () {
    return (this.message && this.message.from) ||
      (this.editedMessage && this.editedMessage.from) ||
      (this.callbackQuery && this.callbackQuery.from) ||
      (this.inlineQuery && this.inlineQuery.from) ||
      (this.channelPost && this.channelPost.from) ||
      (this.editedChannelPost && this.editedChannelPost.from) ||
      (this.shippingQuery && this.shippingQuery.from) ||
      (this.preCheckoutQuery && this.preCheckoutQuery.from) ||
      (this.chosenInlineResult && this.chosenInlineResult.from) ||
      (this.myChatMember && this.myChatMember.from) ||
      (this.chatMember && this.chatMember.from)
  }

  get inlineMessageId () {
    return (this.callbackQuery && this.callbackQuery.inline_message_id) || (this.chosenInlineResult && this.chosenInlineResult.inline_message_id)
  }

  get passportData () {
    return this.message && this.message.passport_data
  }

  get state () {
    if (!this.contextState) {
      this.contextState = {}
    }
    return this.contextState
  }

  set state (value) {
    this.contextState = { ...value }
  }

  get webhookReply () {
    return this.tg.webhookReply
  }

  set webhookReply (enable) {
    this.tg.webhookReply = enable
  }

  assert (value, method) {
    if (!value) {
      throw new Error(`Telegraf: "${method}" isn't available for "${this.updateType}::${this.updateSubTypes}"`)
    }
  }

  answerInlineQuery (...args) {
    this.assert(this.inlineQuery, 'answerInlineQuery')
    return this.telegram.answerInlineQuery(this.inlineQuery.id, ...args)
  }

  answerCbQuery (...args) {
    this.assert(this.callbackQuery, 'answerCbQuery')
    return this.telegram.answerCbQuery(this.callbackQuery.id, ...args)
  }

  answerGameQuery (...args) {
    this.assert(this.callbackQuery, 'answerGameQuery')
    return this.telegram.answerGameQuery(this.callbackQuery.id, ...args)
  }

  answerShippingQuery (...args) {
    this.assert(this.shippingQuery, 'answerShippingQuery')
    return this.telegram.answerShippingQuery(this.shippingQuery.id, ...args)
  }

  answerPreCheckoutQuery (...args) {
    this.assert(this.preCheckoutQuery, 'answerPreCheckoutQuery')
    return this.telegram.answerPreCheckoutQuery(this.preCheckoutQuery.id, ...args)
  }

  editMessageText (text, extra) {
    this.assert(this.callbackQuery || this.inlineMessageId, 'editMessageText')
    return this.inlineMessageId
      ? this.telegram.editMessageText(
        undefined,
        undefined,
        this.inlineMessageId,
        text,
        extra
      )
      : this.telegram.editMessageText(
        this.chat.id,
        this.callbackQuery.message.message_id,
        undefined,
        text,
        extra
      )
  }

  editMessageCaption (caption, extra) {
    this.assert(this.callbackQuery || this.inlineMessageId, 'editMessageCaption')
    return this.inlineMessageId
      ? this.telegram.editMessageCaption(
        undefined,
        undefined,
        this.inlineMessageId,
        caption,
        extra
      )
      : this.telegram.editMessageCaption(
        this.chat.id,
        this.callbackQuery.message.message_id,
        undefined,
        caption,
        extra
      )
  }

  editMessageMedia (media, extra) {
    this.assert(this.callbackQuery || this.inlineMessageId, 'editMessageMedia')
    return this.inlineMessageId
      ? this.telegram.editMessageMedia(
        undefined,
        undefined,
        this.inlineMessageId,
        media,
        extra
      )
      : this.telegram.editMessageMedia(
        this.chat.id,
        this.callbackQuery.message.message_id,
        undefined,
        media,
        extra
      )
  }

  editMessageReplyMarkup (markup) {
    this.assert(this.callbackQuery || this.inlineMessageId, 'editMessageReplyMarkup')
    return this.inlineMessageId
      ? this.telegram.editMessageReplyMarkup(
        undefined,
        undefined,
        this.inlineMessageId,
        markup
      )
      : this.telegram.editMessageReplyMarkup(
        this.chat.id,
        this.callbackQuery.message.message_id,
        undefined,
        markup
      )
  }

  editMessageLiveLocation (latitude, longitude, extra) {
    this.assert(this.callbackQuery || this.inlineMessageId, 'editMessageLiveLocation')
    return this.inlineMessageId
      ? this.telegram.editMessageLiveLocation(
        undefined,
        undefined,
        this.inlineMessageId,
        latitude,
        longitude,
        extra
      )
      : this.telegram.editMessageLiveLocation(
        this.chat.id,
        this.callbackQuery.message.message_id,
        undefined,
        latitude,
        longitude,
        extra
      )
  }

  stopMessageLiveLocation (markup) {
    this.assert(this.callbackQuery || this.inlineMessageId, 'stopMessageLiveLocation')
    return this.inlineMessageId
      ? this.telegram.stopMessageLiveLocation(
        undefined,
        undefined,
        this.inlineMessageId,
        markup
      )
      : this.telegram.stopMessageLiveLocation(
        this.chat.id,
        this.callbackQuery.message.message_id,
        undefined,
        markup
      )
  }

  reply (text, args) {
    this.assert(this.chat, 'reply')
    const extra = this.options.parseMode
      ? { parse_mode: this.options.parseMode }
      : { ...args }
    return this.telegram.sendMessage(this.chat.id, text, extra)
  }

  getChat (...args) {
    this.assert(this.chat, 'getChat')
    return this.telegram.getChat(this.chat.id, ...args)
  }

  exportChatInviteLink (...args) {
    this.assert(this.chat, 'exportChatInviteLink')
    return this.telegram.exportChatInviteLink(this.chat.id, ...args)
  }

  banChatMember (...args) {
    this.assert(this.chat, 'banChatMember')
    return this.telegram.banChatMember(this.chat.id, ...args)
  }

  kickChatMember (...args) {
    this.assert(this.chat, 'kickChatMember')
    return this.telegram.kickChatMember(this.chat.id, ...args)
  }

  unbanChatMember (...args) {
    this.assert(this.chat, 'unbanChatMember')
    return this.telegram.unbanChatMember(this.chat.id, ...args)
  }

  restrictChatMember (...args) {
    this.assert(this.chat, 'restrictChatMember')
    return this.telegram.restrictChatMember(this.chat.id, ...args)
  }

  promoteChatMember (...args) {
    this.assert(this.chat, 'promoteChatMember')
    return this.telegram.promoteChatMember(this.chat.id, ...args)
  }

  setChatAdministratorCustomTitle (...args) {
    this.assert(this.chat, 'setChatAdministratorCustomTitle')
    return this.telegram.setChatAdministratorCustomTitle(this.chat.id, ...args)
  }

  banChatSenderChat (...args) {
    this.assert(this.chat, 'banChatSenderChat')
    return this.telegram.banChatSenderChat(this.chat.id, ...args)
  }

  unbanChatSenderChat (...args) {
    this.assert(this.chat, 'unbanChatSenderChat')
    return this.telegram.unbanChatSenderChat(this.chat.id, ...args)
  }

  setChatPhoto (...args) {
    this.assert(this.chat, 'setChatPhoto')
    return this.telegram.setChatPhoto(this.chat.id, ...args)
  }

  deleteChatPhoto (...args) {
    this.assert(this.chat, 'deleteChatPhoto')
    return this.telegram.deleteChatPhoto(this.chat.id, ...args)
  }

  setChatTitle (...args) {
    this.assert(this.chat, 'setChatTitle')
    return this.telegram.setChatTitle(this.chat.id, ...args)
  }

  setChatDescription (...args) {
    this.assert(this.chat, 'setChatDescription')
    return this.telegram.setChatDescription(this.chat.id, ...args)
  }

  pinChatMessage (...args) {
    this.assert(this.chat, 'pinChatMessage')
    return this.telegram.pinChatMessage(this.chat.id, ...args)
  }

  unpinChatMessage (...args) {
    this.assert(this.chat, 'unpinChatMessage')
    return this.telegram.unpinChatMessage(this.chat.id, ...args)
  }

  unpinAllChatMessages () {
    this.assert(this.chat, 'unpinAllChatMessages')
    return this.telegram.unpinAllChatMessages(this.chat.id)
  }

  leaveChat (...args) {
    this.assert(this.chat, 'leaveChat')
    return this.telegram.leaveChat(this.chat.id, ...args)
  }

  setChatPermissions (...args) {
    this.assert(this.chat, 'setChatPermissions')
    return this.telegram.setChatPermissions(this.chat.id, ...args)
  }

  getChatAdministrators (...args) {
    this.assert(this.chat, 'getChatAdministrators')
    return this.telegram.getChatAdministrators(this.chat.id, ...args)
  }

  getChatMember (...args) {
    this.assert(this.chat, 'getChatMember')
    return this.telegram.getChatMember(this.chat.id, ...args)
  }

  getChatMembersCount (...args) {
    this.assert(this.chat, 'getChatMembersCount')
    return this.telegram.getChatMemberCount(this.chat.id, ...args)
  }

  getChatMemberCount (...args) {
    this.assert(this.chat, 'getChatMemberCount')
    return this.telegram.getChatMemberCount(this.chat.id, ...args)
  }

  setPassportDataErrors (errors) {
    this.assert(this.chat, 'setPassportDataErrors')
    return this.telegram.setPassportDataErrors(this.from.id, errors)
  }

  replyWithPhoto (...args) {
    this.assert(this.chat, 'replyWithPhoto')
    return this.telegram.sendPhoto(this.chat.id, ...args)
  }

  replyWithMediaGroup (...args) {
    this.assert(this.chat, 'replyWithMediaGroup')
    return this.telegram.sendMediaGroup(this.chat.id, ...args)
  }

  replyWithAudio (...args) {
    this.assert(this.chat, 'replyWithAudio')
    return this.telegram.sendAudio(this.chat.id, ...args)
  }

  replyWithDice (...args) {
    this.assert(this.chat, 'replyWithDice')
    return this.telegram.sendDice(this.chat.id, ...args)
  }

  replyWithDocument (...args) {
    this.assert(this.chat, 'replyWithDocument')
    return this.telegram.sendDocument(this.chat.id, ...args)
  }

  replyWithSticker (...args) {
    this.assert(this.chat, 'replyWithSticker')
    return this.telegram.sendSticker(this.chat.id, ...args)
  }

  replyWithVideo (...args) {
    this.assert(this.chat, 'replyWithVideo')
    return this.telegram.sendVideo(this.chat.id, ...args)
  }

  replyWithAnimation (...args) {
    this.assert(this.chat, 'replyWithAnimation')
    return this.telegram.sendAnimation(this.chat.id, ...args)
  }

  replyWithVideoNote (...args) {
    this.assert(this.chat, 'replyWithVideoNote')
    return this.telegram.sendVideoNote(this.chat.id, ...args)
  }

  replyWithInvoice (...args) {
    this.assert(this.chat, 'replyWithInvoice')
    return this.telegram.sendInvoice(this.chat.id, ...args)
  }

  replyWithGame (...args) {
    this.assert(this.chat, 'replyWithGame')
    return this.telegram.sendGame(this.chat.id, ...args)
  }

  replyWithVoice (...args) {
    this.assert(this.chat, 'replyWithVoice')
    return this.telegram.sendVoice(this.chat.id, ...args)
  }

  replyWithPoll (...args) {
    this.assert(this.chat, 'replyWithPoll')
    return this.telegram.sendPoll(this.chat.id, ...args)
  }

  replyWithQuiz (...args) {
    this.assert(this.chat, 'replyWithQuiz')
    return this.telegram.sendQuiz(this.chat.id, ...args)
  }

  stopPoll (...args) {
    this.assert(this.chat, 'stopPoll')
    return this.telegram.stopPoll(this.chat.id, ...args)
  }

  replyWithChatAction (...args) {
    this.assert(this.chat, 'replyWithChatAction')
    return this.telegram.sendChatAction(this.chat.id, ...args)
  }

  replyWithLocation (...args) {
    this.assert(this.chat, 'replyWithLocation')
    return this.telegram.sendLocation(this.chat.id, ...args)
  }

  replyWithVenue (...args) {
    this.assert(this.chat, 'replyWithVenue')
    return this.telegram.sendVenue(this.chat.id, ...args)
  }

  replyWithContact (...args) {
    this.assert(this.from, 'replyWithContact')
    return this.telegram.sendContact(this.chat.id, ...args)
  }

  getStickerSet (setName) {
    return this.telegram.getStickerSet(setName)
  }

  setChatStickerSet (setName) {
    this.assert(this.chat, 'setChatStickerSet')
    return this.telegram.setChatStickerSet(this.chat.id, setName)
  }

  deleteChatStickerSet () {
    this.assert(this.chat, 'deleteChatStickerSet')
    return this.telegram.deleteChatStickerSet(this.chat.id)
  }

  setStickerPositionInSet (sticker, position) {
    return this.telegram.setStickerPositionInSet(sticker, position)
  }

  setStickerSetThumb (...args) {
    return this.telegram.setStickerSetThumb(...args)
  }

  deleteStickerFromSet (sticker) {
    return this.telegram.deleteStickerFromSet(sticker)
  }

  uploadStickerFile (...args) {
    this.assert(this.from, 'uploadStickerFile')
    return this.telegram.uploadStickerFile(this.from.id, ...args)
  }

  createNewStickerSet (...args) {
    this.assert(this.from, 'createNewStickerSet')
    return this.telegram.createNewStickerSet(this.from.id, ...args)
  }

  addStickerToSet (...args) {
    this.assert(this.from, 'addStickerToSet')
    return this.telegram.addStickerToSet(this.from.id, ...args)
  }

  getMyCommands (...args) {
    return this.telegram.getMyCommands(...args)
  }

  setMyCommands (...args) {
    return this.telegram.setMyCommands(...args)
  }

  deleteMyCommands (...args) {
    return this.telegram.deleteMyCommands(...args)
  }

  replyWithMarkdown (markdown, extra) {
    return this.reply(markdown, { parse_mode: 'Markdown', ...extra })
  }

  replyWithMarkdownV2 (markdown, extra) {
    return this.reply(markdown, { parse_mode: 'MarkdownV2', ...extra })
  }

  replyWithHTML (html, extra) {
    return this.reply(html, { parse_mode: 'HTML', ...extra })
  }

  deleteMessage (messageId) {
    this.assert(this.chat, 'deleteMessage')
    if (typeof messageId !== 'undefined') {
      return this.telegram.deleteMessage(this.chat.id, messageId)
    }
    const message = this.message ||
      this.editedMessage ||
      this.channelPost ||
      this.editedChannelPost ||
      (this.callbackQuery && this.callbackQuery.message)
    this.assert(message, 'deleteMessage')
    return this.telegram.deleteMessage(this.chat.id, message.message_id)
  }

  forwardMessage (chatId, extra) {
    this.assert(this.chat, 'forwardMessage')
    const message = this.message ||
      this.editedMessage ||
      this.channelPost ||
      this.editedChannelPost ||
      (this.callbackQuery && this.callbackQuery.message)
    this.assert(message, 'forwardMessage')
    return this.telegram.forwardMessage(chatId, this.chat.id, message.message_id, extra)
  }

  copyMessage (chatId, extra) {
    const message = this.message ||
      this.editedMessage ||
      this.channelPost ||
      this.editedChannelPost ||
      (this.callbackQuery && this.callbackQuery.message)
    this.assert(message, 'copyMessage')
    return this.telegram.copyMessage(chatId, message.chat.id, message.message_id, extra)
  }

  createChatInviteLink (...args) {
    this.assert(this.chat, 'createChatInviteLink')
    return this.telegram.createChatInviteLink(this.chat.id, ...args)
  }

  editChatInviteLink (...args) {
    this.assert(this.chat, 'editChatInviteLink')
    return this.telegram.editChatInviteLink(this.chat.id, ...args)
  }

  revokeChatInviteLink (...args) {
    this.assert(this.chat, 'revokeChatInviteLink')
    return this.telegram.revokeChatInviteLink(this.chat.id, ...args)
  }

  approveChatJoinRequest (...args) {
    this.assert(this.chat, 'approveChatJoinRequest')
    return this.telegram.approveChatJoinRequest(this.chat.id, ...args)
  }

  declineChatJoinRequest (...args) {
    this.assert(this.chat, 'declineChatJoinRequest')
    return this.telegram.declineChatJoinRequest(this.chat.id, ...args)
  }
}

module.exports = TelegrafContext
