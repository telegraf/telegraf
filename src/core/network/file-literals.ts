/**
 * Converts v4's file literals, `{ source }` and `{ url }` objects with an optional
 * `filename`, to `InputFile`, which is what the serializer looks for.
 */
import { createReadStream } from 'fs'
import { realpath, stat } from 'fs/promises'
import { basename } from 'path'
import { finished, PassThrough } from 'stream'
import { InputFile, isPlainObject, type ByteStream } from './payload'
import { warnOnce } from './warning'

/** Using Symbol.for so two copies of Telegraf recognise each other's literals. */
const stamp = Symbol.for('telegraf.Input')

/**
 * Marks a literal as created by an `Input` helper. The marker is non-enumerable, so the
 * literal's keys and JSON are unchanged.
 */
export function stampInput<T extends object>(literal: T): T {
  return Object.defineProperty(literal, stamp, { value: true })
}

/**
 * Downloads a URL. Each transport supplies its own. Called when the upload reaches the
 * file: a download that waits for its turn can be dropped by its host.
 */
export type Download = (url: string) => ByteStream

/**
 * The Node stream of a `{ source }` literal.
 * We assume it may not have anything but `pipe`.
 */
export interface SourceNodeStream {
  pipe(destination: PassThrough): unknown
  destroy?: () => void
}

/**
 * The keys that hold a file in the Bot API, plus `thumb`, which v4 still accepts.
 * `LinkPreviewOptions`, `WebAppInfo` and `LoginUrl` are `{ url }` objects too, but never
 * appear under one of these keys.
 */
const FILE_KEYS = new Set([
  'animation',
  'audio',
  'certificate',
  'cover',
  'document',
  'live_photo',
  'media',
  'photo',
  'sticker',
  'thumb',
  'thumbnail',
  'video',
  'video_note',
  'voice',
])

/** The `Input` helper to suggest for each kind of literal. */
const HELPERS = {
  path: 'Input.fromLocalFile(path)',
  buffer: 'Input.fromBuffer(buffer)',
  stream: 'Input.fromReadableStream(stream)',
  function: 'Input.fromLazyStream(() => stream)',
  url: 'Input.fromURLStream(url)',
}

/**
 * Replaces every file literal in a payload with an `InputFile`. The payload is not
 * mutated: objects and arrays that contain a literal are copied, everything else is shared.
 *
 * | literal | treated as a file |
 * | --- | --- |
 * | created by an `Input` helper | anywhere |
 * | exactly `{ source, filename? }` | anywhere, with a warning |
 * | exactly `{ url, filename? }` | under a file key, with a warning |
 *
 * A path is opened, a URL is downloaded and a function is called only when the upload
 * reaches the file.
 * A stream is already open and may already be emitting, so it is piped right away.
 * The streams are also returned: the caller must destroy them if the request fails.
 *
 * Throws for a `{ url }` file that is not an `http:` or `https:` URL.
 */
export function convertFileLiterals(
  payload: Record<string, unknown>,
  download: Download
): { payload: Record<string, unknown>; streams: SourceNodeStream[] } {
  const streams: SourceNodeStream[] = []
  // The arrays and objects that the value being converted is inside of.
  const ancestors = new Set<unknown>([payload])

  const convert = (value: unknown, key: string): unknown => {
    const isArray = Array.isArray(value)
    if (!isArray && !isPlainObject(value)) return value
    // A value that contains itself can't be sent. `JSON.stringify` throws for it when
    // the payload is serialized, so it is left as it is.
    if (ancestors.has(value)) return value
    if (!isArray) {
      const file = toInputFile(value, key, download, streams)
      if (file !== undefined) return file
    }
    ancestors.add(value)
    const converted = isArray ? convertArray(value, key) : convertObject(value)
    ancestors.delete(value)
    return converted
  }

  const convertArray = (array: unknown[], key: string) => {
    let copy: unknown[] | undefined
    array.forEach((item, index) => {
      // An array item counts as being under its array's key.
      const converted = convert(item, key)
      if (converted === item) return
      copy ??= array.slice()
      copy[index] = converted
    })
    return copy ?? array
  }

  const convertObject = (object: Record<string, unknown>) => {
    let copy: Record<string, unknown> | undefined
    for (const [key, value] of Object.entries(object)) {
      const converted = convert(value, key)
      if (converted === value) continue
      copy ??= { ...object }
      copy[key] = converted
    }
    return copy ?? object
  }

  try {
    return { payload: convertObject(payload), streams }
  } catch (error) {
    // The caller never gets the streams found so far, so it can't destroy them.
    for (const stream of streams) stream.destroy?.()
    throw error
  }
}

/**
 * What else a `fetch` can read differs by runtime and includes local files, so a URL
 * taken from a user could upload one.
 */
function assertHttpUrl(url: string) {
  let protocol: string | undefined
  try {
    protocol = new URL(url).protocol
  } catch {
    // not a URL
  }
  if (protocol === 'http:' || protocol === 'https:') return
  throw new TypeError(
    `Unable to download '${url}': only http: and https: URLs are supported`
  )
}

