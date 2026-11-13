/* eslint @typescript-eslint/restrict-template-expressions: [ "error", { "allowNumber": true, "allowBoolean": true } ] */
import * as http from 'http'
import * as https from 'https'
import { Readable } from 'stream'
import type { ReadableStream as NodeReadableStream } from 'stream/web'
import fetch, { RequestInit } from 'node-fetch'
import { Opts, Telegram } from '../types/typegram'
import { AbortController, AbortSignal } from 'abort-controller'
import { compactOptions } from '../helpers/compact'
import { toStream } from './body'
import { createClient, redact, type Client, type FetchFn } from './fetch-client'
import {
  convertFileLiterals,
  downloadError,
  type Download,
} from './file-literals'
import { extractFiles, toJson, toMultipart } from './payload'
import TelegramError from './error'
import { URL } from 'url'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('telegraf:client')

const WEBHOOK_REPLY_METHOD_ALLOWLIST = new Set<keyof Telegram>([
  'answerCallbackQuery',
  'answerInlineQuery',
  'deleteMessage',
  'leaveChat',
  'sendChatAction',
])

namespace ApiClient {
  export type Agent = http.Agent | ((parsedUrl: URL) => http.Agent) | undefined
  export interface Options {
    /**
     * Agent for communicating with the bot API.
     */
    agent?: http.Agent
    /**
     * Agent for attaching files via URL.
     * 1. Not all agents support both `http:` and `https:`.
     * 2. When passing a function, create the agents once, outside of the function.
     *    Creating new agent every request probably breaks `keepAlive`.
     */
    attachmentAgent?: Agent
    /**
     * Sends every request through this `fetch` instead of `node-fetch`.
     *
     * It is recommended to pass the runtime's own `fetch` function, unless you
     * have a specific reason to use a custom implementation or wrapper.
     * It must be a standard `fetch` implementation.
     *
     * `agent` and `attachmentAgent` are then ignored. Configure the connection in the
     * `fetch` you pass.
     */
    fetch?: FetchFn
    apiRoot: string
    /**
     * @default 'bot'
     * @see https://github.com/tdlight-team/tdlight-telegram-bot-api#user-mode
     */
    apiMode: 'bot' | 'user'
    webhookReply: boolean
    testEnv: boolean
  }

  export interface CallApiOptions {
    signal?: AbortSignal
  }
}

const DEFAULT_OPTIONS: ApiClient.Options = {
  apiRoot: 'https://api.telegram.org',
  apiMode: 'bot',
  webhookReply: true,
  agent: new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 10000,
  }),
  attachmentAgent: undefined,
  testEnv: false,
}

const TIMEOUT = 500_000 // ms

/** Downloads the `{ url }` files of one API call. */
interface Downloader {
  /** The response body. The URL is requested when the body is first read. */
  download: Download
  /** Aborts every download of this call. */
  abort(reason?: unknown): void
}

/** Downloads with node-fetch, using `attachmentAgent`. */
function nodeFetchDownloader(agent: ApiClient.Agent): Downloader {
  const controller = new AbortController()
  return {
    // Destroying a node-fetch response body doesn't close its connection.
    abort: () => controller.abort(),
    async *download(url) {
      // @ts-expect-error AbortSignal shim is missing some props from Request.AbortSignal
      const signal: RequestInit['signal'] = controller.signal
      const res = await fetch(url, { agent, timeout: TIMEOUT, signal })
      if (!res.ok) throw downloadError(url, res.status, res.statusText)
      yield* res.body as AsyncIterable<Uint8Array>
    },
  }
}

/** Downloads with the user's custom `fetch`. */
function customFetchDownloader(customFetch: FetchFn): Downloader {
  // A standard `fetch` needs a native AbortSignal, not the `abort-controller` polyfill.
  const controller = new globalThis.AbortController()
  return {
    abort: (reason) => controller.abort(reason),
    async *download(url) {
      const res = await customFetch(url, {
        method: 'GET',
        headers: {},
        body: undefined,
        signal: controller.signal,
        duplex: 'half',
      })
      const ok = res.status >= 200 && res.status <= 299
      if (!ok) throw downloadError(url, res.status, res.statusText)
      // e.g. a 204, or a custom fetch that returns only what the client reads.
      if (res.body == null) {
        throw new Error(`Unable to download '${url}': the response has no body`)
      }
      yield* res.body as AsyncIterable<Uint8Array>
    },
  }
}

/** The error for a `{ url }` that can't be downloaded quotes the URL, which may hold the token. */
function convertPayload(payload: unknown, download: Download, token: string) {
  try {
    return convertFileLiterals(payload as Record<string, unknown>, download)
  } catch (error) {
    throw redact(error, token)
  }
}

/**
 * Webhook replies are always JSON, since methods in WEBHOOK_REPLY_METHOD_ALLOWLIST
 * don't take files.
 */
function answerToWebhook(
  response: Response,
  payload: Opts<keyof Telegram>
): true {
  if (!response.headersSent) {
    response.setHeader('content-type', 'application/json')
  }
  response.end(JSON.stringify(payload), 'utf-8')
  return true
}

type Response = http.ServerResponse
class ApiClient {
  readonly token: string
  readonly options: ApiClient.Options
  /** Client for `options.fetch`, created on first use. */
  private client?: Client

