/**
 * Converts the files of a payload to `MultipartFile`, which is what the serialiser looks
 * for: `InputFile`s, and v4's file literals, `{ source }` and `{ url }` objects with an
 * optional `filename`.
 */
import { createReadStream } from 'fs'
import { realpath, stat } from 'fs/promises'
import { finished, PassThrough } from 'stream'
import { isBrandedInputFile, isUrl } from '../../input-file'
import type { ByteStream, Node, Web } from '../types/platform'
import {
  MultipartFile,
  extension,
  isPlainObject,
  type DeferredFile,
  type FileSource,
} from './payload'
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
 * Destroys the Node streams that were not read to their end, and cancels the web streams.
 *
 * A Node stream that was read to its end holds nothing open, and it may be a duplex whose
 * other side is still in use, such as a socket. A web stream that the upload read is
 * locked by its reader, so cancelling it fails, and the reader's owner releases it.
 */
export function destroyUnread(
  streams: readonly (Node.Readable | Web.ReadableStream)[]
) {
  for (const stream of streams) {
    if (isWebStream(stream)) stream.cancel().catch(noop)
    else if (stream.readableEnded !== true) stream.destroy?.()
  }
}

/**
 * The keys that hold a file in the Bot API, plus the ones it no longer documents and
 * the Bot API server still reads: `thumb` and the three sticker keys of before 6.6.
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
  'png_sticker',
  'sticker',
  'tgs_sticker',
  'thumb',
  'thumbnail',
  'video',
  'video_note',
  'voice',
  'webm_sticker',
])

/** What to use in place of each kind of literal. */
const REPLACEMENTS = {
  path: 'InputFile.fromLocalFile(path)',
  buffer: 'new InputFile(buffer)',
  stream: 'new InputFile(stream)',
  url: 'InputFile.fromURLStream(url)',
  blob: 'new InputFile(blob)',
  response: 'new InputFile(response)',
  iterable: 'new InputFile(iterable)',
  function: 'new InputFile(() => file)',
}

/**
 * The most `InputFile`s that one file can be nested in. A function that returns its own
 * `InputFile`, or a new `InputFile` with the same function, would otherwise be called forever.
 */
const MAX_DEPTH = 10

/** The files made from a stream that were already sent. A stream can be read once. */
const sent = new WeakSet<object>()

/** The problem with sending a file made from a stream a second time. */
const SENT_STREAM =
  'a file made from a stream can be sent once; ' +
  'make it from a function that returns the stream to send it again'

/** The problem with sending a stream that was already read. */
const USED_STREAM =
  'the stream was already read or destroyed; ' +
  'pass a new stream to send the file again'

/**
 * Replaces every file in a payload with a `MultipartFile`. The payload is not mutated:
 * objects and arrays that contain a file are copied, everything else is shared.
 *
 * | value | treated as a file |
 * | --- | --- |
 * | an `InputFile` | anywhere |
 * | a literal created by an `Input` helper | anywhere |
 * | exactly `{ source, filename? }` | anywhere, with a warning |
 * | exactly `{ url, filename? }` | under a file key, with a warning |
 *
 * A path is opened, a URL is downloaded and a function is called only when the upload
 * reaches the file. The function of an `InputFile` is passed `signal`, which the caller
 * aborts when the call ends.
 * A stream passed as a file is already open and may already be emitting, so it is piped
 * right away. These streams are also returned: the caller must destroy them if the request
 * fails.
 *
 * Throws for a file that can't be sent: a URL that is not an `http:` or `https:` URL, an
 * `InputFile` made from a stream that was already sent, a `Response` with an error status,
 * and an object that holds the contents of a file under `source` and is not a file literal.
 */