function toInputFile(
  literal: Record<string, unknown>,
  key: string,
  download: Download,
  streams: SourceNodeStream[]
): InputFile | undefined {
  // Must be exactly a source or a URL, with an optional filename. A key set to `undefined`
  // counts as absent: `Input.fromBuffer(buffer)` produces `filename: undefined`.
  const { source, url, filename, ...rest } = literal
  if (Object.values(rest).some((value) => value !== undefined)) return undefined
  // v4 accepted a `null` filename and a `URL` object.
  const name = filename ?? undefined
  const address = url instanceof URL ? url.href : url
  if (name !== undefined && typeof name !== 'string') return undefined
  if ((source === undefined) === (address === undefined)) return undefined
  const stamped = Object.prototype.hasOwnProperty.call(literal, stamp)

  if (address !== undefined) {
    if (typeof address !== 'string') return undefined
    if (!stamped && !FILE_KEYS.has(key)) return undefined
    assertHttpUrl(address)
    if (!stamped) warn('url', 'url')
    return new InputFile(() => download(address), name)
  }
  if (typeof source === 'string') {
    if (!stamped) warn('path', 'source')
    return new InputFile(() => readFile(source), name ?? basename(source))
  }
  if (source instanceof Uint8Array) {
    if (!stamped) warn('buffer', 'source')
    return new InputFile(source, name)
  }
  if (isNodeStream(source)) {
    if (!stamped) warn('stream', 'source')
    streams.push(source)
    const contents = pipeSource(source)
    return new InputFile(() => contents, name)
  }
  if (typeof source === 'function') {
    if (!stamped) warn('function', 'source')
    const open = source as () => unknown
    return new InputFile(() => openLazyStream(open), name)
  }
  return undefined
}

/** Calls the function of a lazy stream and returns the stream it gives. */
function openLazyStream(open: () => unknown): ByteStream {
  const stream = open()
  if (!isThenable(stream)) return toByteStream(stream)
  return (async function* () {
    yield* toByteStream(await stream) as AsyncIterable<Uint8Array>
  })()
}

/** The stream a lazy stream function gave: the value itself, or the `body` of a `Response`. */
function toByteStream(value: unknown): ByteStream {
  if (isAsyncIterable(value)) return value
  const response = value as Partial<Response> | null | undefined
  const body: unknown = response?.body
  if (isAsyncIterable(body)) {
    // The body of an error status is an error page, not the file.
    if (response?.ok === false) {
      const { url, status, statusText } = response
      throw downloadError(String(url), Number(status), String(statusText))
    }
    return body
  }
  throw new TypeError(
    'The function given to `Input.fromLazyStream` must return a stream, ' +
      'an async iterable or a `Response` that has a body.'
  )
}

// A web stream is an async iterable too, on Node, Bun and Deno.
function isAsyncIterable(value: unknown): value is AsyncIterable<Uint8Array> {
  const iterable = value as Partial<AsyncIterable<unknown>> | null | undefined
  return typeof iterable?.[Symbol.asyncIterator] === 'function'
}

export function downloadError(url: string, status: number, statusText: string) {
  return new Error(`Unable to download '${url}': ${status} ${statusText}`)
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as { then?: unknown } | null)?.then === 'function'
}

/**
 * Pipes a stream into a `PassThrough` and returns the `PassThrough`.
 *
 * The upload may reach the stream much later. Until then a stream in flowing mode, or a
 * pre-streams2 stream, emits its data to nobody, and its `error` event is unhandled.
 */
function pipeSource(stream: SourceNodeStream): PassThrough {
  const through = new PassThrough()
  // Some custom implementations of `pipe` don't return the destination.
  stream.pipe(through)
  // The `error` of a destroyed `PassThrough` is unhandled until the upload reads it.
  through.on('error', noop)
  // An object with nothing but `pipe` can't report an error.
  if (typeof (stream as Partial<NodeJS.ReadableStream>).on !== 'function') {
    return through
  }
  // `pipe` doesn't forward an error or a premature close.
  const removeListeners = finished(
    stream as NodeJS.ReadableStream,
    { writable: false },
    (error) => {
      removeListeners()
      if (error != null) through.destroy(error)
    }
  )
  return through
}

function noop() {
  // intentionally empty
}

function warn(kind: keyof typeof HELPERS, shape: 'source' | 'url') {
  warnOnce(
    `TELEGRAF_FILE_${kind.toUpperCase()}`,
    `telegraf: a file was given as a plain \`{ ${shape} }\` object. ` +
      `Use \`${HELPERS[kind]}\` instead: plain objects will not be accepted in v6.`
  )
}

async function* readFile(path: string): AsyncGenerator<Uint8Array> {
  if (!(await stat(await realpath(path))).isFile()) {
    throw new TypeError(`Unable to upload '${path}', not a file`)
  }
  yield* createReadStream(path)
}

function isNodeStream(value: unknown): value is SourceNodeStream {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { pipe?: unknown }).pipe === 'function'
  )
}
