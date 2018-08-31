const util = require('util')
const replicators = require('./core/replicators')
const ApiClient = require('./core/network/client')

class Telegram extends ApiClient {
  getMe () {
    return this.callApi('getMe')
  }

  getFile (fileId) {
    return this.callApi('getFile', { file_id: fileId })
  }

  getFileLink (fileId) {
    return Promise.resolve(fileId)
      .then((fileId) => {
        if (fileId && fileId.file_path) {
          return fileId
        }
        const id = fileId && fileId.file_id ? fileId.file_id : fileId
        return this.getFile(id)
      })
      .then((file) => `${this.options.apiRoot}/file/bot${this.token}/${file.file_path}`)
  }

  getUpdates (timeout, limit, offset, allowedUpdates) {
    let url = `getUpdates?offset=${offset}&limit=${limit}&timeout=${timeout}`
    return this.callApi(url, {
      allowed_updates: allowedUpdates
    })
  }

  getWebhookInfo () {
    return this.callApi(`getWebhookInfo`)
  }

  getGameHighScores (userId, inlineMessageId, chatId, messageId) {
    return this.callApi(`getGameHighScores`, {
      user_id: userId,
      inline_message_id: inlineMessageId,
      chat_id: chatId,
      message_id: messageId
    })
  }

  setGameScore (userId, score, inlineMessageId, chatId, messageId, editMessage = true, force) {
    return this.callApi(`setGameScore`, {
      user_id: userId,
      score: score,
      inline_message_id: inlineMessageId,
      chat_id: chatId,
      message_id: messageId,
      disable_edit_message: !editMessage,
      force: force
    })
  }

  setWebhook (url, cert, maxConnections, allowedUpdates) {
    return this.callApi('setWebhook', {
      url: url,
      certificate: cert,
      max_connections: maxConnections,
      allowed_updates: allowedUpdates
    })
  }

  deleteWebhook () {
    return this.callApi('deleteWebhook')
  }

  sendMessage (chatId, text, extra) {
    return this.callApi('sendMessage', Object.assign({ chat_id: chatId, text: text }, extra))
  }

  forwardMessage (chatId, fromChatId, messageId, extra) {
    return this.callApi('forwardMessage', Object.assign({
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId
    }, extra))
  }

  sendChatAction (chatId, action) {
    return this.callApi('sendChatAction', { chat_id: chatId, action: action })
  }

  getUserProfilePhotos (userId, offset, limit) {
    return this.callApi('getUserProfilePhotos', { user_id: userId, offset: offset, limit: limit })
  }

  sendLocation (chatId, latitude, longitude, extra) {
    return this.callApi('sendLocation', Object.assign({ chat_id: chatId, latitude: latitude, longitude: longitude }, extra))
  }

  sendVenue (chatId, latitude, longitude, title, address, extra) {
    return this.callApi('sendVenue', Object.assign({
      chat_id: chatId,
      latitude: latitude,
      longitude: longitude,
      title: title,
      address: address
    }, extra))
  }

  sendInvoice (chatId, invoice, extra) {
    return this.callApi('sendInvoice', Object.assign({ chat_id: chatId }, invoice, extra))
  }

  sendContact (chatId, phoneNumber, firstName, extra) {
    return this.callApi('sendContact', Object.assign({ chat_id: chatId, phone_number: phoneNumber, first_name: firstName }, extra))
  }

  sendPhoto (chatId, photo, extra) {
    return this.callApi('sendPhoto', Object.assign({ chat_id: chatId, photo: photo }, extra))
  }

  sendDocument (chatId, doc, extra) {
    return this.callApi('sendDocument', Object.assign({ chat_id: chatId, document: doc }, extra))
  }

  sendAudio (chatId, audio, extra) {
    return this.callApi('sendAudio', Object.assign({ chat_id: chatId, audio: audio }, extra))
  }

  sendSticker (chatId, sticker, extra) {
    return this.callApi('sendSticker', Object.assign({ chat_id: chatId, sticker: sticker }, extra))
  }