export function convertFiles(
  payload: Record<string, unknown>,
  download: Download,
  signal: AbortSignal = new AbortController().signal
): {
  payload: Record<string, unknown>
  streams: (Node.Readable | Web.ReadableStream)[]
} {
  const streams: (Node.Readable | Web.ReadableStream)[] = []
  // The arrays and objects that the value being converted is inside of.
  const ancestors = new Set<unknown>([payload])

  const convert = (value: unknown, key: string): unknown => {
    if (isBrandedInputFile(value)) {
      const keys = value as InputFileKeys
      return fromInputFile(value, keys, key, download, signal, streams)
    }
    const isArray = Array.isArray(value)
    if (!isArray && !isPlainObject(value)) {
      const source = (value as { source?: unknown } | null)?.source
      if (!MultipartFile.is(value) && isFileContent(source)) {
        throw invalidFile(source, key, 'a file must be a plain object')
      }
      return value
    }
    // A value that contains itself can't be sent. `JSON.stringify` throws for it when
    // the payload is serialised, so it is left as it is.
    if (ancestors.has(value)) return value
    if (!isArray) {
      const file = toMultipartFile(value, key, download, signal, streams)
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
    destroyUnread(streams)
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

/** The keys of an `InputFile`: its source, or the URL it downloads. */
interface InputFileKeys {
  source?: unknown
  url?: string
  filename?: string
}

/**
 * Converts an `InputFile`, or a plain object with a source that 4.16.3 didn't accept, such
 * as a `Blob`. `keys` are the keys of `file`, without `null`. `file` is marked as sent
 * when its contents can be read once.
 */
function fromInputFile(
  file: object,
  keys: InputFileKeys,
  key: string,
  download: Download,
  signal: AbortSignal,
  streams: (Node.Readable | Web.ReadableStream)[]
): MultipartFile {
  const { source, url, filename } = keys
  if (url !== undefined) {
    const contents = fromUrl(url, key, download)
    return new MultipartFile(contents.source, filename ?? contents.name)
  }
  if (typeof source === 'function') {
    const deferred: DeferredFile = {
      open: () =>
        openNested(
          source as (signal: AbortSignal) => unknown,
          key,
          download,
          signal
        ),
    }
    return new MultipartFile(deferred, filename)
  }
  // The stream is not destroyed: another call may still be reading it.
  if (sent.has(file)) throw fileError(key, SENT_STREAM)
  const contents = toContents(source, key, download)
  if (contents.once === true) sent.add(file)
  if (contents.stream !== undefined) streams.push(contents.stream)
  return new MultipartFile(contents.source, filename ?? contents.name)
}

/**
 * Opens a file whose source is a function. Called when the upload reaches the file.
 *
 * Returns the stream, and the `filename` of the outermost nested file that has one, or
 * else the name that `toContents` finds. The `filename` of the file itself takes
 * precedence; the serialiser applies it.
 */
async function openNested(
  source: (signal: AbortSignal) => unknown,
  key: string,
  download: Download,
  signal: AbortSignal
) {
  let value: unknown = source
  let name: string | undefined
  let depth = 1
  // The nested file that `value` is the source of.
  let innermost: object | undefined
  for (;;) {
    let keys: InputFileKeys | undefined
    if (typeof value === 'function') {
      value = await (value as (signal: AbortSignal) => unknown)(signal)
      if (typeof value === 'function') {
        throw invalidFile(
          value,
          key,
          'the function of an InputFile returned a function'
        )
      }
      // A string could be a path or a URL; an `InputFile` says which.
      if (typeof value === 'string') {
        throw fileError(
          key,
          'the function of an InputFile returned a string; return ' +
            '`InputFile.fromLocalFile(path)` or `InputFile.fromURLStream(url)`'
        )
      }
      // A plain `{ source }` or `{ url }`, which is typed as an `InputFile`. Other plain
      // objects can be contents, such as a `Response` by its members, which has a `url`.
      if (
        isPlainObject(value) &&
        !isResponse(value) &&
        ('source' in value || 'url' in value)
      ) {
        const literal = literalKeys(value, key)
        if (literal === undefined) {
          throw invalidFile(
            value,
            key,
            'the function of an InputFile returned an object that is not exactly ' +
              '`{ source, filename? }` or `{ url, filename? }`'
          )
        }
        if (!literal.stamped) warn(literal)
        keys = literal
      }
    }
    if (keys === undefined) {
      if (!isBrandedInputFile(value)) break
      keys = value as InputFileKeys
    }
    if (++depth > MAX_DEPTH) {
      throw invalidFile(
        value,
        key,
        `InputFiles are nested more than ${MAX_DEPTH} deep`
      )
    }
    if (sent.has(value as object)) throw fileError(key, SENT_STREAM)
    name ??= keys.filename
    if (keys.url !== undefined) {
      const contents = fromUrl(keys.url, key, download)
      return {
        stream: toByteStream(contents.source),
        name: name ?? contents.name,
      }
    }
    innermost = value as object
    value = keys.source
  }
  const contents = toContents(value, key, download)
  // `file` is not added: its function is called again in every call.
  if (contents.once === true && innermost !== undefined) sent.add(innermost)
  return { stream: toByteStream(contents.source), name: name ?? contents.name }
}

/** The contents of a file, converted for the serialiser. */
interface Contents {
  source: Exclude<FileSource, DeferredFile>
  /** The file name of a path, the last segment of a URL, or the name of a `File`. */
  name?: string
  /** The stream passed as the contents. The call releases it if it doesn't read it to the end. */
  stream?: Node.Readable | Web.ReadableStream
  /** Whether the contents can only be read once. */
  once?: boolean
}

function toContents(value: unknown, key: string, download: Download): Contents {
  // The source of `InputFile.fromLocalFile(path)`, the only `InputFile` with a string.
  if (typeof value === 'string') {
    return { source: () => readFile(value), name: basename(value) }
  }
  if (isUrl(value)) return fromUrl(value.href, key, download)
  if (value instanceof Uint8Array || isArrayBuffer(value))
    return { source: value }
  if (isBlob(value)) {
    const name = blobName(value)
    // A request that can't stream is sent as a `Blob` of its parts, and the `Blob`
    // constructor only takes the runtime's own `Blob`s as parts.
    if (typeof Blob === 'function' && value instanceof Blob) {
      return { source: value, name }
    }
    return { source: () => value.stream(), name }
  }
  if (isNodeStream(value)) {
    if (isUsed(value)) throw fileError(key, USED_STREAM)
    const contents = pipeSource(value)
    return { source: () => contents, stream: value, once: true }
  }
  // Checked before `isAsyncIterable`, which a web stream also passes on Node, Bun and
  // Deno: an unread web stream must be cancelled.
  if (isWebStream(value)) {
    if (isUsed(value)) throw fileError(key, USED_STREAM)
    return { source: () => value, stream: value, once: true }
  }
  if (isResponse(value)) return fromResponse(value, key)
  if (isAsyncIterable(value)) return { source: () => value, once: true }
  const kind = Object.prototype.toString.call(value)
  throw invalidFile(value, key, `${kind} is not the contents of a file`)
}

function fromUrl(url: string, key: string, download: Download): Contents {
  assertHttpUrl(url)
  return { source: () => download(url), name: urlName(url, key) }
}

function isResponse(value: unknown): value is Web.Response {
  return (
    typeof value === 'object' &&
    value !== null &&
    'body' in value &&
    typeof (value as { status?: unknown }).status === 'number'
  )
}

/** The body of a `Response`. The body of an error status is an error page, not the file. */
function fromResponse(response: Web.Response, key: string): Contents {
  const { ok, status, statusText = '', url = '', body } = response
  if (ok === false || !(status >= 200 && status <= 299)) {
    if (isNodeStream(body) || isWebStream(body)) destroyUnread([body])
    throw downloadError(String(url), status, String(statusText))
  }
  const name = urlName(url, key)
  // e.g. the response of node-fetch 2. Its body is open, so it is piped as any other
  // Node stream is.
  if (isNodeStream(body)) {
    if (isUsed(body)) throw fileError(key, USED_STREAM)
    const contents = pipeSource(body)
    return { source: () => contents, name, stream: body, once: true }
  }
  if (isWebStream(body)) {
    if (isUsed(body)) throw fileError(key, USED_STREAM)
    return { source: () => body, name, stream: body, once: true }
  }
  if (isAsyncIterable(body)) return { source: () => body, name, once: true }
  throw new Error(
    `Unable to download '${String(url)}': the response has no body`
  )
}

/** The contents as a stream, for a file that is opened when the upload reaches it. */
function toByteStream(source: Exclude<FileSource, DeferredFile>): ByteStream {
  if (typeof source === 'function') return source()
  if (source instanceof Blob) return source.stream() as ByteStream
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(source)
  return (async function* () {
    yield bytes
  })()
}

/**
 * The last segment of a URL's path, or `undefined` for none. A segment without an
 * extension, such as `render` in `/render?id=7`, gets the one of a file sent as `key`.
 */
function urlName(url: unknown, key: string): string | undefined {
  let path: string
  try {
    path = new URL(String(url)).pathname
  } catch {
    return undefined
  }
  const segment = path.slice(path.lastIndexOf('/') + 1)
  if (segment === '') return undefined
  let name = segment
  try {
    name = decodeURIComponent(segment)
  } catch {
    // not percent-encoded as a whole: the segment is the name as it is
  }
  return /[^.]\.[^.]+$/.test(name) ? name : `${name}.${extension(key)}`
}

function isBlob(value: unknown): value is Web.Blob {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { size?: unknown }).size === 'number' &&
    typeof (value as { type?: unknown }).type === 'string' &&
    typeof (value as { stream?: unknown }).stream === 'function'
  )
}

function blobName(blob: Web.Blob): string | undefined {
  const { name } = blob as { name?: unknown }
  if (typeof name !== 'string') return undefined
  // `Bun.file(path).name` is the path as it was given.
  const base = basename(name)
  return base === '' ? undefined : base
}

/**
 * The last segment of a path, after its last `/` or `\`.
 */
function basename(path: string) {
  return path.slice(Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')) + 1)
}

function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return Object.prototype.toString.call(value) === '[object ArrayBuffer]'
}

/** The keys of a file literal, and whether an `Input` helper created it. */
interface LiteralKeys extends InputFileKeys {
  stamped: boolean
}

/**
 * Reads a file literal: exactly a source or a URL, with an optional filename.
 *
 * Returns `undefined` for an object that is not a file literal. Throws for one that holds
 * the contents of a file and can't be sent.
 */
function literalKeys(
  literal: Record<string, unknown>,
  key: string
): LiteralKeys | undefined {
  // `source`, `url` and `filename` are not set when they are `null` or `undefined`: a
  // literal may be built as `{ source: maybeSource, url: maybeUrl, filename }`, and v4
  // accepted a `null` filename. Any other key is not set only when it is `undefined`.
  const { source: maybeSource, url, filename, ...rest } = literal
  const source = maybeSource ?? undefined
  // v4 accepted a `URL` object.
  const address = (url instanceof URL ? url.href : url) ?? undefined
  const extraKey = Object.keys(rest).find((key) => rest[key] !== undefined)

  let problem: string | undefined
  if (extraKey !== undefined) problem = `unexpected key \`${extraKey}\``
  else if (source !== undefined && address !== undefined) {
    problem = 'both `source` and `url` are set'
  } else if (filename != null && typeof filename !== 'string') {
    problem = '`filename` must be a string'
  } else if (isUrl(source)) {
    // `new InputFile(url)` is a `{ url }`: no kind of file has a `URL` as its source.
    problem = "a URL can't be a `source`; use `new InputFile(url)`"
  }
  if (problem !== undefined) {
    if (isFileContent(source)) throw invalidFile(source, key, problem)
    return undefined
  }
  const stamped = Object.prototype.hasOwnProperty.call(literal, stamp)
  const name = typeof filename === 'string' ? filename : undefined
  if (address !== undefined) {
    if (typeof address !== 'string') return undefined
    if (!stamped && !FILE_KEYS.has(key)) return undefined
    return { url: address, filename: name, stamped }
  }
  if (typeof source !== 'string' && !isFileContent(source)) return undefined
  return { source, filename: name, stamped }
}

function toMultipartFile(
  literal: Record<string, unknown>,
  key: string,
  download: Download,
  signal: AbortSignal,
  streams: (Node.Readable | Web.ReadableStream)[]
): MultipartFile | undefined {
  const keys = literalKeys(literal, key)
  if (keys === undefined) return undefined
  const { source, url, filename, stamped } = keys
  if (url !== undefined) {
    assertHttpUrl(url)
    if (!stamped) warn(keys)
    return new MultipartFile(() => download(url), filename)
  }
  if (typeof source === 'string') {
    if (!stamped) warn(keys)
    return new MultipartFile(
      () => readFile(source),
      filename ?? basename(source)
    )
  }
  if (source instanceof Uint8Array) {
    if (!stamped) warn(keys)
    return new MultipartFile(source, filename)
  }
  if (isNodeStream(source)) {
    if (isUsed(source)) throw fileError(key, USED_STREAM)
    if (!stamped) warn(keys)
    streams.push(source)
    const contents = pipeSource(source)
    return new MultipartFile(() => contents, filename)
  }
  // A kind that 4.16.3 didn't accept, such as a `Blob`: sent as `new InputFile(source)` is.
  if (!stamped) warn(keys)
  return fromInputFile(literal, keys, key, download, signal, streams)
}

function isAsyncIterable(value: unknown): value is AsyncIterable<Uint8Array> {
  const iterable = value as Partial<AsyncIterable<unknown>> | null | undefined
  return typeof iterable?.[Symbol.asyncIterator] === 'function'
}

export function downloadError(url: string, status: number, statusText: string) {
  return new Error(`Unable to download '${url}': ${status} ${statusText}`)
}

/**
 * Pipes a stream into a `PassThrough` and returns the `PassThrough`.
 *
 * The upload may reach the stream much later. Until then a stream in flowing mode, or a
 * pre-streams2 stream, emits its data to nobody, and its `error` event is unhandled.
 */
function pipeSource(stream: Node.Readable): PassThrough {
  const through = new PassThrough()
  // Some custom implementations of `pipe` don't return the destination.
  stream.pipe(through)
  // The `error` of a destroyed `PassThrough` is unhandled until the upload reads it.
  through.on('error', noop)
  // Destroying the `PassThrough` doesn't destroy `stream`: a stream that a function
  // returned is destroyed this way when its upload ends early.
  through.once('close', () => destroyUnread([stream]))
  // An object with nothing but `pipe` can't report an error.
  if (typeof (stream as { on?: unknown }).on !== 'function') {
    return through
  }
  // `pipe` doesn't forward an error or a premature close.
  const removeListeners = finished(
    stream as Parameters<typeof finished>[0],
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

function warn(keys: InputFileKeys) {
  const kind = kindOf(keys)
  const shape = kind === 'url' ? 'url' : 'source'
  warnOnce(
    `TELEGRAF_FILE_${kind.toUpperCase()}`,
    `telegraf: a file was passed as a plain \`{ ${shape} }\` object. ` +
      `Use \`${REPLACEMENTS[kind]}\` instead: plain objects will not be accepted in v6.`
  )
}

/** The kind of a file literal, which says what to use in its place. */
function kindOf({ source, url }: InputFileKeys): keyof typeof REPLACEMENTS {
  if (url !== undefined) return 'url'
  if (typeof source === 'string') return 'path'
  if (source instanceof Uint8Array || isArrayBuffer(source)) return 'buffer'
  if (isNodeStream(source) || isWebStream(source)) return 'stream'
  if (isBlob(source)) return 'blob'
  if (isResponse(source)) return 'response'
  if (typeof source === 'function') return 'function'
  return 'iterable'
}

async function* readFile(path: string): AsyncGenerator<Uint8Array> {
  if (!(await stat(await realpath(path))).isFile()) {
    throw new TypeError(`Unable to upload '${path}', not a file`)
  }
  yield* createReadStream(path)
}

function isNodeStream(value: unknown): value is Node.Readable {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { pipe?: unknown }).pipe === 'function'
  )
}

function isWebStream(value: unknown): value is Web.ReadableStream {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { getReader?: unknown }).getReader === 'function'
  )
}

