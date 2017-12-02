import Debug from 'debug'
import crypto from 'crypto'
import fs from 'fs'
import https from 'https'
import type { ServerResponse } from 'http'
import path from 'path'
import { Fluture, resolve, reject, tryP } from 'fluture'
import fetch from 'node-fetch'

import { TelegramError } from './telegram-error'
import { MultipartStream } from './multipart-stream'


const debug = Debug('telegraf:core')

export const webhookBlacklist = [
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
]

export const defaultExtensions = {
  audio: 'mp3',
  photo: 'jpg',
  sticker: 'webp',
  video: 'mp4',
  video_note: 'mp4',
  voice: 'ogg',
}


function attachFormMedia(form: MultipartStream, media, id: string) {
  let fileName = media.filename || `${id}.${defaultExtensions[id] || 'dat'}`

  if (media.url) {
    return fetch(media.url).then(res => form.addPart({
      headers: { 'content-disposition': `form-data; name="${id}"; filename="${fileName}"` },
      body: res.body,
    }))
  }
  if (media.source) {
    if (fs.existsSync(media.source)) {
      fileName = media.filename || path.basename(media.source)
      media.source = fs.createReadStream(media.source)
    }
    if (MultipartStream.isStream(media.source) || Buffer.isBuffer(media.source)) {
      form.addPart({
        headers: { 'content-disposition': `form-data; name="${id}"; filename="${fileName}"` },
        body: media.source,
      })
    }
  }
  return Promise.resolve()
}

function attachFormValue(form: MultipartStream, value, id) {
  if (!value) {
    return Promise.resolve()
  }
  const valueType = typeof value

  if (valueType === 'string' || valueType === 'boolean' || valueType === 'number') {
    form.addPart({
      headers: { 'content-disposition': `form-data; name="${id}"` },
      body: `${value}`,
    })
    return Promise.resolve()
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => {
      if (typeof item.media === 'object') {
        const attachmentId = crypto.randomBytes(16).toString('hex')

        return attachFormMedia(form, item.media, attachmentId)
          .then(() => Object.assign({}, item, { media: `attach://${attachmentId}` }))
      }
      return Promise.resolve(item)
    })).then(items => form.addPart({
      headers: { 'content-disposition': `form-data; name="${id}"` },
      body: JSON.stringify(items),
    }))
  }
  return attachFormMedia(form, value, id)
}


interface Payload {
  webhook?: boolean,
  method: string,
  headers: {[key: string]: string},
  body: string | MultipartStream,
  agent?: https.Agent,
}

interface FormDataPayload {
  reply_markup?: string,
  [key: string]: any,
}

function buildJSONPayload(options: any): Fluture<$Shape<Payload>, Error> {
  return resolve({
    method: 'POST',
    headers: { 'content-type': 'application/json', connection: 'keep-alive' },
    body: JSON.stringify(options),
  })
}

function buildFormDataPayload(options: $Shape<FormDataPayload>): Fluture<$Shape<Payload>, Error> {
  if (options.reply_markup && typeof options.reply_markup !== 'string') {
    options.reply_markup = JSON.stringify(options.reply_markup)
  }
  const boundary = crypto.randomBytes(32).toString('hex')
  const formData = new MultipartStream(boundary)
  const tasks = Object.keys(options).map(key => attachFormValue(formData, options[key], key))

  return tryP(() => Promise.all(tasks))
    .map(() => ({
      method: 'POST',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}`, connection: 'keep-alive' },
      body: formData,
    }))
}


function request<+R>(root: string, token: string, method: string, extra: {})
    : Fluture<R, TelegramError> {
  return tryP(() => fetch(`${root}/bot${token}/${method}`)
    .then(res => res.text())
    .catch((error) => {
      throw new TelegramError(error.text, { method, extra })
    })
    .then((text): ({ result: R }) => {
      try {
        return JSON.parse(text)
      }
      catch (error) {
        throw new TelegramError(error, { method, extra })
      }
    })
    .then(data => data.result))
}

export interface Options {
  apiRoot: string,
  webhookReply: boolean,
  agent: https.Agent,
}

export const defaultOptions: Options = {
  apiRoot: 'https://api.telegram.org',
  webhookReply: true,
  agent: new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 10000,
  }),
}

interface ExtendedServerResponse extends ServerResponse {
  header?: {
    connection: string,
    'content-type': string,
  },
  body?: any
}

export class ApiClient {
  token: string
  options: Options
  response: ExtendedServerResponse

  constructor(token: string, options: $Shape<Options>, webhookResponse: ExtendedServerResponse) {
    this.token = token
    this.options = Object.assign({}, defaultOptions, options)
    this.response = webhookResponse
  }

  setWebhookReply(enabled: boolean) {
    this.options.webhookReply = enabled
  }

  getWebhookReply() {
    return this.options.webhookReply
  }

  callApi<R>(method: string, extra: {[key: string]: any})
      : Fluture<R | { webhook: true }, TelegramError> {
    const isMultipartRequest = Object.keys(extra)
      .filter(x => extra[x])
      .some(x => Array.isArray(extra[x])
        ? extra[x].some(child => typeof child.media === 'object' && (child.media.source || child.media.url))
        : extra[x].source || extra[x].url)

    if (
      this.options.webhookReply
      && !isMultipartRequest
      && this.response
      && !this.response.finished
      && !webhookBlacklist.includes(method)) {
      debug('▷ webhook', method)
      extra.method = method

      if (typeof this.response.end === 'function') {
        if (!this.response.headersSent) {
          this.response.setHeader('connection', 'keep-alive')
          this.response.setHeader('content-type', 'application/json')
        }
        this.response.end(JSON.stringify(extra))
      }
      else if (typeof this.response.header === 'object') {
        // TODO: review response.header
        if (this.response.header == null) {
          this.response.header = {}
        }
        Object.assign(this.response.header, {
          connection: 'keep-alive',
          'content-type': 'application/json',
        })
        this.response.body = extra
      }
      return resolve({ webhook: true })
    }

    if (!this.token) {
      return reject(new TelegramError({
        error_code: 401,
        description: 'Bot Token is required',
      }))
    }

    debug('▶︎ http', method)
    const buildPayload = isMultipartRequest
      ? buildFormDataPayload(extra)
      : buildJSONPayload(extra)

    return buildPayload
      .chain((payload) => {
        payload.agent = this.options.agent
        return request(this.options.apiRoot, this.token, method, extra)
      })
      .chainRej(err => reject(new TelegramError(err.message, { method, extra })))
  }
}

