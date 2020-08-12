/* eslint @typescript-eslint/restrict-template-expressions: [ "error", { "allowAny": true } ] */
import * as crypto from 'crypto'
import * as fs from 'fs'
import type * as http from 'http'
import * as https from 'https'
import * as path from 'path'
import fetch, { RequestInit } from 'node-fetch'
import MultipartStream from './multipart-stream'
import TelegramError from './error'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('telegraf:client')
const { isStream } = MultipartStream

const WEBHOOK_BLACKLIST = [
  'getChat',
  'getChatAdministrators',
  'getChatMember',
  'getChatMembersCount',
  'getFile',
  'getFileLink',
  'getGameHighScores',
  'getMe',
  'getUserProfilePhotos',
  'getWebhookInfo',
  'exportChatInviteLink',
]

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace ApiClient {
  export interface Options {
    agent?: https.Agent | http.Agent
    apiRoot: string
    webhookReply: boolean
  }
}

const DEFAULT_EXTENSIONS = {
  audio: 'mp3',
  photo: 'jpg',
  sticker: 'webp',
  video: 'mp4',
  animation: 'mp4',
  video_note: 'mp4',
  voice: 'ogg',
}

const DEFAULT_OPTIONS = {
  apiRoot: 'https://api.telegram.org',
  webhookReply: true,
  agent: new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 10000,
  }),
}

const WEBHOOK_REPLY_STUB = {
  webhook: true,
  details:
    'https://core.telegram.org/bots/api#making-requests-when-getting-updates',
}

// prettier-ignore
function includesMedia (payload) {
  return Object.keys(payload).some(
    (key) => {
      const value = payload[key]
      if (Array.isArray(value)) {
        return value.some(({ media }) => media && typeof media === 'object' && (media.source || media.url))
      }
      return (typeof value === 'object') && (
        value.source ||
        value.url ||
        (typeof value.media === 'object' && (value.media.source || value.media.url))
      )
    }
  )
}

function buildJSONConfig(payload): Promise<RequestInit> {
  return Promise.resolve({
    method: 'POST',
    compress: true,
    headers: { 'content-type': 'application/json', connection: 'keep-alive' },
    body: JSON.stringify(payload),
  })
}

const FORM_DATA_JSON_FIELDS = [
  'results',
  'reply_markup',
  'mask_position',
  'shipping_options',
  'errors',
]

function buildFormDataConfig(payload, agent): Promise<RequestInit> {
  for (const field of FORM_DATA_JSON_FIELDS) {
    if (field in payload && typeof payload[field] !== 'string') {
      payload[field] = JSON.stringify(payload[field])
    }
  }
  const boundary = crypto.randomBytes(32).toString('hex')
  const formData = new MultipartStream(boundary)
  const tasks = Object.keys(payload).map((key) =>
    attachFormValue(formData, key, payload[key], agent)
  )
  return Promise.all(tasks).then(() => {
    return {
      method: 'POST',
      compress: true,
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
        connection: 'keep-alive',
      },
      body: formData,
    }
  })
}

// prettier-ignore
function attachFormValue (form, id, value, agent) {
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
  if (id === 'thumb') {
    const attachmentId = crypto.randomBytes(16).toString('hex')
    return attachFormMedia(form, value, attachmentId, agent)
      .then(() => form.addPart({
        headers: { 'content-disposition': `form-data; name="${id}"` },
        body: `attach://${attachmentId}`
      }))
  }
  if (Array.isArray(value)) {
    return Promise.all(
      value.map((item) => {
        if (typeof item.media !== 'object') {
          return Promise.resolve(item)
        }
        const attachmentId = crypto.randomBytes(16).toString('hex')
        return attachFormMedia(form, item.media, attachmentId, agent)
          .then(() => ({ ...item, media: `attach://${attachmentId}` }))
      })
    ).then((items) => form.addPart({
      headers: { 'content-disposition': `form-data; name="${id}"` },
      body: JSON.stringify(items)
    }))
  }
  if (typeof value.media !== 'undefined' && typeof value.type !== 'undefined') {
    const attachmentId = crypto.randomBytes(16).toString('hex')
    return attachFormMedia(form, value.media, attachmentId, agent)
      .then(() => form.addPart({
        headers: { 'content-disposition': `form-data; name="${id}"` },
        body: JSON.stringify({
          ...value,
          media: `attach://${attachmentId}`
        })
      }))
  }
  return attachFormMedia(form, value, id, agent)
}

