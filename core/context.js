const updateTypes = [
  'callback_query',
  'channel_post',
  'chosen_inline_result',
  'edited_channel_post',
  'edited_message',
  'inline_query',
  'shipping_query',
  'pre_checkout_query',
  'message'
]

const updateMessageSubTypes = [
  'voice',
  'video_note',
  'video',
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
  'document',
  'delete_chat_photo',
  'contact',
  'channel_chat_created',
  'audio'
]

class TelegrafContext {
  constructor (update, telegram, options) {
    this.tg = telegram
    this.update = update
    this.options = options

    if ('message' in this.update) {
      this.updateType = 'message'
      this.updateSubTypes = updateMessageSubTypes
        .filter((key) => key in this.update.message)
    } else {
      this.updateType = updateTypes.find((key) => key in this.update)
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

  get chat () {
    return (this.message && this.message.chat) ||
      (this.editedMessage && this.editedMessage.chat) ||
      (this.callbackQuery && this.callbackQuery.message && this.callbackQuery.message.chat) ||
      (this.channelPost && this.channelPost.chat) ||
      (this.editedChannelPost && this.editedChannelPost.chat)
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
      (this.chosenInlineResult && this.chosenInlineResult.from)
  }

  get state () {
    if (!this.contextState) {
      this.contextState = {}
    }
    return this.contextState
  }

  set state (value) {
    this.contextState = Object.assign({}, value)
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

  answerCallbackQuery (...args) {
    this.assert(this.callbackQuery, 'answerCallbackQuery')
    return this.telegram.answerCallbackQuery(this.callbackQuery.id, ...args)
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
    this.assert(this.callbackQuery, 'editMessageText')
    return this.callbackQuery.inline_message_id
      ? this.telegram.editMessageText(
        undefined,
        undefined,
        this.callbackQuery.inline_message_id,
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

  editMessageCaption (caption, markup) {
    this.assert(this.callbackQuery, 'editMessageCaption')
    return this.callbackQuery.inline_message_id
      ? this.telegram.editMessageCaption(
        undefined,
        undefined,
        this.callbackQuery.inline_message_id,
        caption,
        markup
      )
      : this.telegram.editMessageCaption(
        this.chat.id,
        this.callbackQuery.message.message_id,
        undefined,
        caption,
        markup
      )
  }

  editMessageReplyMarkup (markup) {
    this.assert(this.callbackQuery, 'editMessageReplyMarkup')
    return this.callbackQuery.inline_message_id
      ? this.telegram.editMessageReplyMarkup(
        undefined,
        undefined,
        this.callbackQuery.inline_message_id,
        markup
      )
      : this.telegram.editMessageReplyMarkup(
        this.chat.id,
        this.callbackQuery.message.message_id,
        undefined,
        markup
      )
  }

  editMessageLiveLocation (latitude, longitude, markup) {
    this.assert(this.callbackQuery, 'editMessageLiveLocation')
    return this.callbackQuery.inline_message_id
      ? this.telegram.editMessageLiveLocation(
        latitude,
        longitude,
        undefined,
        undefined,
        this.callbackQuery.inline_message_id,
        markup
      )
      : this.telegram.editMessageLiveLocation(
        latitude,
        longitude,
        this.chat.id,
        this.callbackQuery.message.message_id,
        undefined,
        markup
      )
  }

  stopMessageLiveLocation (markup) {
    this.assert(this.callbackQuery, 'stopMessageLiveLocation')
    return this.callbackQuery.inline_message_id
      ? this.telegram.stopMessageLiveLocation(
        undefined, undefined, this.callbackQuery.inline_message_id,
        markup
      )
      : this.telegram.stopMessageLiveLocation(
        this.chat.id, this.callbackQuery.message.message_id, undefined,
        markup
      )
  }

  reply (...args) {
    this.assert(this.chat, 'reply')
    return this.telegram.sendMessage(this.chat.id, ...args)
  }

  getChat (...args) {
    this.assert(this.chat, 'getChat')
    return this.telegram.getChat(this.chat.id, ...args)
  }

  exportChatInviteLink (...args) {
    this.assert(this.chat, 'exportChatInviteLink')
    return this.telegram.exportChatInviteLink(this.chat.id, ...args)
  }

  kickChatMember (...args) {
    this.assert(this.chat, 'kickChatMember')
    return this.telegram.kickChatMember(this.chat.id, ...args)
  }

  restrictChatMember (...args) {
    this.assert(this.chat, 'restrictChatMember')
    return this.telegram.restrictChatMember(this.chat.id, ...args)
  }

  promoteChatMember (...args) {
    this.assert(this.chat, 'promoteChatMember')
    return this.telegram.promoteChatMember(this.chat.id, ...args)
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

  leaveChat (...args) {
    this.assert(this.chat, 'leaveChat')
    return this.telegram.leaveChat(this.chat.id, ...args)
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
    return this.telegram.getChatMembersCount(this.chat.id, ...args)
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

  replyWithMarkdown (markdown, extra) {
    return this.reply(markdown, Object.assign({ 'parse_mode': 'Markdown' }, extra))
  }

  replyWithHTML (html, extra) {
    return this.reply(html, Object.assign({ 'parse_mode': 'HTML' }, extra))
  }

  deleteMessage () {
    const message = this.message ||
      this.editedMessage ||
      this.channelPost ||
      this.editedChannelPost ||
      (this.callbackQuery && this.callbackQuery.message)

    this.assert(message && this.chat, 'deleteMessage')
    return this.telegram.deleteMessage(this.chat.id, message.message_id)
  }
}

module.exports = TelegrafContext