/**
 * Whether a stream has nothing left to upload: a Node stream that was read to its end or
 * destroyed, or a web stream that a reader holds.
 */
function isUsed(stream: Node.Readable | Web.ReadableStream) {
  if (isWebStream(stream)) return stream.locked === true
  return stream.readableEnded === true || stream.destroyed === true
}

/** A `source` that can only be meant as the contents of a file. A string may not be. */
function isFileContent(source: unknown): boolean {
  return (
    source instanceof Uint8Array ||
    typeof source === 'function' ||
    isNodeStream(source) ||
    isWebStream(source) ||
    isBlob(source) ||
    isArrayBuffer(source) ||
    isResponse(source) ||
    isUrl(source) ||
    isAsyncIterable(source)
  )
}

/**
 * The error for an object that holds the contents of a file and can't be sent as one.
 *
 * Left alone it is sent as JSON: a Buffer as one number per byte, a file stream as its
 * internal state, which includes its path.
 */
function invalidFile(source: unknown, key: string, problem: string) {
  // The stream was passed to be read, and this call won't read it.
  if (isNodeStream(source)) source.destroy?.()
  else if (isWebStream(source)) source.cancel().catch(noop)
  return fileError(key, problem)
}

/**
 * The error for a file that can't be sent, which leaves its stream as it is. A stream that
 * was already read may be a duplex whose other side is still in use, and one that another
 * call is reading must not be destroyed under it.
 */
function fileError(key: string, problem: string) {
  return new TypeError(`Invalid file under \`${key}\`: ${problem}.`)
}