// prettier-ignore
function attachFormMedia (form, media, id, agent) {
  let fileName = media.filename || `${id}.${DEFAULT_EXTENSIONS[id] || 'dat'}`
  if (media.url) {
    return fetch(media.url, { agent }).then((res) =>
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

// prettier-ignore
function isKoaResponse (response) {
  return typeof response.set === 'function' && typeof response.header === 'object'
}

function answerToWebhook(response, payload, options: ApiClient.Options) {
  if (!includesMedia(payload)) {
    if (isKoaResponse(response)) {
      response.body = payload
      return Promise.resolve(WEBHOOK_REPLY_STUB)
    }
    if (!response.headersSent) {
      response.setHeader('content-type', 'application/json')
    }
    return new Promise((resolve) => {
      if (response.end.length === 2) {
        response.end(JSON.stringify(payload), 'utf-8')
        return resolve(WEBHOOK_REPLY_STUB)
      }
      response.end(JSON.stringify(payload), 'utf-8', () =>
        resolve(WEBHOOK_REPLY_STUB)
      )
    })
  }

  return buildFormDataConfig(payload, options.agent).then(
    ({ headers = {}, body }) => {
      if (isKoaResponse(response)) {
        Object.keys(headers).forEach((key) => response.set(key, headers[key]))
        response.body = body
        return Promise.resolve(WEBHOOK_REPLY_STUB)
      }
      if (!response.headersSent) {
        Object.keys(headers).forEach((key) =>
          response.setHeader(key, headers[key])
        )
      }
      return new Promise((resolve) => {
        response.on('finish', () => resolve(WEBHOOK_REPLY_STUB))
        // @ts-expect-error
        body.pipe(response)
      })
    }
  )
}

// eslint-disable-next-line no-redeclare
class ApiClient {
  readonly options: ApiClient.Options
  private responseEnd = false

  constructor(
    public token: string,
    options?: Partial<ApiClient.Options>,
    private readonly response?
  ) {
    this.token = token
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    }
    if (this.options.apiRoot.startsWith('http://')) {
      this.options.agent = undefined
    }
  }

  set webhookReply(enable: boolean) {
    this.options.webhookReply = enable
  }

  get webhookReply() {
    return this.options.webhookReply
  }

  callApi(method: string, data = {}) {
    const { token, options, response, responseEnd } = this

    const payload = Object.keys(data)
      .filter((key) => typeof data[key] !== 'undefined' && data[key] !== null)
      .reduce((acc, key) => ({ ...acc, [key]: data[key] }), {})

    if (
      options.webhookReply &&
      response &&
      !responseEnd &&
      !WEBHOOK_BLACKLIST.includes(method)
    ) {
      debug('Call via webhook', method, payload)
      this.responseEnd = true
      return answerToWebhook(response, { method, ...payload }, options)
    }

    if (!token) {
      throw new TelegramError({
        error_code: 401,
        description: 'Bot Token is required',
      })
    }

    debug('HTTP call', method, payload)
    const buildConfig = includesMedia(payload)
      ? buildFormDataConfig({ method, ...payload }, options.agent)
      : buildJSONConfig(payload)
    return buildConfig
      .then((config) => {
        const apiUrl = `${options.apiRoot}/bot${token}/${method}`
        config.agent = options.agent
        return fetch(apiUrl, config)
      })
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          debug('API call failed', data)
          throw new TelegramError(data, { method, payload })
        }
        return data.result
      })
  }
}

export = ApiClient
