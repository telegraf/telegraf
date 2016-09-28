const debug = require('debug')('telegraf:api')
const crypto = require('crypto')
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const replicators = require('./replicators')
const TelegramError = require('./error')
const MultipartStream = require('./multipart-stream')
const { isStream } = MultipartStream

const defaultOptions = { apiRoot: 'https://api.telegram.org' }
const webhookBlacklist = [ 'getChat', 'getChatAdministrators', 'getChatMember', 'getChatMembersCount', 'getFile', 'getFileLink', 'getMe', 'getUserProfilePhotos' ]
const defaultExtensions = { photo: 'jpg', audio: 'mp3', voice: 'ogg', sticker: 'webp', video: 'mp4' }

class Telegram {

  /**
   * Initialize a new `Telegram` warapper.
   * @param {string} token - Telegram token.
   * @param {object} options - Additional options.
   * @param {object} webHookResponse - webhook response object.
   * @api public
   */
  constructor (token, options, webHookResponse) {
    this.token = token
    this.options = defaultOptions
    Object.assign(this.options, options)
    this.webHookResponse = webHookResponse
  }

  /**
   * @return {Promise}
   * @api public
   */
  getMe () {
    return this.callApi('getMe')
  }

  /**
   * Returns basic info about a file and prepare it for downloading.
   *
   * @param {string} fileId
   * @return {Promise}
   * @api public
   */
  getFile (fileId) {
    return this.callApi('getFile', {file_id: fileId})
  }

  /**
   * Returns temporary public link to file.
   *
   * @param {string} fileId
   * @return {Promise}
   * @api public
   */
  getFileLink (fileId) {
    return this.getFile(fileId)
      .then((file) => `${this.options.apiRoot}/file/bot${this.token}/${file.file_path}`)
  }

  /**
   * Specifies an url to receive incoming updates via an outgoing webHook.
   *
   * @param {string} url
   * @param {Object} cert
   * @return {Promise}
   * @api public
   */
  setWebHook (url, cert) {
    return this.callApi('setWebHook', {
      url: url,
      certificate: cert
    })
  }

  /**
   * Removes webhook. Shortcut for `.setWebHook('')`
   *
   * @return {Promise}
   * @api public
   */
  removeWebHook () {
    return this.callApi('setWebHook', {url: ''})
  }

  /**
   * Sends text message.
   *
   * @param {(string|number)} chatId
   * @param {string} text
   * @param {Object} extra
   * @return {Promise}
   * @api public
   */
  sendMessage (chatId, text, extra) {
    return this.callApi('sendMessage', Object.assign({
      chat_id: chatId,
      text: text
    }, extra))
  }

  /**
   * Forwards message.
   *
   * @param {(string|number)} chatId
   * @param {(string|number)} fromChatId
   * @param {number} messageId
   * @param {Object} extra
   * @return {Promise}
   * @api public
   */
  forwardMessage (chatId, fromChatId, messageId, extra) {
    return this.callApi('forwardMessage', Object.assign({
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId
    }, extra))
  }

  /**
   * Send message copy .
   *
   * @param {(string|number)} chatId
   * @param {Object} message
   * @param {Object} extra
   * @return {Promise}
   * @api public
   */
  sendCopy (chatId, message, extra) {
    const type = Object.keys(replicators.copyMethods).find((type) => {
      return message[type]
    })
    if (!type) {
      throw new TelegramError('Unknown message')
    }
    const opts = Object.assign({chat_id: chatId}, replicators[type](message), extra)
    return this.callApi(replicators.copyMethods[type], opts)
  }

  /**
   * Sends chat action.
   *
   * @param {(string|number)} chatId
   * @param {string} action
   * @return {Promise}
   * @api public
   */
  sendChatAction (chatId, action) {
    return this.callApi('sendChatAction', {
      chat_id: chatId,
      action: action
    })
  }

