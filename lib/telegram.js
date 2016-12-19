const util = require('util')
const replicators = require('./helpers/replicators')
const ApiClient = require('./network/client')

class Telegram extends ApiClient {

  getMe () {
    return this.callApi('getMe')
  }

  getFile (fileId) {
    return this.callApi('getFile', {file_id: fileId})
  }

  getFileLink (fileId) {
    return this.getFile(fileId).then((file) => `${this.options.apiRoot}/file/bot${this.token}/${file.file_path}`)
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

  sendVoice (chatId, voice, extra) {
    return this.callApi('sendVoice', Object.assign({ chat_id: chatId, voice: voice }, extra))
  }

  sendGame (chatId, gameName, extra) {
    return this.callApi('sendGame', Object.assign({ chat_id: chatId, game_short_name: gameName }, extra))
  }

  getChat (chatId) {
    return this.callApi('getChat', {chat_id: chatId})
  }

  getChatAdministrators (chatId) {
    return this.callApi('getChatAdministrators', {chat_id: chatId})
  }

  getChatMember (chatId, userId) {
    return this.callApi('getChatMember', { chat_id: chatId, user_id: userId })
  }

  getChatMembersCount (chatId) {
    return this.callApi('getChatMembersCount', {chat_id: chatId})
  }

  answerInlineQuery (inlineQueryId, results, extra) {
    return this.callApi('answerInlineQuery', Object.assign({ inline_query_id: inlineQueryId, results: JSON.stringify(results) }, extra))
  }

  kickChatMember (chatId, userId) {
    return this.callApi('kickChatMember', { chat_id: chatId, user_id: userId })
  }

  leaveChat (chatId) {
    return this.callApi('leaveChat', {chat_id: chatId})
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

  editMessageText (chatId, messageId, inlineMessageId, text, extra) {
    return this.callApi('editMessageText', Object.assign({
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      text: text
    }, extra))
  }

  editMessageCaption (chatId, messageId, inlineMessageId, caption, markup) {
    return this.callApi('editMessageCaption', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      caption: caption,
      reply_markup: markup
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

  sendCopy (chatId, message, extra) {
    const type = Object.keys(replicators.copyMethods).find((type) => {
      return message[type]
    })
    if (!type) {
      throw new Error('Unsupported message type')
    }
    const opts = Object.assign({chat_id: chatId}, replicators[type](message), extra)
    return this.callApi(replicators.copyMethods[type], opts)
  }
}

Telegram.prototype.setWebHook = util.deprecate(Telegram.prototype.setWebhook, 'telegraf: `setWebHook` is deprecated. Use `setWebhook` instead. Sorry')
Telegram.prototype.removeWebHook = util.deprecate(Telegram.prototype.deleteWebhook, 'telegraf: `removeWebHook` is deprecated. Use `deleteWebhook` instead.')

module.exports = Telegram
