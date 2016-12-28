const debug = require('debug')('telegraf:api')
const crypto = require('crypto')
const fetch = require('node-fetch')
const fs = require('fs')
const https = require('https')
const path = require('path')
const TelegramError = require('./error')
const MultipartStream = require('./multipart-stream')

const { isStream } = MultipartStream

const webhookBlacklist = [
  'getChat',
  'getChatAdministrators',
  'getChatMember',
  'getChatMembersCount',
  'getFile',
  'getFileLink',
  'getGameHighScores',
  'getMe',
  'getUserProfilePhotos',
  'getWebhookInfo'
]

const defaultExtensions = {
  photo: 'jpg',
  audio: 'mp3',
  voice: 'ogg',
  sticker: 'webp',
  video: 'mp4'
}

const defaultOptions = {
  apiRoot: 'https://api.telegram.org',
  webhookReply: true,
  agent: new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 10000
  })
}

class ApiClient {

  constructor (token, options, webhookResponse) {
    this.token = token
    this.options = Object.assign({}, defaultOptions, options)
    this.response = webhookResponse
  }

  set webhookReply (enable) {
    this.options.webhookReply = enable
  }

  get webhookReply () {
    return this.options.webhookReply
  }

  callApi (method, extra = {}) {
    const isMultipart = Object.keys(extra).find((x) => extra[x] && (extra[x].source || extra[x].url))
    if (this.options.webhookReply && this.response && !this.response.finished && !isMultipart && !webhookBlacklist.includes(method)) {
      debug('▷ webhook', method)
      extra.method = method
      if (!this.response.headersSent) {
        this.response.setHeader('connection', 'keep-alive')
        this.response.setHeader('content-type', 'application/json')
      }
      this.response.end(JSON.stringify(extra))
      return Promise.resolve({webhook: true})
    }

    if (!this.token) {
      throw new TelegramError({
        error_code: 401,
        description: 'Bot Token is required'
      })
    }

    debug('▶︎ http', method)
    const buildPayload = isMultipart ? this.buildFormDataPayload(extra) : this.buildJSONPayload(extra)
    return buildPayload
      .then((payload) => {
        payload.agent = this.options.agent
        return fetch(`${this.options.apiRoot}/bot${this.token}/${method}`, payload)
      })
      .then((res) => res.text())
      .then((text) => {
        try {
          return JSON.parse(text)
        } catch (err) {
          throw new TelegramError({
            error_code: 500,
            description: 'Unsupported message received from Telegram',
            response: text
          })
        }
      })
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
      headers: { 'content-type': 'application/json', 'connection': 'keep-alive' },
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
        headers: { 'content-type': `multipart/form-data; boundary=${boundary}`, 'connection': 'keep-alive' },
        body: formData
      }
    })
  }
}

module.exports = ApiClient