  /**
   * Returns profiles photos for provided user.
   *
   * @param {(string|number)} userId
   * @param {number} offset
   * @param {number} limit
   * @return {Promise}
   * @api public
   */
  getUserProfilePhotos (userId, offset, limit) {
    return this.callApi('getUserProfilePhotos', {
      user_id: userId,
      offset: offset,
      limit: limit
    })
  }

  /**
   * Sends location.
   *
   * @param {(string|number)} chatId
   * @param {number} latitude
   * @param {number} longitude
   * @param {Object} extra
   * @return {Promise}
   * @api public
   */
  sendLocation (chatId, latitude, longitude, extra) {
    return this.callApi('sendLocation', Object.assign({
      chat_id: chatId,
      latitude: latitude,
      longitude: longitude
    }, extra))
  }

  /**
   * Sends venue.
   *
   * @param {(string|number)} chatId
   * @param {number} latitude
   * @param {number} longitude
   * @param {string} title
   * @param {string} address
   * @param {Object} extra
   * @return {Promise}
   * @api public
   */
  sendVenue (chatId, latitude, longitude, title, address, extra) {
    return this.callApi('sendVenue', Object.assign({
      chat_id: chatId,
      latitude: latitude,
      longitude: longitude,
      title: title,
      address: address
    }, extra))
  }

  /**
   * Sends contact.
   *
   * @param {(string|number)} chatId
   * @param {number} phoneNumber
   * @param {number} firstName
   * @param {Object} extra
   * @return {Promise}
   * @api public
   */
  sendContact (chatId, phoneNumber, firstName, extra) {
    return this.callApi('sendContact', Object.assign({
      chat_id: chatId,
      phone_number: phoneNumber,
      first_name: firstName
    }, extra))
  }

  /**
   * Sends photo.
   *
   * @param {(string|number)} chatId
   * @param {(Object|string)} photo
   * @param {Object} extra
   * @return {Promise}
   * @api public
   */
  sendPhoto (chatId, photo, extra) {
    return this.callApi('sendPhoto', Object.assign({
      chat_id: chatId,
      photo: photo
    }, extra))
  }

  /**
   * Send document.
   *
   * @param {(string|number)} chatId
   * @param {(Object|string)} doc
   * @param {Object} extra
   * @return {Promise}
   * @api public
   */
  sendDocument (chatId, doc, extra) {
    return this.callApi('sendDocument', Object.assign({
      chat_id: chatId,
      document: doc
    }, extra))
  }

  /**
   * Sends audio.
   *
   * @param {(string|number)} chatId
   * @param {(Object|string)} audio
   * @return {Promise}
   * @api public
   */
  sendAudio (chatId, audio, extra) {
    return this.callApi('sendAudio', Object.assign({
      chat_id: chatId,
      audio: audio
    }, extra))
  }

  /**
   * Sends sticker.
   *
   * @param {(string|number)} chatId
   * @param {(Object|string)} sticker
   * @param {Object} extra
   * @return {Promise}
   * @api public
   */
  sendSticker (chatId, sticker, extra) {
    return this.callApi('sendSticker', Object.assign({
      chat_id: chatId,
      sticker: sticker
    }, extra))
  }

  /**
   * Sends video.
   *
   * @param {(string|number)} chatId
   * @param {(Object|string)} video
   * @param {Object} extra
   * @return {Promise}
   * @api public
   */
  sendVideo (chatId, video, extra) {
    return this.callApi('sendVideo', Object.assign({
      chat_id: chatId,
      video: video
    }, extra))
  }

  /**
   * Sends voice.
   *
   * @param {(string|number)} chatId
   * @param {(Object|string)} voice
   * @param {Object} extra
   * @return {Promise}
   * @api public
   */
  sendVoice (chatId, voice, extra) {
    return this.callApi('sendVoice', Object.assign({
      chat_id: chatId,
      voice: voice
    }, extra))
  }

