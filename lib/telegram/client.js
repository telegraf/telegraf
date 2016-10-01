const debug = require('debug')('telegraf:api')
const crypto = require('crypto')
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const TelegramError = require('./error')
const MultipartStream = require('./multipart-stream')
const { isStream } = MultipartStream

const defaultOptions = { apiRoot: 'https://api.telegram.org' }
const webhookBlacklist = [ 'getChat', 'getChatAdministrators', 'getChatMember', 'getChatMembersCount', 'getFile', 'getFileLink', 'getMe', 'getUserProfilePhotos' ]
const defaultExtensions = { photo: 'jpg', audio: 'mp3', voice: 'ogg', sticker: 'webp', video: 'mp4' }

class TelegramClient {

  constructor (token, options, webHookResponse) {
    this.token = token
    this.options = defaultOptions
    Object.assign(this.options, options)
    this.webHookResponse = webHookResponse
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

module.exports = TelegramClient
