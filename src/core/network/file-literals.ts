/**
 * The file literals of v4: a `{ source }` or a `{ url }` object, with an optional `filename`.
 * They are converted to `InputFile`, which is what a request is searched for.
 */
import { createReadStream } from 'fs'
import { realpath, stat } from 'fs/promises'
import { basename } from 'path'
import { PassThrough } from 'stream'
import { InputFile, isPlainObject, type ByteStream } from './payload'
import { warnOnce } from './warning'

/** Using Symbol.for so two copies of Telegraf recognise each other's literals. */
const stamp = Symbol.for('telegraf.Input')

/**
 * Marks a literal as made by an `Input` helper. The mark is not enumerable, so the literal
 * has the same keys and the same JSON as before.
 */
export function stampInput<T extends object>(literal: T): T {
  return Object.defineProperty(literal, stamp, { value: true })
}

/** Opens the contents of a URL. Each way of sending a request has its own. */
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
 * The names a file is held under in the Bot API, and `thumb`, which v4 still accepts.
 * A link preview, a web app and a login button are `{ url }` objects too, and are never
 * held under one of these.
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

/** What to write instead of each kind of literal. */
const HELPERS = {
  path: 'Input.fromLocalFile(path)',
  buffer: 'Input.fromBuffer(buffer)',
  stream: 'Input.fromReadableStream(stream)',
  url: 'Input.fromURLStream(url)',
}

/**
 * Replaces every file literal in a payload with an `InputFile`. The payload is not changed:
 * objects and arrays that hold a literal are copied, everything else is shared.
 *
 * | literal | is a file |
 * | --- | --- |
 * | made by an `Input` helper | anywhere |
 * | exactly `{ source, filename? }` | anywhere, with a warning |
 * | exactly `{ url, filename? }` | under one of the names a file has, with a warning |
 *
 * A path and a URL are opened only when they are sent. A stream is open already, so the
 * streams are returned too: they are the caller's to release if the request fails.
 */
export function convertFileLiterals(
  payload: Record<string, unknown>,
  download: Download
): { payload: Record<string, unknown>; streams: SourceNodeStream[] } {
  const streams: SourceNodeStream[] = []

  const convert = (value: unknown, key: string): unknown => {
    if (Array.isArray(value)) {
      let copy: unknown[] | undefined
      value.forEach((item, index) => {
        // An item is held under the name of its array.
        const converted = convert(item, key)
        if (converted === item) return
        copy ??= value.slice()
        copy[index] = converted
      })
      return copy ?? value
    }
    if (!isPlainObject(value)) return value
    return toInputFile(value, key, download, streams) ?? convertObject(value)
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

  return { payload: convertObject(payload), streams }
}

function toInputFile(
  literal: Record<string, unknown>,
  key: string,
  download: Download,
  streams: SourceNodeStream[]
): InputFile | undefined {
  // Exactly a source or a URL, with or without a file name. A key whose value is
  // `undefined` is as good as absent: `Input.fromBuffer(buffer)` has such a `filename`.
  const { source, url, filename, ...rest } = literal
  if (Object.values(rest).some((value) => value !== undefined)) return undefined
  // v4 took a `null` name for no name, and a `URL` for its address.
  const name = filename ?? undefined
  const address = url instanceof URL ? url.href : url
  if (name !== undefined && typeof name !== 'string') return undefined
  if ((source === undefined) === (address === undefined)) return undefined
  const stamped = Object.prototype.hasOwnProperty.call(literal, stamp)

  if (address !== undefined) {
    if (typeof address !== 'string') return undefined
    if (!stamped && !FILE_KEYS.has(key)) return undefined
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
    return new InputFile(() => toIterable(source), name)
  }
  return undefined
}

/** Pre-async-iteration streams are made iterable */
function toIterable(stream: SourceNodeStream): AsyncIterable<Uint8Array> {
  const iterable = stream as Partial<AsyncIterable<Uint8Array>>
  if (typeof iterable[Symbol.asyncIterator] === 'function') {
    return stream as unknown as AsyncIterable<Uint8Array>
  }
  // Some custom implementations do not return the stream
  // So `stream.pipe(new PassThrough())` may not work
  const through = new PassThrough()
  stream.pipe(through)
  return through
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