  /**
   * Use this method to get up to date information about the chat
   * (current name of the user for one-on-one conversations,
   * current username of a user, group or channel, etc.).
   *
   * @param {(string|number)} chatId
   * @return {Promise}
   * @api public
   */
  getChat (chatId) {
    return this.callApi('getChat', {chat_id: chatId})
  }

  /**
   * Use this method to get a list of administrators in a chat.
   * On success, returns Promise with Array of ChatMember objects that contains
   * information about all chat administrators except other bots.
   * If the chat is a group or a supergroup and no administrators were appointed,
   * only the creator will be returned.
   *
   * @param {(string|number)} chatId
   * @return {Promise}
   * @api public
   */
  getChatAdministrators (chatId) {
    return this.callApi('getChatAdministrators', {chat_id: chatId})
  }

  /**
   * Use this method to get information about a member of a chat.
   *
   * @param {(string|number)} chatId
   * @param {number} userId
   * @return {Promise}
   * @api public
   */
  getChatMember (chatId, userId) {
    return this.callApi('getChatMember', {
      chat_id: chatId,
      user_id: userId
    })
  }

  /**
   * Use this method to get the number of members in a chat.
   *
   * @param {(string|number)} chatId
   * @return {Promise}
   * @api public
   */
  getChatMembersCount (chatId) {
    return this.callApi('getChatMembersCount', {chat_id: chatId})
  }

  /**
   * Use this method to send answers to an inline query.
   *
   * @param {number} inlineQueryId
   * @param {Object[]} results
   * @param {Object} extra
   * @return {Promise}
   * @api public
   */
  answerInlineQuery (inlineQueryId, results, extra) {
    return this.callApi('answerInlineQuery', Object.assign({
      inline_query_id: inlineQueryId,
      results: JSON.stringify(results)
    }, extra))
  }

  /**
   * Use this method to kick a user from a group or a supergroup.
   *
   * @param {(string|number)} chatId
   * @param {number} userId
   * @return {Promise}
   * @api public
   */
  kickChatMember (chatId, userId) {
    return this.callApi('kickChatMember', {
      chat_id: chatId,
      userId: userId
    })
  }

  /**
   * Use this method for your bot to leave a group, supergroup or channel.
   *
   * @param {(string|number)} chatId
   * @return {Promise}
   * @api public
   */
  leaveChat (chatId) {
    return this.callApi('leaveChat', {chat_id: chatId})
  }

  /**
   * Use this method to unban a previously kicked user in a supergroup.
   *
   * @param {(string|number)} chatId
   * @param {number} userId
   * @return {Promise}
   * @api public
   */
  unbanChatMember (chatId, userId) {
    return this.callApi('unbanChatMember', {
      chat_id: chatId,
      userId: userId
    })
  }

