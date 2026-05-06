/* eslint @typescript-eslint/restrict-template-expressions: [ "error", { "allowNumber": true, "allowBoolean": true } ] */
import * as crypto from 'crypto'
import * as fs from 'fs'
import { stat, realpath } from 'fs/promises'
import * as http from 'http'
import * as path from 'path'
import { Readable } from 'stream'
import { hasProp } from '../helpers/check'
import { InputFile, Opts, Telegram } from '../types/typegram'
import { compactOptions } from '../helpers/compact'
import MultipartStream from './multipart-stream'
import TelegramError from './error'
import { URL } from 'url'
const debug = require('debug')('telegraf:client')
const { isStream } = MultipartStream
const REQUEST_TIMEOUT = 500_000 // ms

interface FetchResponse {
  status: number
  statusText: string
  body?: unknown
  json: () => Promise<unknown>
}

type Fetch = (
  url: URL | string,
  init?: globalThis.RequestInit
) => Promise<FetchResponse>

type RequestConfig = Omit<globalThis.RequestInit, 'body'> & {
  body?:
    | globalThis.RequestInit['body']
    | NodeJS.ReadableStream
    | Buffer
    | string
  duplex?: 'half'
}

async function nativeFetch(url: URL | string, init?: globalThis.RequestInit) {
  return await globalThis.fetch(url, init)
}

function withTimeout(config: RequestConfig, timeout: number) {
  if (timeout <= 0 || !Number.isFinite(timeout)) {
    return {
      config,
      cleanup: () => undefined,
    }
  }

  const timeoutSignal = AbortSignal.timeout(timeout)
  if (!config.signal) {
    return {
      config: { ...config, signal: timeoutSignal },
      cleanup: () => undefined,
    }
  }
  if (typeof AbortSignal.any === 'function') {
    return {
      config: {
        ...config,
        signal: AbortSignal.any([
          config.signal as globalThis.AbortSignal,
          timeoutSignal,
        ]),
      },
      cleanup: () => undefined,
    }
  }

  const controller = new AbortController()
  const abort = () => controller.abort()
  const signal = config.signal as globalThis.AbortSignal
  if (signal.aborted || timeoutSignal.aborted) controller.abort()
  else {
    signal.addEventListener('abort', abort, { once: true })
    timeoutSignal.addEventListener('abort', abort, { once: true })
  }
  return {
    config: {
      ...config,
      signal: controller.signal,
    },
    cleanup: () => {
      signal.removeEventListener('abort', abort)
      timeoutSignal.removeEventListener('abort', abort)
    },
  }
}

async function fetchWithTimeout(
  fetch: Fetch,
  url: URL | string,
  config: RequestConfig,
  timeout: number
) {
  const request = withTimeout(config, timeout)
  try {
    return await fetch(url, request.config as globalThis.RequestInit)
  } finally {
    request.cleanup()
  }
}

type ErrorPayload = ConstructorParameters<typeof TelegramError>[0]
type ApiResponse<T> = { ok: true; result: T } | ({ ok: false } & ErrorPayload)

const WEBHOOK_REPLY_METHOD_ALLOWLIST = new Set<keyof Telegram>([
  'answerCallbackQuery',
  'answerInlineQuery',
  'deleteMessage',
  'leaveChat',
  'sendChatAction',
])

namespace ApiClient {
  export interface Options {
    apiRoot: string
    /**
     * @default 'bot'
     * @see https://github.com/tdlight-team/tdlight-telegram-bot-api#user-mode
     */
    apiMode: 'bot' | 'user'
    webhookReply: boolean
    testEnv: boolean
    /**
     * Fetch implementation used for Bot API calls and URL attachments.
     * The default is `globalThis.fetch`.
     *
     * Provide a custom fetch implementation for proxy agents, custom TLS,
     * custom compression, or other non-standard network behavior.
     */
    fetch: Fetch
    /**
     * Request timeout in milliseconds. Use 0 or Infinity to disable it.
     */
    requestTimeout: number
  }

  export interface CallApiOptions {
    signal?: AbortSignal
  }
}

const DEFAULT_EXTENSIONS: Record<string, string | undefined> = {
  audio: 'mp3',
  photo: 'jpg',
  sticker: 'webp',
  video: 'mp4',
  animation: 'mp4',
  video_note: 'mp4',
  voice: 'ogg',
}

const DEFAULT_OPTIONS: ApiClient.Options = {
  apiRoot: 'https://api.telegram.org',
  apiMode: 'bot',
  webhookReply: true,
  testEnv: false,
  fetch: nativeFetch,
  requestTimeout: REQUEST_TIMEOUT,
}

