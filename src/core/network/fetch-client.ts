/**
 * Calls Bot API methods through `fetch`. Web APIs only: runs on Node, Deno, Bun,
 * Cloudflare Workers and in browsers.
 */
import type { ApiResponse } from '@telegraf/types/api'
import type { FetchFn, FetchResponse } from '../types/platform'
import { toBlob, toStream, type StreamBody } from './body'
import { extractFiles, toJson, toMultipart } from './payload'
import { warnOnce } from './warning'

export interface ClientOptions {
  /** `https://api.telegram.org` by default. Set it for a self-hosted Bot API server. */
  apiRoot?: string
  /** `user` for a Bot API server that supports user accounts. `bot` by default. */
  apiMode?: 'bot' | 'user'
  /** Use the test environment. */
  testEnv?: boolean
  /**
   * If provided, used instead of the global `fetch`.
   * Non-standard `fetch` implementations that do not accept a `ReadableStream`, such as
   * `node-fetch` 2, are refused when a file is uploaded.
   */
  fetch?: FetchFn
  /** Milliseconds before a call is timed out. 500 seconds by default; `Infinity` for none. */
  timeout?: number
  /** @deprecated Ignored. Configure the connection in your own `fetch` wrapper. */
  agent?: unknown
  /** @deprecated Ignored. Configure the connection in your own `fetch` wrapper. */
  attachmentAgent?: unknown
}

export interface Invocation {
  method: string
  payload?: Record<string, unknown>
  signal?: AbortSignal
}

export type Client = ReturnType<typeof createClient>

/** The largest delay `setTimeout` supports. A larger one fires immediately. */
const MAX_TIMER_DELAY = 2 ** 31 - 1

export function createClient(token: string, options: ClientOptions = {}) {
  // A token read from a file may end with a newline.
  token = token.trim()
  const apiRoot = options.apiRoot ?? 'https://api.telegram.org'
  const apiMode = options.apiMode ?? 'bot'
  const path = `./${apiMode}${token}${options.testEnv === true ? '/test' : ''}/`
  const timeout = options.timeout ?? 500_000
  if (!(timeout > 0)) {
    throw new RangeError('timeout must be a positive number, or Infinity')
  }
  // A browser's `fetch` throws when called as a method of another object.
  const send: FetchFn = options.fetch ?? ((url, init) => fetch(url, init))

  if (options.agent !== undefined || options.attachmentAgent !== undefined) {
    warnAgentIgnored()
  }

  let browser: boolean | undefined

  /**
   * Resolves with the API response, whether `ok` or not. Rejects when the call doesn't get
   * a response: the request failed, a file could not be read, or the call was aborted or
   * timed out.
   */
  const call = async ({
    method,
    payload = {},
    signal,
  }: Invocation): Promise<ApiResponse<unknown>> => {
    browser ??= isBrowserFetch()

    // One signal covers both the caller's abort and the timeout.
    const controller = new AbortController()
    const abort = () => controller.abort(signal?.reason)
    if (signal?.aborted === true) abort()
    else signal?.addEventListener('abort', abort, { once: true })
    const expire = () => {
      const message = `${method} did not complete in ${timeout} ms`
      controller.abort(new DOMException(message, 'TimeoutError'))
    }
    const timer =
      timeout > MAX_TIMER_DELAY ? undefined : setTimeout(expire, timeout)

    let stream: StreamBody | undefined
    try {
      const url = new URL(path + method, apiRoot).href
      const { payload: fields, attachments } = extractFiles(payload)
      let contentType = 'application/json'
      let body: string | Blob | ReadableStream<Uint8Array>
      if (attachments.length === 0 && !browser) {
        body = toJson(fields)
      } else {
        const multipart = toMultipart(fields, attachments)
        contentType = multipart.contentType
        if (browser) {
          // Buffering a stream can take arbitrarily long, so it must be abortable.
          body = await toBlob(multipart.segments, { signal: controller.signal })
        } else {
          stream = toStream(multipart.segments)
          body = stream.stream
        }
      }

      const response = await send(url, {
        method: 'POST',
        headers: { 'content-type': contentType },
        body,
        signal: controller.signal,
        duplex: 'half',
      })
      // Some runtimes send the truncated body of a failed file and still resolve.
      if (stream?.failure !== undefined) throw stream.failure.error

      return await toApiResponse(response, method)
    } catch (error) {
      if (stream?.failure !== undefined) {
        throw redact(stream.failure.error, token)
      }
      if (controller.signal.aborted) throw controller.signal.reason
      throw redact(error, token)
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
      // A runtime may leave the body open after an aborted or failed request.
      // Not awaited: a source can take arbitrarily long to stop.
      stream?.close().catch(noop)
    }
  }

  return { call }
}