  constructor(
    token: string,
    options?: Partial<ApiClient.Options>,
    private readonly response?: Response
  ) {
    // A token read from a file may end with a newline.
    // A missing token is reported by `callApi`, not by the constructor.
    this.token = typeof token === 'string' ? token.trim() : token
    this.options = {
      ...DEFAULT_OPTIONS,
      ...compactOptions(options),
    }
    const { fetch: customFetch } = this.options
    if (customFetch !== undefined && typeof customFetch !== 'function') {
      throw new TypeError('The `fetch` option must be a function.')
    }
    if (this.options.apiRoot.startsWith('http://')) {
      this.options.agent = undefined
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
      return answerToWebhook(response, { method, ...payload })
    }

    if (!token) {
      throw new TelegramError({
        error_code: 401,
        description: 'Bot Token is required',
      })
    }

    debug('HTTP call', method, payload)

    if (options.fetch !== undefined) {
      return await this.callWithCustomFetch(method, payload, signal)
    }

    const environment = options.testEnv ? '/test' : ''
    const path = `./${options.apiMode}${token}${environment}/${method}`
    let apiUrl: URL
    try {
      apiUrl = new URL(path, options.apiRoot)
    } catch (error) {
      throw redact(error, token)
    }

    const downloader = nodeFetchDownloader(options.attachmentAgent)
    const converted = convertPayload(payload, downloader.download, token)
    const aborter = new AbortController()
    const abort = () => aborter.abort()
    let body: Readable | undefined

    try {
      const { payload: fields, attachments } = extractFiles(converted.payload)
      const multipart =
        attachments.length === 0 ? undefined : toMultipart(fields, attachments)
      const stream = multipart && toStream(multipart.segments).stream
      // node-fetch can't send a web stream.
      body = stream && Readable.fromWeb(stream as NodeReadableStream)
      const config: RequestInit = {
        method: 'POST',
        compress: true,
        headers: {
          'content-type': multipart?.contentType ?? 'application/json',
          connection: 'keep-alive',
        },
        body: body ?? toJson(fields),
        agent: options.agent,
        timeout: TIMEOUT,
      }

      // Prevent leaking file-handles when a request fails during upload
      let bodyError: unknown
      if (signal?.aborted === true) abort()
      else signal?.addEventListener('abort', abort)
      body?.once('error', (error: unknown) => {
        bodyError = error
        aborter.abort()
      })
      // @ts-expect-error AbortSignal shim is missing some props from Request.AbortSignal
      config.signal = aborter.signal

      const res = await fetch(apiUrl, config).catch((error: unknown) => {
        throw redact(bodyError ?? error, token)
      })
      if (res.status >= 500) {
        const errorPayload = {
          error_code: res.status,
          description: res.statusText,
        }
        throw new TelegramError(errorPayload, { method, payload })
      }
      // node-fetch puts the request URL in its error for a non-JSON response.
      // A source that fails while the answer is arriving aborts the request, and the
      // error is then an `AbortError` that says nothing about the source.
      const data = await res.json().catch((error: unknown) => {
        throw redact(bodyError ?? error, token)
      })
      if (!data.ok) {
        debug('API call failed', data)
        throw new TelegramError(data, { method, payload })
      }
      return data.result
    } finally {
      // The signal can outlive the call: polling reuses one for every call.
      signal?.removeEventListener('abort', abort)
      // The upload did not finish: the request failed, or the server responded early
      // (e.g. it rejected a file). The file being read is still open, and so are the
      // streams that were never reached.
      if (body?.readableEnded !== true) {
        body?.destroy()
        for (const stream of converted.streams) stream.destroy?.()
        downloader.abort()
      }
    }
  }

  /** Sends the call with the user's custom `fetch` (`options.fetch`). */
  private async callWithCustomFetch<M extends keyof Telegram>(
    method: M,
    payload: Opts<M>,
    signal: AbortSignal | undefined
  ): Promise<ReturnType<Telegram[M]>> {
    const { token, options } = this
    const { agent, attachmentAgent, fetch: customFetch } = options
    this.client ??= createClient(token, {
      apiRoot: options.apiRoot,
      apiMode: options.apiMode,
      testEnv: options.testEnv,
      fetch: customFetch,
      // Agents are ignored with a custom fetch. Warn only about ones the user set,
      // not about the built-in default.
      agent: agent === DEFAULT_OPTIONS.agent ? undefined : agent,
      attachmentAgent,
    })

    const downloader = customFetchDownloader(customFetch as FetchFn)
    const converted = convertPayload(payload, downloader.download, token)

    try {
      const data = await this.client.call({
        method,
        payload: converted.payload,
        // The client only uses what the `abort-controller` polyfill also provides.
        signal: signal as unknown as globalThis.AbortSignal | undefined,
      })
      if (!data.ok) {
        debug('API call failed', data)
        throw new TelegramError(data, { method, payload })
      }
      return data.result as ReturnType<Telegram[M]>
    } finally {
      // The client closes the file it was reading. Close what it never reached:
      // unread streams. Destroying a finished stream is a no-op.
      for (const stream of converted.streams) stream.destroy?.()
      // A download that was being requested when the call ended is still in flight.
      downloader.abort()
    }
  }
}

export default ApiClient