  sendVideo (chatId, video, extra) {
    return this.callApi('sendVideo', Object.assign({ chat_id: chatId, video: video }, extra))
  }

  sendAnimation (chatId, animation, extra) {
    return this.callApi('sendAnimation', Object.assign({ chat_id: chatId, animation: animation }, extra))
  }

  sendVideoNote (chatId, videoNote, extra) {
    return this.callApi('sendVideoNote', Object.assign({ chat_id: chatId, video_note: videoNote }, extra))
  }

  sendVoice (chatId, voice, extra) {
    return this.callApi('sendVoice', Object.assign({ chat_id: chatId, voice: voice }, extra))
  }

  sendGame (chatId, gameName, extra) {
    return this.callApi('sendGame', Object.assign({ chat_id: chatId, game_short_name: gameName }, extra))
  }

  sendMediaGroup (chatId, media, extra) {
    return this.callApi('sendMediaGroup', Object.assign({ chat_id: chatId, media }, extra))
  }

  getChat (chatId) {
    return this.callApi('getChat', { chat_id: chatId })
  }

  getChatAdministrators (chatId) {
    return this.callApi('getChatAdministrators', { chat_id: chatId })
  }

  getChatMember (chatId, userId) {
    return this.callApi('getChatMember', { chat_id: chatId, user_id: userId })
  }

  getChatMembersCount (chatId) {
    return this.callApi('getChatMembersCount', { chat_id: chatId })
  }

  answerInlineQuery (inlineQueryId, results, extra) {
    return this.callApi('answerInlineQuery', Object.assign({ inline_query_id: inlineQueryId, results: JSON.stringify(results) }, extra))
  }

  kickChatMember (chatId, userId, untilDate) {
    return this.callApi('kickChatMember', { chat_id: chatId, user_id: userId, until_date: untilDate })
  }

  promoteChatMember (chatId, userId, extra) {
    return this.callApi('promoteChatMember', Object.assign({ chat_id: chatId, user_id: userId }, extra))
  }

  restrictChatMember (chatId, userId, extra) {
    return this.callApi('restrictChatMember', Object.assign({ chat_id: chatId, user_id: userId }, extra))
  }

  exportChatInviteLink (chatId) {
    return this.callApi('exportChatInviteLink', { chat_id: chatId })
  }

  setChatPhoto (chatId, photo) {
    return this.callApi('setChatPhoto', { chat_id: chatId, photo: photo })
  }

  deleteChatPhoto (chatId) {
    return this.callApi('deleteChatPhoto', { chat_id: chatId })
  }

  setChatTitle (chatId, title) {
    return this.callApi('setChatTitle', { chat_id: chatId, title: title })
  }

  setChatDescription (chatId, description) {
    return this.callApi('setChatDescription', { chat_id: chatId, description: description })
  }

  pinChatMessage (chatId, messageId, extra) {
    return this.callApi('pinChatMessage', Object.assign({ chat_id: chatId, message_id: messageId }, extra))
  }

  unpinChatMessage (chatId) {
    return this.callApi('unpinChatMessage', { chat_id: chatId })
  }

  leaveChat (chatId) {
    return this.callApi('leaveChat', { chat_id: chatId })
  }

  unbanChatMember (chatId, userId) {
    return this.callApi('unbanChatMember', { chat_id: chatId, user_id: userId })
  }

