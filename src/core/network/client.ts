/* eslint @typescript-eslint/restrict-template-expressions: [ "error", { "allowNumber": true, "allowBoolean": true } ] */
import * as crypto from 'crypto'
import * as fs from 'fs'
import { stat, realpath } from 'fs/promises'
import * as http from 'http'
import * as path from 'path'
import d from 'debug'
import { Readable } from 'stream'
import { hasProp } from '../helpers/check'
import { InputFile, Opts, Telegram } from '../types/typegram'
import { compactOptions } from '../helpers/compact'
import MultipartStream from './multipart-stream'
import TelegramError, { TelegrafNetworkError } from './error'
import { URL } from 'url'
import { types } from 'util'
const debug = d('telegraf:client')
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
  const abortSignal = AbortSignal as typeof AbortSignal & {
    any?: (signals: globalThis.AbortSignal[]) => globalThis.AbortSignal
  }
  if (typeof abortSignal.any === 'function') {
    return {
      config: {
        ...config,
        signal: abortSignal.any([
          config.signal as globalThis.AbortSignal,
          timeoutSignal,
        ]),
      },
      cleanup: () => undefined,
    }
  }

  const controller = new AbortController()
  const signal = config.signal as globalThis.AbortSignal
  const abort = () => controller.abort(signal.reason)
  const expire = () => controller.abort(timeoutSignal.reason)
  if (signal.aborted) abort()
  else if (timeoutSignal.aborted) expire()
  else {
    signal.addEventListener('abort', abort, { once: true })
    timeoutSignal.addEventListener('abort', expire, { once: true })
  }
  return {
    config: {
      ...config,
      signal: controller.signal,
    },
    cleanup: () => {
      signal.removeEventListener('abort', abort)
      timeoutSignal.removeEventListener('abort', expire)
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

/** Keys whose values are Bot API objects consisting of just `{ url }` (WebAppInfo, LoginUrl), never files */
const URL_OBJECT_KEYS = new Set(['web_app', 'login_url'])

/**
 * @param key the property the value is stored under, if any
 */
function isInputFile(value: unknown, key?: string): value is InputFile {
  if (!value || typeof value !== 'object') return false
  if (hasProp(value, 'source') && !!value.source) return true
  // a URL file is exactly `{ url, filename? }`; objects with other keys (URL buttons,
  // text_link entities, link media) are Bot API objects that must be sent as JSON
  return (
    hasProp(value, 'url') &&
    !!value.url &&
    Object.keys(value).every((k) => k === 'url' || k === 'filename') &&
    !(key !== undefined && URL_OBJECT_KEYS.has(key))
  )
}

function includesMediaValue(value: unknown, key?: string): boolean {
  if (!value || typeof value !== 'object') return false
  if (Buffer.isBuffer(value) || isStream(value)) return false
  if (isInputFile(value, key)) return true
  if (Array.isArray(value))
    return value.some((item) => includesMediaValue(item))
  return Object.entries(value).some(([k, v]) => includesMediaValue(v, k))
}

function includesMedia(payload: Record<string, unknown>) {
  return Object.entries(payload).some(([key, value]) => {
    if (key === 'link_preview_options') return false
    return includesMediaValue(value, key)
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
  try {
    for (const key of Object.keys(payload)) {
      // @ts-expect-error payload[key] can obviously index payload, but TS doesn't trust us
      await attachFormValue(formData, key, payload[key], options)
    }
  } catch (error) {
    formData.destroy()
    throw error
  }
  return {
    method: 'POST',
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
    },
    body: formData,
    duplex: 'half' as const,
  }
}

export async function attachFormValue(
  form: MultipartStream,
  id: string,
  value: unknown,
  options: ApiClient.Options = DEFAULT_OPTIONS
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
  if (isInputFile(value, id)) {
    if (id === 'thumbnail') {
      const reference = await attachNestedFiles(form, value, options, id)
      return form.addPart({
        headers: { 'content-disposition': `form-data; name="${id}"` },
        body: reference as string,
      })
    }
    return await attachFormMedia(form, value, id, options)
  }
  if (Array.isArray(value) || typeof value === 'object') {
    const packedValue = await attachNestedFiles(form, value, options, id)
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
  options: ApiClient.Options,
  key?: string
): Promise<unknown> {
  if (!value || typeof value !== 'object') return value
  if (Buffer.isBuffer(value) || isStream(value)) return value
  if (isInputFile(value, key)) {
    const attachmentId = crypto.randomBytes(16).toString('hex')
    await attachFormMedia(form, value, attachmentId, options)
    return `attach://${attachmentId}`
  }
  if (Array.isArray(value)) {
    const items = []
    for (const item of value)
      items.push(await attachNestedFiles(form, item, options))
    return items
  }

  const result: Record<string, unknown> = {}
  for (const [key, nestedValue] of Object.entries(value)) {
    result[key] = await attachNestedFiles(form, nestedValue, options, key)
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

const TRANSIENT_NETWORK_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
])

const MAX_CAUSE_DEPTH = 4

function redactToken(value: string, token: string): string
function redactToken<T>(value: T, token: string): T
function redactToken(value: unknown, token: string) {
  if (typeof value !== 'string') return value
  const text = token ? value.split(token).join('[REDACTED]') : value
  return text
    .replace(/\/(bot|user)(\d+):[^/\s]+(?=\/|$)/g, '/$1$2:[REDACTED]')
    .replace(/\b(\d{5,}):[A-Za-z0-9_-]{20,}\b/g, '$1:[REDACTED]')
}

function errorString(error: unknown, key: 'message' | 'name' | 'stack') {
  if (!error || typeof error !== 'object') return undefined
  let value: unknown
  try {
    value = (error as Record<string, unknown>)[key]
  } catch {
    return undefined
  }
  return typeof value === 'string' ? value : undefined
}

function errorCode(error: unknown) {
  if (!error || typeof error !== 'object') return undefined
  let value: unknown
  try {
    value = (error as { code?: unknown }).code
  } catch {
    return undefined
  }
  return typeof value === 'string' || typeof value === 'number'
    ? value
    : undefined
}

function errorName(error: unknown) {
  const name = errorString(error, 'name')
  return name && name !== 'Error' ? name : undefined
}

function errorCause(error: unknown) {
  if (!error || typeof error !== 'object') return undefined
  try {
    return (error as { cause?: unknown }).cause
  } catch {
    return undefined
  }
}

function isTransientNetworkError(
  error: unknown,
  seen = new WeakSet<object>(),
  depth = 0
): boolean {
  if (depth >= MAX_CAUSE_DEPTH) return false
  if (!error || typeof error !== 'object') return false
  if (seen.has(error)) return false
  seen.add(error)

  if (errorName(error) === 'TimeoutError') return true

  const code = errorCode(error)
  if (typeof code === 'string' && TRANSIENT_NETWORK_CODES.has(code)) {
    return true
  }

  const cause = errorCause(error)
  return isTransientNetworkError(cause, seen, depth + 1)
}

function sanitizeObject(
  value: object,
  token: string,
  seen: WeakSet<object>,
  depth: number
) {
  const clean: Record<string, unknown> = Object.create(null)
  let keys: string[]
  try {
    keys = Object.getOwnPropertyNames(value)
  } catch {
    return '[Uninspectable object]'
  }

  for (const key of keys) {
    let desc: PropertyDescriptor | undefined
    try {
      desc = Object.getOwnPropertyDescriptor(value, key)
    } catch {
      clean[redactToken(key, token)] = '[Uninspectable property]'
      continue
    }
    if (!desc) continue
    clean[redactToken(key, token)] =
      'value' in desc
        ? sanitizeCause(desc.value, token, seen, depth + 1)
        : '[Getter]'
  }
  return clean
}

function sanitizeCause(
  error: unknown,
  token: string,
  seen = new WeakSet<object>(),
  depth = 0
): unknown {
  if (typeof error === 'string') return redactToken(error, token)
  if (typeof error === 'function') return '[Function]'
  if (typeof error === 'symbol') return '[Symbol]'
  if (!error || typeof error !== 'object') return error
  if (depth >= MAX_CAUSE_DEPTH) return '[Truncated]'
  if (seen.has(error)) return '[Circular]'
  seen.add(error)
  let isError: boolean
  try {
    isError = types.isNativeError(error) || error instanceof Error
  } catch {
    return '[Uninspectable object]'
  }
  if (!isError) return sanitizeObject(error, token, seen, depth)

  const cause = errorCause(error)
  const options =
    cause === undefined
      ? undefined
      : { cause: sanitizeCause(cause, token, seen, depth + 1) }
  const message = errorString(error, 'message') ?? errorName(error) ?? 'Error'
  const safe = new Error(redactToken(message, token), options)
  safe.name = redactToken(errorString(error, 'name') ?? 'Error', token)
  const stack = errorString(error, 'stack')
  if (stack) safe.stack = redactToken(stack, token)

  const code = errorCode(error)
  if (code !== undefined) {
    Object.defineProperty(safe, 'code', {
      value: redactToken(code, token),
      writable: true,
      enumerable: true,
      configurable: true,
    })
  }
  return safe
}

function networkError<M extends keyof Telegram>(
  method: M,
  options: ApiClient.Options,
  token: string,
  error: unknown
): never {
  const message =
    typeof error === 'string' ? error : errorString(error, 'message')
  const detail = message ? `: ${redactToken(message, token)}` : ''
  throw new TelegrafNetworkError(
    `Network request failed for ${String(method)}${detail}`,
    {
      method: String(method),
      apiRoot: redactToken(options.apiRoot, token),
      apiMode: options.apiMode,
      testEnv: options.testEnv,
    },
    {
      cause: sanitizeCause(error, token),
      code: redactToken(errorCode(error), token),
      errorName: redactToken(errorName(error), token),
      transient: isTransientNetworkError(error),
    }
  )
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
      `./${options.apiMode}${token}${
        options.testEnv ? '/test' : ''
      }/${String(method)}`,
      options.apiRoot
    )
    const body =
      config.body instanceof MultipartStream ? config.body : undefined
    const upload = new AbortController()
    let bodyError: Error | undefined
    const abortUpload = () => upload.abort(signal?.reason)
    const failUpload = (error: Error) => {
      bodyError = error
      upload.abort(error)
    }
    if (body) {
      if (signal?.aborted) abortUpload()
      else signal?.addEventListener('abort', abortUpload, { once: true })
      body.once('error', failUpload)
    }
    config.signal = body ? upload.signal : signal
    const request = withTimeout(config, options.requestTimeout)
    try {
      let res
      try {
        res = await options.fetch(
          apiUrl,
          request.config as globalThis.RequestInit
        )
      } catch (error) {
        return networkError(method, options, token, bodyError ?? error)
      }
      const httpError = () =>
        new TelegramError(
          { error_code: res.status, description: res.statusText },
          { method, payload }
        )
      if (res.status >= 500) throw httpError()
      let data: ApiResponse<ReturnType<Telegram[M]>>
      try {
        data = (await res.json()) as typeof data
      } catch (error) {
        if (res.status >= 400) throw httpError()
        const reason = request.config.signal?.aborted
          ? request.config.signal.reason
          : error
        return networkError(method, options, token, reason)
      }
      if (!data.ok) {
        debug('API call failed', data)
        throw new TelegramError(data, { method, payload })
      }
      return data.result
    } finally {
      body?.destroy()
      signal?.removeEventListener('abort', abortUpload)
      request.cleanup()
    }
  }
}

export default ApiClient
