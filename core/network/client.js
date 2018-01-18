const debug = require('debug')('telegraf:api')
const crypto = require('crypto')
const fetch = require('node-fetch')
const fs = require('fs')
const https = require('https')
const path = require('path')
const TelegramError = require('./error')
const MultipartStream = require('./multipart-stream')
const { isStream } = MultipartStream

const WebhookBlacklist = [
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

const DefaultExtensions = {
  audio: 'mp3',
  photo: 'jpg',
  sticker: 'webp',
  video: 'mp4',
  video_note: 'mp4',
  voice: 'ogg'
}

const DefaultOptions = {
  apiRoot: 'https://api.telegram.org',
  webhookReply: true,
  agent: new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 10000
  })
}

const WebhookReplyStub = {
  webhook: true
}

function safeJSONParse (text) {
  try {
    return JSON.parse(text)
  } catch (err) {
    debug('JSON parse failed', err)
  }
}

function includesMedia (payload) {
  return Object.keys(payload).some(
    (key) => Array.isArray(payload[key])
      ? payload[key].some(({ media }) => media && typeof media === 'object' && (media.source || media.url))
      : payload[key] && typeof payload[key] === 'object' && (payload[key].source || payload[key].url)
  )
}

class ApiClient {
  constructor (token, options, webhookResponse) {
    this.token = token
    this.options = Object.assign({}, DefaultOptions, options)
    if (this.options.apiRoot.startsWith('http://')) {
      this.options.agent = null
    }
    this.response = webhookResponse
  }

  set webhookReply (enable) {
    this.options.webhookReply = enable
  }

  get webhookReply () {
    return this.options.webhookReply
  }

  callApi (method, payload = {}) {
    const response = this.response
    if (
      this.options.webhookReply &&
      !this.responseEnd &&
      response &&
      !WebhookBlacklist.includes(method) &&
      !includesMedia(payload)
    ) {
      debug('▷ webhook', method)
      this.responseEnd = true
      const answer = Object.assign({ method }, payload)
      if (typeof response.header === 'object') {
        response.body = answer
        return Promise.resolve(WebhookReplyStub)
      }
      if (!response.headersSent) {
        response.setHeader('content-type', 'application/json')
      }
      return new Promise((resolve) =>
        response.end(JSON.stringify(answer), 'utf-8', () => resolve(WebhookReplyStub))
      )
    }

    if (!this.token) {
      throw new TelegramError({
        error_code: 401,
        description: 'Bot Token is required'
      })
    }

    debug('▶︎ http', method)
    return this.buildFetchConfig(payload)
      .then((config) => {
        const apiUrl = `${this.options.apiRoot}/bot${this.token}/${method}`
        config.agent = this.options.agent
        return fetch(apiUrl, config)
      })
      .then((res) => res.text())
      .then((text) => {
        return safeJSONParse(text) || {
          error_code: 500,
          description: 'Unsupported message from Telegram',
          response: text
        }
      })
      .then((data) => {
        if (data.ok) {
          return data.result
        }
        throw new TelegramError(data, { method, payload })
      })
  }

  buildFetchConfig (payload) {
    return includesMedia(payload)
      ? this.buildFormDataConfig(payload)
      : this.buildJSONConfig(payload)
  }

  buildJSONConfig (options) {
    return Promise.resolve({
      method: 'POST',
      compress: true,
      headers: { 'content-type': 'application/json', 'connection': 'keep-alive' },
      body: JSON.stringify(options)
    })
  }

  buildFormDataConfig (options) {
    if (options.reply_markup && typeof options.reply_markup !== 'string') {
      options.reply_markup = JSON.stringify(options.reply_markup)
    }
    const boundary = crypto.randomBytes(32).toString('hex')
    const formData = new MultipartStream(boundary)
    const tasks = Object.keys(options).map((key) => attachFormValue(formData, options[key], key))
    return Promise.all(tasks).then(() => {
      return {
        method: 'POST',
        compress: true,
        headers: { 'content-type': `multipart/form-data; boundary=${boundary}`, 'connection': 'keep-alive' },
        body: formData
      }
    })
  }
}

function attachFormValue (form, value, id) {
  if (!value) {
    return Promise.resolve()
  }
  const valueType = typeof value
  if (valueType === 'string' || valueType === 'boolean' || valueType === 'number') {
    form.addPart({
      headers: { 'content-disposition': `form-data; name="${id}"` },
      body: `${value}`
    })
    return Promise.resolve()
  }
  if (Array.isArray(value)) {
    return Promise.all(
      value.map((item) => {
        if (typeof item.media !== 'object') {
          return Promise.resolve(item)
        }
        const attachmentId = crypto.randomBytes(16).toString('hex')
        return attachFormMedia(form, item.media, attachmentId)
          .then(() => Object.assign({}, item, { media: `attach://${attachmentId}` }))
      })
    ).then((items) => form.addPart({
      headers: { 'content-disposition': `form-data; name="${id}"` },
      body: JSON.stringify(items)
    }))
  }
  return attachFormMedia(form, value, id)
}

function attachFormMedia (form, media, id) {
  let fileName = media.filename || `${id}.${DefaultExtensions[id] || 'dat'}`
  if (media.url) {
    return fetch(media.url).then((res) =>
      form.addPart({
        headers: { 'content-disposition': `form-data; name="${id}"; filename="${fileName}"` },
        body: res.body
      })
    )
  }
  if (media.source) {
    if (fs.existsSync(media.source)) {
      fileName = media.filename || path.basename(media.source)
      media.source = fs.createReadStream(media.source)
    }
    if (isStream(media.source) || Buffer.isBuffer(media.source)) {
      form.addPart({
        headers: { 'content-disposition': `form-data; name="${id}"; filename="${fileName}"` },
        body: media.source
      })
    }
  }
  return Promise.resolve()
}

module.exports = ApiClient
