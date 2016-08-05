const debug = require('debug')('telegraf:api')
const Promise = require('bluebird')
const { SandwichStream } = require('sandwich-stream')
const crypto = require('crypto')
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const stream = require('stream')
const platform = require('./platform')
const CRNL = '\r\n'

/**
 * Represents a Telegram api.
 * @constructor
 * @param {string} token - Telegram token.
 * @param {object} options - Additional options.
 */
class Telegram {

  constructor (token, options) {
    this.token = token
    this.options = Object.assign({apiRoot: 'https://api.telegram.org'}, options)
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
    return this.getFile(fileId).then((result) => `${this.options.apiRoot}/file/bot${this.token}/${result.file_path}`)
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
    var options = {
      url: url,
      certificate: cert
    }
    return this.callApi('setWebHook', options)
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
    var options = {
      chat_id: chatId,
      text: text
    }
    return this.callApi('sendMessage', Object.assign(options, extra))
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
    var options = {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId
    }
    return this.callApi('forwardMessage', Object.assign(options, extra))
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
    var params = {}
    var methodName
    Object.keys(platform.copyMethods).forEach((type) => {
      if (message[type]) {
        params = Object.assign(params, platform.replicators[type](message))
        methodName = platform.copyMethods[type]
      }
    })
    const opts = Object.assign({chat_id: chatId}, params, extra)
    return this.callApi(methodName, opts)
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
    var options = {
      chat_id: chatId,
      action: action
    }
    return this.callApi('sendChatAction', options)
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
    var options = {
      user_id: userId,
      offset: offset,
      limit: limit
    }
    return this.callApi('getUserProfilePhotos', options)
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
    var options = {
      chat_id: chatId,
      latitude: latitude,
      longitude: longitude
    }
    return this.callApi('sendLocation', Object.assign(options, extra))
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
    var options = {
      chat_id: chatId,
      latitude: latitude,
      longitude: longitude,
      title: title,
      address: address
    }
    return this.callApi('sendVenue', Object.assign(options, extra))
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
    var options = {
      chat_id: chatId,
      phone_number: phoneNumber,
      first_name: firstName
    }
    return this.callApi('sendContact', Object.assign(options, extra))
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
    var options = {
      chat_id: chatId,
      photo: photo
    }
    return this.callApi('sendPhoto', Object.assign(options, extra))
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
    var options = {
      chat_id: chatId,
      document: doc
    }
    return this.callApi('sendDocument', Object.assign(options, extra))
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
    var options = {
      chat_id: chatId,
      audio: audio
    }
    return this.callApi('sendAudio', Object.assign(options, extra))
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
    var options = {
      chat_id: chatId,
      sticker: sticker
    }
    return this.callApi('sendSticker', Object.assign(options, extra))
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
    var options = {
      chat_id: chatId,
      video: video
    }
    return this.callApi('sendVideo', Object.assign(options, extra))
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
    var options = {
      chat_id: chatId,
      voice: voice
    }
    return this.callApi('sendVoice', Object.assign(options, extra))
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
    var options = {
      chat_id: chatId,
      user_id: userId
    }
    return this.callApi('getChatMember', options)
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
    var options = {
      inline_query_id: inlineQueryId,
      results: JSON.stringify(results)
    }
    return this.callApi('answerInlineQuery', Object.assign(options, extra))
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
    var options = {
      chat_id: chatId,
      userId: userId
    }
    return this.callApi('kickChatMember', options)
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
    var options = {
      chat_id: chatId,
      userId: userId
    }
    return this.callApi('unbanChatMember', options)
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
    var options = {
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: showAlert
    }
    return this.callApi('answerCallbackQuery', options)
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
    var options = {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: messageId,
      text: text
    }
    return this.callApi('editMessageText', Object.assign(options, extra))
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
    var options = {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: messageId,
      caption: caption,
      reply_markup: markup
    }
    return this.callApi('editMessageCaption', options)
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
    var options = {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: messageId,
      reply_markup: markup
    }
    return this.callApi('editMessageReplyMarkup', options)
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
   * @param {Object} options - request options
   * @return {Promise} Promise  with result
   * @api private
   */
  callApi (method, options) {
    options = Object.assign({}, options)
    const isMultipart = Object.keys(options).filter((x) => options[x] && (options[x].source || options[x].url)).length > 0
    const webHookResponse = this.options.webHookResponse
    if (webHookResponse && !webHookResponse.finished && !isMultipart && platform.webHookAnswerBlacklist.indexOf(method) === -1) {
      debug('▷ webhook', method)
      options.method = method
      if (!webHookResponse.headersSent) {
        webHookResponse.setHeader('Content-Type', 'application/json')
      }
      webHookResponse.end(JSON.stringify(options))
      return Promise.resolve({
        result: true,
        _transport: 'webhook'
      })
    }

    if (!this.token) {
      throw new Error('Telegram Bot Token is required')
    }

    const buildPayload = isMultipart
      ? this.buildFormDataPayload(options)
      : this.buildJSONPayload(options)
    debug('▶︎ http', method)
    return buildPayload
      .then((payload) => fetch(`${this.options.apiRoot}/bot${this.token}/${method}`, payload))
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          return Promise.resolve(data.result)
        }
        throw new TelegramError(data)
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
      body: JSON.stringify(options),
      agent: this.options.agent
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
    const formData = new Multipart(boundary)
    const tasks = Object.keys(options).filter((key) => options[key])

    return Promise.resolve(tasks).map((key) => {
      const value = options[key]
      const valueType = typeof value

      if (valueType === 'string' || valueType === 'boolean' || valueType === 'number') {
        return formData.addPart({
          headers: { 'content-disposition': `form-data; name="${key}"` },
          body: '' + value,
          agent: this.options.agent
        })
      }

      var fileName = value.filename || `${key}.${platform.defaultExtensions[key] || 'dat'}`

      if (value.url) {
        return fetch(value.url)
          .then((res) => {
            formData.addPart({
              headers: { 'content-disposition': `form-data; name="${key}";filename="${fileName}"` },
              body: res.body,
              agent: this.options.agent
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
            body: value.source,
            agent: this.options.agent
          })
        }
      }
      throw new Error('Invalid file descriptor')
    }).then(() => {
      return Promise.resolve({
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: formData,
        agent: this.options.agent
      })
    })
  }
}

/**
 * Represents a Telegram error.
 */
class TelegramError extends Error {
  constructor (payload) {
    payload = payload || {}
    super(`${payload.error_code}: ${payload.description}`)
    this.code = payload.error_code
    this.description = payload.description
  }
}

/**
 * Multipart request.
 * @param {object} [opts]
 * @param {string} [opts.boundary] - The boundary to be used.
 * @returns {function} Returns the multipart stream.
 */
class Multipart extends SandwichStream {
  constructor (boundary) {
    boundary = boundary || Math.random().toString(36).slice(2)
    super({
      head: `--${boundary}${CRNL}`,
      tail: `${CRNL}--${boundary}--`,
      separator: `${CRNL}--${boundary}${CRNL}`
    })
  }

  addPart (part) {
    part = part || {}
    const partStream = new stream.PassThrough()
    if (part.headers) {
      for (let key in part.headers) {
        const header = part.headers[key]
        partStream.write(`${key}:${header}${CRNL}`)
      }
    }
    partStream.write(CRNL)
    if (isStream(part.body)) {
      part.body.pipe(partStream)
    } else {
      partStream.end(part.body)
    }
    this.add(partStream)
  }
}

function isStream (stream) {
  return stream && typeof stream === 'object' && typeof stream.pipe === 'function'
}

Telegram.TelegramError = TelegramError

module.exports = Telegram
