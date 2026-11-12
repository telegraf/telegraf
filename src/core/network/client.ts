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
import { redact } from './fetch-client'
import { convertFileLiterals, type Download } from './file-literals'
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

/** Opens the contents of a URL, for a file that was given as one. */
function downloadWith(agent: ApiClient.Agent): Download {
  return async function* (url) {
    // A download that is not read to its end is aborted, which closes its connection.
    // Destroying the body that node-fetch gives does not.
    const aborter = new AbortController()
    let finished = false
    try {
      // @ts-expect-error AbortSignal shim is missing some props from Request.AbortSignal
      const signal: RequestInit['signal'] = aborter.signal
      const res = await fetch(url, { agent, timeout: TIMEOUT, signal })
      if (!res.ok) {
        throw new Error(
          `Unable to download '${url}': ${res.status} ${res.statusText}`
        )
      }
      yield* res.body as AsyncIterable<Uint8Array>
      finished = true
    } finally {
      if (!finished) aborter.abort()
    }
  }
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

    const environment = options.testEnv ? '/test' : ''
    const path = `./${options.apiMode}${token}${environment}/${method}`
    let apiUrl: URL
    try {
      apiUrl = new URL(path, options.apiRoot)
    } catch (error) {
      throw redact(error, token)
    }

    // Files are found wherever they are in the payload, and sent as a multipart body.
    const converted = convertFileLiterals(
      payload as Record<string, unknown>,
      downloadWith(options.attachmentAgent)
    )
    const { payload: fields, attachments } = extractFiles(converted.payload)
    const multipart =
      attachments.length === 0 ? undefined : toMultipart(fields, attachments)
    const stream = multipart && toStream(multipart.segments).stream
    // node-fetch takes a Node stream, not the web stream that the body is made as.
    const body = stream && Readable.fromWeb(stream as NodeReadableStream)
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
    const aborter = new AbortController()
    let bodyError: unknown
    const abort = () => aborter.abort()
    if (signal?.aborted === true) abort()
    else signal?.addEventListener('abort', abort)
    body?.once('error', (error: unknown) => {
      bodyError = error
      aborter.abort()
    })
    // @ts-expect-error AbortSignal shim is missing some props from Request.AbortSignal
    config.signal = aborter.signal

    try {
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
      // released, and so are the streams that were not reached.
      if (body !== undefined && !body.readableEnded) {
        body.destroy()
        for (const stream of converted.streams) stream.destroy?.()
      }
    }
  }
}

export default ApiClient