/**
 * Detects a browser's `fetch`. A browser can only send the Bot API requests that don't
 * need a CORS preflight, which rules out JSON and stream bodies.
 *
 * Browsers strip forbidden headers from a `Request`; other runtimes keep them.
 * Constructing a `Request` doesn't send it.
 */
function isBrowserFetch(): boolean {
  try {
    const request = new Request('https://telegraf.invalid/', {
      method: 'POST',
      headers: { 'sec-telegraf': '1' },
    })
    return !request.headers.has('sec-telegraf')
  } catch {
    // Default to assuming a browser environment if creating the request fails.
    // The cost is needing to buffer the request body instead of streaming.
    return true
  }
}

/**
 * Parses the response. If it is not a Bot API response (e.g. it came from a proxy or a
 * gateway), an error status becomes an API-style error object and any other status throws.
 */
async function toApiResponse(
  response: FetchResponse,
  method: string
): Promise<ApiResponse<unknown>> {
  let answer: unknown
  try {
    answer = await response.json()
  } catch (error) {
    // `json()` throws a SyntaxError for a non-JSON body. Any other error is a network error
    // or an abort.
    if (!isObject(error) || error.name !== 'SyntaxError') throw error
  }
  if (isObject(answer) && typeof answer.ok === 'boolean') {
    return answer as unknown as ApiResponse<unknown>
  }
  const { status } = response
  if (status < 400) {
    throw new Error(`${method}: HTTP ${status} is not a Bot API response`)
  }
  // HTTP/2 responses don't have a status text.
  const description = response.statusText || `HTTP ${status}`
  return { ok: false, error_code: status, description }
}

/**
 * Redacts the secret part of the token from the error's message, stack, or other
 * properties.
 */
export function redact(error: unknown, token: string): unknown {
  // A token is `<bot id>:<secret>`. The bot id is kept: it isn't a secret, and it says
  // which bot an error came from.
  const secret = token.slice(token.indexOf(':') + 1)
  if (secret === '') return error
  const clean = (text: string) => text.split(secret).join('[REDACTED]')
  if (typeof error === 'string') return clean(error)
  if (!isObject(error)) return error

  let cleaned = true
  const seen = new Set<unknown>()
  const queue: unknown[] = [error]
  while (queue.length > 0) {
    const target = queue.pop()
    if (!isObject(target) || seen.has(target)) continue
    seen.add(target)
    const keys = ['message', 'stack', ...Object.getOwnPropertyNames(target)]
    for (const key of new Set(keys)) {
      const value = getProperty(target, key)
      if (typeof value !== 'string' || clean(value) === value) continue
      if (!setProperty(target, key, clean(value))) cleaned = false
    }
    const errors = getProperty(target, 'errors')
    if (Array.isArray(errors)) queue.push(...errors)
    queue.push(getProperty(target, 'cause'))
  }
  if (cleaned) return error

  // Some property could not be redacted in place.
  const properties: Record<string, unknown> = { name: String(error.name) }
  for (const [key, value] of Object.entries(error)) {
    if (typeof value === 'string') properties[key] = clean(value)
    else if (typeof value === 'number') properties[key] = value
  }
  return Object.assign(new Error(clean(String(error.message))), properties)
}

function getProperty(target: Record<string, unknown>, key: string): unknown {
  try {
    return target[key]
  } catch {
    return undefined
  }
}

/** Sets a property by assignment, falling back to `defineProperty`. */
function setProperty(
  target: Record<string, unknown>,
  key: string,
  value: string
): boolean {
  try {
    target[key] = value
  } catch {
    // e.g. a getter without a setter
  }
  if (getProperty(target, key) === value) return true
  try {
    Object.defineProperty(target, key, {
      value,
      writable: true,
      configurable: true,
      enumerable: Object.prototype.propertyIsEnumerable.call(target, key),
    })
  } catch {
    // e.g. non-configurable, or frozen
  }
  return getProperty(target, key) === value
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function warnAgentIgnored() {
  warnOnce(
    'TELEGRAF_AGENT',
    // TODO: link to docs when ready
    // TODO: in v6, globalThis.fetch is used by default, and this message will need to be updated or removed.
    'telegraf: `agent` and `attachmentAgent` are ignored when `fetch` is passed. ' +
      'Remove these options and pass a fetch wrapper that handles proxies or other connection requirements.'
  )
}

function noop() {
  // intentionally empty
}
