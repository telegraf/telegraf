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

  constructor (token, options, webHookResponse) {
    this.token = token
    this.options = defaultOptions
    Object.assign(this.options, options)
    this.webHookResponse = webHookResponse
  }

  getMe () {
    return this.callApi('getMe')
  }

  getFile (fileId) {
    return this.callApi('getFile', {file_id: fileId})
  }

  getFileLink (fileId) {
    return this.getFile(fileId).then((file) => `${this.options.apiRoot}/file/bot${this.token}/${file.file_path}`)
  }

  setWebHook (url, cert) {
    return this.callApi('setWebHook', {
      url: url,
      certificate: cert
    })
  }

  removeWebHook () {
    return this.callApi('setWebHook', {url: ''})
  }

  sendMessage (chatId, text, extra) {
    return this.callApi('sendMessage', Object.assign({
      chat_id: chatId,
      text: text
    }, extra))
  }

  forwardMessage (chatId, fromChatId, messageId, extra) {
    return this.callApi('forwardMessage', Object.assign({
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId
    }, extra))
  }

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

  sendChatAction (chatId, action) {
    return this.callApi('sendChatAction', {
      chat_id: chatId,
      action: action
    })
  }

  getUserProfilePhotos (userId, offset, limit) {
    return this.callApi('getUserProfilePhotos', {
      user_id: userId,
      offset: offset,
      limit: limit
    })
  }

  sendLocation (chatId, latitude, longitude, extra) {
    return this.callApi('sendLocation', Object.assign({
      chat_id: chatId,
      latitude: latitude,
      longitude: longitude
    }, extra))
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
    return this.callApi('sendContact', Object.assign({
      chat_id: chatId,
      phone_number: phoneNumber,
      first_name: firstName
    }, extra))
  }

  sendPhoto (chatId, photo, extra) {
    return this.callApi('sendPhoto', Object.assign({
      chat_id: chatId,
      photo: photo
    }, extra))
  }

  sendDocument (chatId, doc, extra) {
    return this.callApi('sendDocument', Object.assign({
      chat_id: chatId,
      document: doc
    }, extra))
  }

  sendAudio (chatId, audio, extra) {
    return this.callApi('sendAudio', Object.assign({
      chat_id: chatId,
      audio: audio
    }, extra))
  }

  sendSticker (chatId, sticker, extra) {
    return this.callApi('sendSticker', Object.assign({
      chat_id: chatId,
      sticker: sticker
    }, extra))
  }

  sendVideo (chatId, video, extra) {
    return this.callApi('sendVideo', Object.assign({
      chat_id: chatId,
      video: video
    }, extra))
  }

  sendVoice (chatId, voice, extra) {
    return this.callApi('sendVoice', Object.assign({
      chat_id: chatId,
      voice: voice
    }, extra))
  }

  getChat (chatId) {
    return this.callApi('getChat', {chat_id: chatId})
  }

  getChatAdministrators (chatId) {
    return this.callApi('getChatAdministrators', {chat_id: chatId})
  }

  getChatMember (chatId, userId) {
    return this.callApi('getChatMember', {
      chat_id: chatId,
      user_id: userId
    })
  }

  getChatMembersCount (chatId) {
    return this.callApi('getChatMembersCount', {chat_id: chatId})
  }

  answerInlineQuery (inlineQueryId, results, extra) {
    return this.callApi('answerInlineQuery', Object.assign({
      inline_query_id: inlineQueryId,
      results: JSON.stringify(results)
    }, extra))
  }

  kickChatMember (chatId, userId) {
    return this.callApi('kickChatMember', {
      chat_id: chatId,
      userId: userId
    })
  }

  leaveChat (chatId) {
    return this.callApi('leaveChat', {chat_id: chatId})
  }

  unbanChatMember (chatId, userId) {
    return this.callApi('unbanChatMember', {
      chat_id: chatId,
      userId: userId
    })
  }

  answerCallbackQuery (callbackQueryId, text, showAlert) {
    return this.callApi('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: showAlert
    })
  }

  editMessageText (chatId, messageId, inlineMessageId, text, extra) {
    return this.callApi('editMessageText', Object.assign({
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: messageId,
      text: text
    }, extra))
  }

  editMessageCaption (chatId, messageId, inlineMessageId, caption, markup) {
    return this.callApi('editMessageCaption', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: messageId,
      caption: caption,
      reply_markup: markup
    })
  }

  editMessageReplyMarkup (chatId, messageId, inlineMessageId, markup) {
    return this.callApi('editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: messageId,
      reply_markup: markup
    })
  }

  getUpdates (timeout, limit, offset) {
    return this.callApi(`getUpdates?offset=${offset}&limit=${limit}&timeout=${timeout}`)
  }

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

  buildJSONPayload (options) {
    return Promise.resolve({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    })
  }

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
