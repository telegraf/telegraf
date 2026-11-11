/**
 * Calls Bot API methods through `fetch`. Web APIs only: runs on Node, Deno, Bun,
 * Cloudflare Workers and in browsers.
 */
import type { ApiResponse } from '@telegraf/types/api'
import { toBlob, toStream, type StreamBody } from './body'
import { extractFiles, toJson, toMultipart } from './payload'

/** The parts of a response the client reads. */
export interface FetchResponse {
  readonly status: number
  readonly statusText: string
  json(): Promise<unknown>
}

/** The minimal request options the client uses. */
export interface FetchInit {
  method: string
  headers: Record<string, string>
  /**
   * A string, a `Blob` or a `ReadableStream` of bytes. DOM, Node, and undici each declare
   * incompatible types, so we leave it as any.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
  signal: AbortSignal
  /** Required for a stream body. */
  duplex: 'half'
}

export type FetchFn = (url: string, init: FetchInit) => Promise<FetchResponse>

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

/** The longest delay a timer can hold. Given a longer one, it fires at once. */
const MAX_TIMER_DELAY = 2 ** 31 - 1

export function createClient(token: string, options: ClientOptions = {}) {
  const apiRoot = options.apiRoot ?? 'https://api.telegram.org'
  const apiMode = options.apiMode ?? 'bot'
  const path = `./${apiMode}${token}${options.testEnv === true ? '/test' : ''}/`
  const timeout = options.timeout ?? 500_000
  if (!(timeout > 0)) {
    throw new RangeError('timeout must be a positive number, or Infinity')
  }
  // The global is looked up on each call, and called as a function: a browser's `fetch`
  // throws when it is called as a method of anything but the global object.
  const send: FetchFn = options.fetch ?? ((url, init) => fetch(url, init))
  const secrets = findSecrets(token)

  if (options.agent !== undefined || options.attachmentAgent !== undefined) {
    warnAgentIgnored()
  }

  let browser: boolean | undefined

  /**
   * Resolves with the API's answer, successful or not. Rejects when there is none: the
   * request failed, a file could not be read, or the call was aborted or timed out.
   */
  const call = async ({
    method,
    payload = {},
    signal,
  }: Invocation): Promise<ApiResponse<unknown>> => {
    browser ??= isBrowserFetch()

    // One signal for the caller's abort and for the timeout.
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
          // Reading a stream into memory can take as long as the stream likes.
          body = await mayAbortWith(controller.signal, toBlob(multipart.segments))
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
      // Some runtimes send what was read of a failed file and resolve the request.
      if (stream?.failure !== undefined) throw stream.failure.error

      return await toApiResponse(response, method)
    } catch (error) {
      if (stream?.failure !== undefined) {
        throw redact(stream.failure.error, secrets)
      }
      if (controller.signal.aborted) throw controller.signal.reason
      throw redact(error, secrets)
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
      // A runtime may leave the body open when the request is aborted or fails. The result
      // does not wait for it to close: a source can take as long as it likes to stop.
      stream?.close().catch(ignore)
    }
  }

  return { call }
}

/**
 * Whether this is a browser's `fetch`, which can only send the Bot API a request that needs
 * no preflight: no JSON, and no stream.
 *
 * A browser removes forbidden headers from a request, under the same security model that
 * makes it preflight; no other runtime does. Building a `Request` sends nothing.
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

/** Settles as the promise does, or rejects as soon as the signal aborts. */
function mayAbortWith<T>(signal: AbortSignal, promise: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(signal.reason)
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
    promise.then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', abort)
    })
  })
}

/**
 * The API's answer. Something else may answer in its place: a proxy, a gateway, a server
 * that is restarting. That is reported by its status when the status is an error, and is an
 * error otherwise.
 */
async function toApiResponse(
  response: FetchResponse,
  method: string
): Promise<ApiResponse<unknown>> {
  let answer: unknown
  try {
    answer = await response.json()
  } catch (error) {
    // Only a body that is not JSON is expected. The rest is the connection, or an abort.
    if (!isObject(error) || error.name !== 'SyntaxError') throw error
  }
  if (isObject(answer) && typeof answer.ok === 'boolean') {
    return answer as unknown as ApiResponse<unknown>
  }
  const { status } = response
  if (status < 400) {
    throw new Error(`${method}: HTTP ${status} is not a Bot API response`)
  }
  // There is no status text over HTTP/2.
  const description = response.statusText || `HTTP ${status}`
  return { ok: false, error_code: status, description }
}

/**
 * The part of the token that must not appear in an error, as it was given and as it is in
 * the address: there, tabs and newlines are dropped and some characters are encoded.
 */
function findSecrets(token: string): string[] {
  const { pathname } = new URL(`./${token}/`, 'https://telegraf.invalid/')
  const sent = pathname.slice(1).replace(/\/$/, '')
  const secrets = [token, sent]
    .map((text) => text.slice(text.indexOf(':') + 1))
    .filter((secret) => secret !== '')
  return [...new Set(secrets)]
}

/**
 * Redacts the token from the error's message, stack, or other properties.
 */
function redact(error: unknown, secrets: readonly string[]): unknown {
  const clean = (text: string) => {
    for (const secret of secrets) text = text.split(secret).join('[REDACTED]')
    return text
  }
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
      const value = read(target, key)
      if (typeof value !== 'string' || clean(value) === value) continue
      if (!write(target, key, clean(value))) cleaned = false
    }
    const errors = read(target, 'errors')
    if (Array.isArray(errors)) queue.push(...errors)
    queue.push(read(target, 'cause'))
  }
  if (cleaned) return error

  // Part of it cannot be changed, so none of it can be thrown.
  const properties: Record<string, unknown> = { name: String(error.name) }
  for (const [key, value] of Object.entries(error)) {
    if (typeof value === 'string') properties[key] = clean(value)
    else if (typeof value === 'number') properties[key] = value
  }
  return Object.assign(new Error(clean(String(error.message))), properties)
}

function read(target: Record<string, unknown>, key: string): unknown {
  try {
    return target[key]
  } catch {
    return undefined
  }
}

/** Assigns a property, or redefines it where it cannot be assigned. */
function write(
  target: Record<string, unknown>,
  key: string,
  value: string
): boolean {
  try {
    target[key] = value
  } catch {
    // a getter with no setter
  }
  if (read(target, key) === value) return true
  try {
    Object.defineProperty(target, key, {
      value,
      writable: true,
      configurable: true,
      enumerable: Object.prototype.propertyIsEnumerable.call(target, key),
    })
  } catch {
    // not configurable, or frozen
  }
  return read(target, key) === value
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

let warned = false

function warnAgentIgnored() {
  if (warned) return
  warned = true
  const message =
    'telegraf: `agent` and `attachmentAgent` are ignored. ' +
    'Pass your own `fetch` and configure the connection there.'
  const emitter = (globalThis as { process?: Partial<NodeJS.Process> }).process
  if (typeof emitter?.emitWarning === 'function') {
    emitter.emitWarning(message, 'DeprecationWarning', 'TELEGRAF_AGENT')
  } else {
    console.warn(message)
  }
}

function ignore() {
  // an error from a body that is being abandoned
}
