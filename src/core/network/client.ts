/* eslint @typescript-eslint/restrict-template-expressions: [ "error", { "allowNumber": true, "allowBoolean": true } ] */
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as http from 'http'
import * as https from 'https'
import * as path from 'path'
import fetch, { RequestInfo, RequestInit } from 'node-fetch'
import { hasProp, hasPropType } from '../../util'
import { Opts, Telegram } from 'typegram'
import MultipartStream from './multipart-stream'
import { ReadStream } from 'fs'
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
} as const

function includesMedia(payload: Record<string, unknown>) {
  return Object.values(payload).some((value) => {
    if (Array.isArray(value)) {
      return value.some(
        ({ media }) =>
          media && typeof media === 'object' && (media.source || media.url)
      )
    }
    return (
      value &&
      typeof value === 'object' &&
      ((hasProp(value, 'source') && value.source) ||
        (hasProp(value, 'url') && value.url) ||
        (hasPropType(value, 'media', 'object') &&
          ((hasProp(value.media, 'source') && value.media.source) ||
            (hasProp(value.media, 'url') && value.media.url))))
    )
  })
}

function replacer(_: unknown, value: unknown) {
  if (value == null) return undefined
  return value
}

function buildJSONConfig(payload: unknown): Promise<RequestInit> {
  return Promise.resolve({
    method: 'POST',
    compress: true,
    headers: { 'content-type': 'application/json', connection: 'keep-alive' },
    body: JSON.stringify(payload, replacer),
  })
}

const FORM_DATA_JSON_FIELDS = [
  'results',
  'reply_markup',
  'mask_position',
  'shipping_options',
  'errors',
]

async function buildFormDataConfig(
  payload: Record<string, unknown>,
  agent: RequestInit['agent']
): Promise<RequestInit> {
  for (const field of FORM_DATA_JSON_FIELDS) {
    if (hasProp(payload, field) && typeof payload[field] !== 'string') {
      payload[field] = JSON.stringify(payload[field])
    }
  }
  const boundary = crypto.randomBytes(32).toString('hex')
  const formData = new MultipartStream(boundary)
  const tasks = Object.keys(payload).map((key) =>
    attachFormValue(formData, key, payload[key], agent)
  )
  await Promise.all(tasks)
  return {
    method: 'POST',
    compress: true,
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      connection: 'keep-alive',
    },
    body: formData,
  }
}

async function attachFormValue(
  form: MultipartStream,
  id: string,
  value: unknown,
  agent: RequestInit['agent']
) {
  if (value == null) {
    return
  }
  if (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    form.addPart({
      headers: { 'content-disposition': `form-data; name="${id}"` },
      body: `${value}`,
    })
    return
  }
  if (id === 'thumb') {
    const attachmentId = crypto.randomBytes(16).toString('hex')
    await attachFormMedia(form, value as FormMedia, attachmentId, agent)
    return form.addPart({
      headers: { 'content-disposition': `form-data; name="${id}"` },
      body: `attach://${attachmentId}`,
    })
  }
  if (Array.isArray(value)) {
    const items = await Promise.all(
      value.map(async (item) => {
        if (typeof item.media !== 'object') {
          return await Promise.resolve(item)
        }
        const attachmentId = crypto.randomBytes(16).toString('hex')
        await attachFormMedia(form, item.media, attachmentId, agent)
        return { ...item, media: `attach://${attachmentId}` }
      })
    )
    return form.addPart({
      headers: { 'content-disposition': `form-data; name="${id}"` },
      body: JSON.stringify(items),
    })
  }
  if (
    value &&
    typeof value === 'object' &&
    hasProp(value, 'media') &&
    hasProp(value, 'type') &&
    typeof value.media !== 'undefined' &&
    typeof value.type !== 'undefined'
  ) {
    const attachmentId = crypto.randomBytes(16).toString('hex')
    await attachFormMedia(form, value.media as FormMedia, attachmentId, agent)
    return form.addPart({
      headers: { 'content-disposition': `form-data; name="${id}"` },
      body: JSON.stringify({
        ...value,
        media: `attach://${attachmentId}`,
      }),
    })
  }
  return await attachFormMedia(form, value as FormMedia, id, agent)
}

interface FormMedia {
  filename?: string
  url?: RequestInfo
  source?: string
}
async function attachFormMedia(
  form: MultipartStream,
  media: FormMedia,
  id: string,
  agent: RequestInit['agent']
) {
  let fileName =
    media.filename ??
    `${id}.${(DEFAULT_EXTENSIONS as { [key: string]: string })[id] || 'dat'}`
  if (media.url) {
    const res = await fetch(media.url, { agent })
    return form.addPart({
      headers: {
        'content-disposition': `form-data; name="${id}"; filename="${fileName}"`,
      },
      body: res.body,
    })
  }
  if (media.source) {
    let mediaSource: string | ReadStream = media.source
    if (fs.existsSync(media.source)) {
      fileName = media.filename ?? path.basename(media.source)
      mediaSource = fs.createReadStream(media.source)
    }
    if (isStream(mediaSource) || Buffer.isBuffer(mediaSource)) {
      form.addPart({
        headers: {
          'content-disposition': `form-data; name="${id}"; filename="${fileName}"`,
        },
        body: mediaSource,
      })
    }
  }
}

function isKoaResponse(response: unknown): boolean {
  return (
    typeof response === 'object' &&
    response !== null &&
    hasPropType(response, 'set', 'function') &&
    hasPropType(response, 'header', 'object')
  )
}

function answerToWebhook(
  response: Response,
  payload: Record<string, unknown>,
  options: ApiClient.Options
): Promise<typeof WEBHOOK_REPLY_STUB> {
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
        for (const [key, value] of Object.entries(headers)) {
          response.set(key, value)
        }
        response.body = body
        return Promise.resolve(WEBHOOK_REPLY_STUB)
      }
      if (!response.headersSent) {
        for (const [key, value] of Object.entries(headers)) {
          response.set(key, value)
        }
      }
      return new Promise((resolve) => {
        response.on('finish', () => resolve(WEBHOOK_REPLY_STUB))
        // @ts-expect-error
        body.pipe(response)
      })
    }
  )
}

// TODO: what is actually the type of this?
type Response = any
// eslint-disable-next-line no-redeclare
class ApiClient {
  readonly options: ApiClient.Options
  private responseEnd = false

  constructor(
    readonly token: string,
    options?: Partial<ApiClient.Options>,
    private readonly response?: Response
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

  callApi<M extends keyof Telegram>(
    method: M,
    payload: Opts<M>
  ): Promise<ReturnType<Telegram[M]>> {
    const { token, options, response, responseEnd } = this

    if (
      options.webhookReply &&
      response &&
      !responseEnd &&
      !WEBHOOK_BLACKLIST.includes(method)
    ) {
      debug('Call via webhook', method, payload)
      this.responseEnd = true
      // @ts-expect-error
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