function isInputFile(value: unknown): value is InputFile {
  return (
    !!value &&
    typeof value === 'object' &&
    ((hasProp(value, 'source') && !!value.source) ||
      (hasProp(value, 'url') && !!value.url))
  )
}

function includesMediaValue(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  if (Buffer.isBuffer(value) || isStream(value)) return false
  if (isInputFile(value)) return true
  if (Array.isArray(value)) return value.some(includesMediaValue)
  return Object.values(value).some(includesMediaValue)
}

function includesMedia(payload: Record<string, unknown>) {
  return Object.entries(payload).some(([key, value]) => {
    if (key === 'link_preview_options') return false
    return includesMediaValue(value)
  })
}

function replacer(_: unknown, value: unknown) {
  if (value == null) return undefined
  return value
}

function buildJSONConfig(payload: unknown): Promise<RequestConfig> {
  return Promise.resolve({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload, replacer),
  })
}

const FORM_DATA_JSON_FIELDS = [
  'results',
  'reply_markup',
  'mask_position',
  'shipping_options',
  'errors',
] as const

async function buildFormDataConfig(
  payload: Opts<keyof Telegram>,
  options: ApiClient.Options
) {
  for (const field of FORM_DATA_JSON_FIELDS) {
    if (hasProp(payload, field) && typeof payload[field] !== 'string') {
      payload[field] = JSON.stringify(payload[field])
    }
  }
  const boundary = crypto.randomBytes(32).toString('hex')
  const formData = new MultipartStream(boundary)
  await Promise.all(
    Object.keys(payload).map((key) =>
      // @ts-expect-error payload[key] can obviously index payload, but TS doesn't trust us
      attachFormValue(formData, key, payload[key], options)
    )
  )
  return {
    method: 'POST',
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
    },
    body: formData,
    duplex: 'half' as const,
  }
}

async function attachFormValue(
  form: MultipartStream,
  id: string,
  value: unknown,
  options: ApiClient.Options
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
  if (isInputFile(value)) {
    return await attachFormMedia(form, value, id, options)
  }
  if (Array.isArray(value) || typeof value === 'object') {
    const packedValue = await attachNestedFiles(form, value, options)
    return form.addPart({
      headers: { 'content-disposition': `form-data; name="${id}"` },
      body: JSON.stringify(packedValue),
    })
  }
  return form.addPart({
    headers: { 'content-disposition': `form-data; name="${id}"` },
    body: JSON.stringify(value),
  })
}

async function attachNestedFiles(
  form: MultipartStream,
  value: unknown,
  options: ApiClient.Options
): Promise<unknown> {
  if (!value || typeof value !== 'object') return value
  if (Buffer.isBuffer(value) || isStream(value)) return value
  if (isInputFile(value)) {
    const attachmentId = crypto.randomBytes(16).toString('hex')
    await attachFormMedia(form, value, attachmentId, options)
    return `attach://${attachmentId}`
  }
  if (Array.isArray(value)) {
    return await Promise.all(
      value.map((item) => attachNestedFiles(form, item, options))
    )
  }

  const result: Record<string, unknown> = {}
  for (const [key, nestedValue] of Object.entries(value)) {
    result[key] = await attachNestedFiles(form, nestedValue, options)
  }
  return result
}

function toAttachmentBody(
  body: unknown
): NodeJS.ReadableStream | Buffer | string {
  if (typeof body === 'string' || Buffer.isBuffer(body) || isStream(body)) {
    return body as NodeJS.ReadableStream | Buffer | string
  }
  if (body instanceof ReadableStream) {
    return Readable.fromWeb(body as never)
  }
  throw new TypeError('Unable to read attachment response body')
}