  /**
   * Use this method to send answers to callback queries.
   *
   * @param {number} callbackQueryId
   * @param {string} text
   * @param {boolean} showAlert
   * @return {Promise}
   * @api public
   */
  answerCallbackQuery (callbackQueryId, text, showAlert) {
    return this.callApi('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: showAlert
    })
  }

  /**
   * Use this method to edit text messages sent by the bot or via the bot.
   *
   * @param {(string|number)} chatId
   * @param {number} messageId
   * @param {string} inlineMessageId
   * @param {string} text
   * @param {Object} extra
   * @return {Promise}
   * @api public
   */
  editMessageText (chatId, messageId, inlineMessageId, text, extra) {
    return this.callApi('editMessageText', Object.assign({
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: messageId,
      text: text
    }, extra))
  }

  /**
   * Use this method to edit captions of messages sent by the bot or via the bot.
   *
   * @param {(string|number)} chatId
   * @param {number} messageId
   * @param {string} inlineMessageId
   * @param {string} caption
   * @param {Object} markup
   * @return {Promise}
   * @api public
   */
  editMessageCaption (chatId, messageId, inlineMessageId, caption, markup) {
    return this.callApi('editMessageCaption', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: messageId,
      caption: caption,
      reply_markup: markup
    })
  }

  /**
   * Use this method to edit only the reply markup of messages sent by the bot or via the bot.
   *
   * @param {(string|number)} chatId
   * @param {number} messageId
   * @param {string} inlineMessageId
   * @param {Object} markup
   * @return {Promise}
   * @api public
   */
  editMessageReplyMarkup (chatId, messageId, inlineMessageId, markup) {
    return this.callApi('editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: messageId,
      reply_markup: markup
    })
  }

  /**
   * Fetch updates from Telegram servers.
   *
   * @param {number} timeout
   * @param {number} limit
   * @param {number} offset
   * @return {Promise}
   * @api private
   */
  getUpdates (timeout, limit, offset) {
    return this.callApi(`getUpdates?offset=${offset}&limit=${limit}&timeout=${timeout}`)
  }

  /**
   * Send request to Telegram server
   *
   * @param {string} method - Telegram method
   * @param {Object} extra - request options
   * @return {Promise} Promise  with result
   * @api private
   */
  callApi (method, extra = {}) {
    const isMultipartRequest = Object.keys(extra).find((x) => extra[x] && (extra[x].source || extra[x].url))
    if (this.webHookResponse && !this.webHookResponse.finished && !isMultipartRequest && !webhookBlacklist.includes(method)) {
      debug('▷ webhook', method)
      extra.method = method
      if (!this.webHookResponse.headersSent) {
        this.webHookResponse.setHeader('Content-Type', 'application/json')
      }
      this.webHookResponse.end(JSON.stringify(extra))
      return Promise.resolve({
        result: true,
        _transport: 'webhook'
      })
    }

    if (!this.token) {
      throw new TelegramError('Telegram Bot Token is required')
    }

    const buildPayload = isMultipartRequest ? this.buildFormDataPayload(extra) : this.buildJSONPayload(extra)
    debug('▶︎ http', method)
    buildPayload.agent = this.options.agent
    return buildPayload
      .then((payload) => fetch(`${this.options.apiRoot}/bot${this.token}/${method}`, payload))
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          throw new TelegramError(data)
        }
        return data.result
      })
  }

  /**
   * Build json payload from options
   *
   * @param {Object} options - object
   * @return {Promise} payload
   * @api private
   */
  buildJSONPayload (options) {
    return Promise.resolve({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    })
  }

  /**
   * Build Form-Data from options
   *
   * @param {Object} options - object
   * @return {Promise} payload
   * @api private
   */
  buildFormDataPayload (options) {
    if (options.reply_markup && typeof options.reply_markup !== 'string') {
      options.reply_markup = JSON.stringify(options.reply_markup)
    }
    const boundary = crypto.randomBytes(30).toString('hex')
    const formData = new MultipartStream(boundary)
    const tasks = Object.keys(options).filter((key) => options[key]).map((key) => {
      const value = options[key]
      const valueType = typeof value
      if (valueType === 'string' || valueType === 'boolean' || valueType === 'number') {
        return formData.addPart({
          headers: { 'content-disposition': `form-data; name="${key}"` },
          body: `${value}`
        })
      }
      let fileName = value.filename || `${key}.${defaultExtensions[key] || 'dat'}`
      if (value.url) {
        return fetch(value.url).then((res) => {
          formData.addPart({
            headers: { 'content-disposition': `form-data; name="${key}";filename="${fileName}"` },
            body: res.body
          })
        })
      }
      if (value.source) {
        if (fs.existsSync(value.source)) {
          fileName = value.filename || path.basename(value.source)
          value.source = fs.createReadStream(value.source)
        }
        if (isStream(value.source) || Buffer.isBuffer(value.source)) {
          return formData.addPart({
            headers: { 'content-disposition': `form-data; name="${key}";filename="${fileName}"` },
            body: value.source
          })
        }
      }
      throw new Error('Invalid file descriptor')
    })
    return Promise.all(tasks).then(() => {
      return {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: formData
      }
    })
  }
}

module.exports = Telegram