  answerCallbackQuery (callbackQueryId, text, url, showAlert, cacheTime) {
    return this.callApi('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text: text,
      url: url,
      show_alert: showAlert,
      cache_time: cacheTime
    })
  }

  answerCbQuery (callbackQueryId, text, showAlert, extra) {
    return this.callApi('answerCallbackQuery', Object.assign({
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: showAlert
    }, extra))
  }

  answerGameQuery (callbackQueryId, url) {
    return this.callApi('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      url: url
    })
  }

  answerShippingQuery (shippingQueryId, ok, shippingOptions, errorMessage) {
    return this.callApi('answerShippingQuery', {
      shipping_query_id: shippingQueryId,
      ok: ok,
      shipping_options: shippingOptions,
      error_message: errorMessage
    })
  }

  answerPreCheckoutQuery (preCheckoutQueryId, ok, errorMessage) {
    return this.callApi('answerPreCheckoutQuery', {
      pre_checkout_query_id: preCheckoutQueryId,
      ok: ok,
      error_message: errorMessage
    })
  }

  editMessageText (chatId, messageId, inlineMessageId, text, extra) {
    return this.callApi('editMessageText', Object.assign({
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      text: text
    }, extra))
  }

  editMessageCaption (chatId, messageId, inlineMessageId, caption, extra = {}) {
    return this.callApi('editMessageCaption', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      caption: caption,
      parse_mode: extra.parse_mode,
      reply_markup: extra.parse_mode || extra.reply_markup ? extra.reply_markup : extra
    })
  }

  editMessageMedia (chatId, messageId, inlineMessageId, media, extra = {}) {
    return this.callApi('editMessageMedia', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      media: Object.assign(media, { parse_mode: extra.parse_mode }),
      reply_markup: extra.reply_markup ? extra.reply_markup : extra
    })
  }

  editMessageReplyMarkup (chatId, messageId, inlineMessageId, markup) {
    return this.callApi('editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      reply_markup: markup
    })
  }

  editMessageLiveLocation (latitude, longitude, chatId, messageId, inlineMessageId, markup) {
    return this.callApi('editMessageLiveLocation', {
      latitude,
      longitude,
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      reply_markup: markup
    })
  }

  stopMessageLiveLocation (chatId, messageId, inlineMessageId, markup) {
    return this.callApi('stopMessageLiveLocation', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      reply_markup: markup
    })
  }

  deleteMessage (chatId, messageId) {
    return this.callApi('deleteMessage', {
      chat_id: chatId,
      message_id: messageId
    })
  }

  setChatStickerSet (chatId, setName) {
    return this.callApi('setChatStickerSet', {
      chat_id: chatId,
      sticker_set_name: setName
    })
  }

  deleteChatStickerSet (chatId) {
    return this.callApi('deleteChatStickerSet', { chat_id: chatId })
  }

  getStickerSet (setName) {
    return this.callApi('getStickerSet', { name: setName })
  }

  uploadStickerFile (ownerId, stickerFile) {
    return this.callApi('uploadStickerFile', {
      user_id: ownerId,
      png_sticker: stickerFile
    })
  }

  createNewStickerSet (ownerId, name, title, stickerData) {
    return this.callApi('createNewStickerSet', Object.assign({
      user_id: ownerId,
      name: name,
      title: title
    }, stickerData))
  }

  addStickerToSet (ownerId, name, stickerData, isMasks) {
    return this.callApi('addStickerToSet', Object.assign({
      user_id: ownerId,
      name: name,
      is_masks: isMasks
    }, stickerData))
  }

  setStickerPositionInSet (sticker, position) {
    return this.callApi('setStickerPositionInSet', {
      sticker: sticker,
      position: position
    })
  }

  deleteStickerFromSet (sticker) {
    return this.callApi('deleteStickerFromSet', { sticker: sticker })
  }

  sendCopy (chatId, message, extra) {
    if (!message) {
      throw new Error('Message is required')
    }
    const type = Object.keys(replicators.copyMethods).find((type) => message[type])
    if (!type) {
      throw new Error('Unsupported message type')
    }
    const opts = Object.assign({ chat_id: chatId }, replicators[type](message), extra)
    return this.callApi(replicators.copyMethods[type], opts)
  }
}

Telegram.prototype.answerCallbackQuery = util.deprecate(Telegram.prototype.answerCallbackQuery, '️⚠️ Telegraf: answerCallbackQuery() is deprecated, use answerCbQuery() instead')

module.exports = Telegram