async function attachFormMedia(
  form: MultipartStream,
  media: InputFile,
  id: string,
  options: ApiClient.Options
) {
  let fileName = media.filename ?? `${id}.${DEFAULT_EXTENSIONS[id] ?? 'dat'}`
  if ('url' in media && media.url !== undefined) {
    const res = await fetchWithTimeout(
      options.fetch,
      media.url,
      {},
      options.requestTimeout
    )
    if (!res.body) throw new TypeError(`Unable to download '${media.url}'`)
    return form.addPart({
      headers: {
        'content-disposition': `form-data; name="${id}"; filename="${fileName}"`,
      },
      body: toAttachmentBody(res.body),
    })
  }
  if ('source' in media && media.source) {
    let mediaSource = media.source
    if (typeof media.source === 'string') {
      const source = await realpath(media.source)
      if ((await stat(source)).isFile()) {
        fileName = media.filename ?? path.basename(media.source)
        mediaSource = await fs.createReadStream(media.source)
      } else {
        throw new TypeError(`Unable to upload '${media.source}', not a file`)
      }
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

async function answerToWebhook(
  response: Response,
  payload: Opts<keyof Telegram>,
  options: ApiClient.Options
): Promise<true> {
  if (!includesMedia(payload)) {
    if (!response.headersSent) {
      response.setHeader('content-type', 'application/json')
    }
    response.end(JSON.stringify(payload), 'utf-8')
    return true
  }

  const { headers, body } = await buildFormDataConfig(payload, options)
  if (!response.headersSent) {
    for (const [key, value] of Object.entries(headers)) {
      response.setHeader(key, value)
    }
  }
  await new Promise((resolve) => {
    response.on('finish', resolve)
    body.pipe(response)
  })
  return true
}

function setErrorField(
  error: Error,
  key: 'message' | 'stack',
  value: string | undefined
) {
  try {
    error[key] = value as never
    return true
  } catch {
    try {
      Object.defineProperty(error, key, {
        value,
        configurable: true,
        writable: true,
      })
      return true
    } catch {
      return false
    }
  }
}

function withCause(error: Error, cause: Error) {
  try {
    Object.defineProperty(error, 'cause', {
      value: cause,
      configurable: true,
      writable: true,
    })
  } catch {
    // Ignore: this is only a best-effort fallback when redacting native errors.
  }
  return error
}

function redactToken(error: Error): never {
  const redact = (value: string) =>
    value.replace(/\/(bot|user)(\d+):[^/]+\//, '/$1$2:[REDACTED]/')
  const message = redact(error.message)
  const stack = error.stack ? redact(error.stack) : undefined
  const redacted =
    setErrorField(error, 'message', message) &&
    (stack === undefined || setErrorField(error, 'stack', stack))
  if (redacted) {
    throw error
  }
  const fallback = withCause(new Error(message), error)
  fallback.name = error.name
  if (stack !== undefined) {
    setErrorField(fallback, 'stack', stack)
  }
  throw fallback
}

type Response = http.ServerResponse
class ApiClient {
  readonly options: ApiClient.Options

  constructor(
    readonly token: string,
    options?: Partial<ApiClient.Options>,
    private readonly response?: Response
  ) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...compactOptions(options),
    }
  }

  /**
   * If set to `true`, first _eligible_ call will avoid performing a POST request.
   * Note that such a call:
   * 1. cannot report errors or return meaningful values,
   * 2. resolves before bot API has a chance to process it,
   * 3. prematurely confirms the update as processed.
   *
   * https://core.telegram.org/bots/faq#how-can-i-make-requests-in-response-to-updates
   * https://github.com/telegraf/telegraf/pull/1250
   */
  set webhookReply(enable: boolean) {
    this.options.webhookReply = enable
  }

  get webhookReply() {
    return this.options.webhookReply
  }

  async callApi<M extends keyof Telegram>(
    method: M,
    payload: Opts<M>,
    { signal }: ApiClient.CallApiOptions = {}
  ): Promise<ReturnType<Telegram[M]>> {
    const { token, options, response } = this

    if (
      options.webhookReply &&
      response?.writableEnded === false &&
      WEBHOOK_REPLY_METHOD_ALLOWLIST.has(method)
    ) {
      debug('Call via webhook', method, payload)
      // @ts-expect-error using webhookReply is an optimisation that doesn't respond with normal result
      // up to the user to deal with this
      return await answerToWebhook(response, { method, ...payload }, options)
    }

    if (!token) {
      throw new TelegramError({
        error_code: 401,
        description: 'Bot Token is required',
      })
    }

    debug('HTTP call', method, payload)

    const config: RequestConfig = includesMedia(payload)
      ? await buildFormDataConfig({ method, ...payload }, options)
      : await buildJSONConfig(payload)
    const apiUrl = new URL(
      `./${options.apiMode}${token}${options.testEnv ? '/test' : ''}/${String(
        method
      )}`,
      options.apiRoot
    )
    config.signal = signal
    const res = await fetchWithTimeout(
      options.fetch,
      apiUrl,
      config,
      options.requestTimeout
    ).catch(redactToken)
    if (res.status >= 500) {
      const errorPayload = {
        error_code: res.status,
        description: res.statusText,
      }
      throw new TelegramError(errorPayload, { method, payload })
    }
    const data = (await res.json()) as ApiResponse<ReturnType<Telegram[M]>>
    if (!data.ok) {
      debug('API call failed', data)
      throw new TelegramError(data, { method, payload })
    }
    return data.result
  }
}

export default ApiClient
