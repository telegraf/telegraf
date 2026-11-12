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
 * Downloads a URL. Each transport supplies its own. Called as soon as the literal is
 * converted, so the download can start right away.
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
 * A path is only opened when the file is sent. A URL is passed to `download` right away.
 * A stream is already open and may already be emitting, so it is piped right away too.
 * The streams are also returned: the caller must destroy them if the request fails.
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
        // An array item counts as being under its array's key.
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
    if (!stamped) warn('url', 'url')
    const contents = download(address)
    return new InputFile(() => contents, name)
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
  return undefined
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
