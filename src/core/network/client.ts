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
import { convertFileLiterals, type Download } from './file-literals'
import { extractFiles, toJson, toMultipart, type ByteStream } from './payload'
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
  /** Resolves with the response body once the server has answered with a 2xx. */
  download(url: string): Promise<ByteStream>
  /** Aborts every download of this call. */
  abort(reason?: unknown): void
}

function downloadError(url: string, status: number, statusText: string) {
  return new Error(`Unable to download '${url}': ${status} ${statusText}`)
}

/** Downloads with node-fetch, using `attachmentAgent`. */
function nodeFetchDownloader(agent: ApiClient.Agent): Downloader {
  const controller = new AbortController()
  return {
    abort: () => controller.abort(),
    async download(url) {
      // @ts-expect-error AbortSignal shim is missing some props from Request.AbortSignal
      const signal: RequestInit['signal'] = controller.signal
      const res = await fetch(url, { agent, timeout: TIMEOUT, signal })
      if (!res.ok) throw downloadError(url, res.status, res.statusText)
      return res.body as AsyncIterable<Uint8Array>
    },
  }
}

/** Downloads with the user's custom `fetch`. */
function customFetchDownloader(customFetch: FetchFn): Downloader {
  // A standard `fetch` needs a native AbortSignal, not the `abort-controller` polyfill.
  const controller = new globalThis.AbortController()
  return {
    abort: (reason) => controller.abort(reason),
    async download(url) {
      const res = await customFetch(url, {
        method: 'GET',
        headers: {},
        body: undefined,
        signal: controller.signal,
        duplex: 'half',
      })
      const ok = res.status >= 200 && res.status <= 299
      if (!ok || res.body == null) {
        throw downloadError(url, res.status, res.statusText)
      }
      return res.body as ByteStream
    },
  }
}

/**
 * Starts every `{ url }` download of one call up front. Each body is read later, when the
 * upload reaches that file.
 */
function startDownloads(downloader: Downloader) {
  const pending: Promise<ByteStream>[] = []

  const download: Download = (url) => {
    const body = downloader.download(url)
    pending.push(body)
    // A failure surfaces through `ready()` or while the body is read.
    body.catch(noop)
    return (async function* () {
      yield* (await body) as AsyncIterable<Uint8Array>
    })()
  }

  return {
    download,
    /** Resolves once every download has responded; rejects as soon as one fails. */
    ready: () => Promise.all(pending),
    /**
     * Aborts the downloads that were not fully read. Destroying a node-fetch response
     * body does not close its connection; aborting does.
     */
    abort: (reason?: unknown) => {
      if (pending.length > 0) downloader.abort(reason)
    },
  }
}

function noop() {
  // intentionally empty
}

/** The methods that can be answered this way take no files, so the answer is JSON. */
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
  /** What sends through `options.fetch`. It is made when it is first needed. */
  private client?: Client

  constructor(
    token: string,
    options?: Partial<ApiClient.Options>,
    private readonly response?: Response
  ) {
    // Whitespace is not part of a token. A newline often follows one read from a file.
    // A missing token is left for `callApi` to report.
    this.token = typeof token === 'string' ? token.trim() : token
    this.options = {
      ...DEFAULT_OPTIONS,
      ...compactOptions(options),
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

    // Files are found wherever they are in the payload, and sent as a multipart body.
    const downloader = nodeFetchDownloader(options.attachmentAgent)
    const downloads = startDownloads(downloader)
    const converted = convertFileLiterals(
      payload as Record<string, unknown>,
      downloads.download
    )
    const aborter = new AbortController()
    const abort = () => {
      aborter.abort()
      downloads.abort()
    }
    let body: Readable | undefined

    try {
      const { payload: fields, attachments } = extractFiles(converted.payload)
      const multipart =
        attachments.length === 0 ? undefined : toMultipart(fields, attachments)
      const stream = multipart && toStream(multipart.segments).stream
      // node-fetch takes a Node stream, not the web stream that the body is made as.
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

      // Wait for every `{ url }` download to respond before opening the request, so a
      // slow file host cannot stall the upload half way.
      await downloads.ready().catch((error: unknown) => {
        throw redact(error, token)
      })
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
      // node-fetch names the address in the error of an answer that is not JSON.
      const data = await res.json().catch((error: unknown) => {
        throw redact(error, token)
      })
      if (!data.ok) {
        debug('API call failed', data)
        throw new TelegramError(data, { method, payload })
      }
      return data.result
    } finally {
      // The signal can outlive the call: polling gives the same one to every call.
      signal?.removeEventListener('abort', abort)
      // An upload that did not reach its end: the request failed, or it was answered
      // early, as a server does that refuses a file. The file that was being read is
      // released, and so are the streams and the downloads that were not reached.
      if (body?.readableEnded !== true) {
        body?.destroy()
        for (const stream of converted.streams) stream.destroy?.()
        downloads.abort()
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
    const downloads = startDownloads(downloader)
    const converted = convertFileLiterals(
      payload as Record<string, unknown>,
      downloads.download
    )
    const abort = () => downloads.abort()
    const timer = setTimeout(() => {
      const message = `Downloading a file for ${method} timed out`
      downloads.abort(new DOMException(message, 'TimeoutError'))
    }, TIMEOUT)

    try {
      if (signal?.aborted === true) abort()
      else signal?.addEventListener('abort', abort)
      // Same as the default path: downloads respond before the request is opened.
      await downloads.ready().catch((error: unknown) => {
        throw redact(error, token)
      })
      clearTimeout(timer)

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
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
      // The client closes the file it was reading. Close what it never reached:
      // unread streams and downloads. Destroying a finished stream is a no-op.
      for (const stream of converted.streams) stream.destroy?.()
      downloads.abort()
    }
  }
}

export default ApiClient
