import type * as tg from './core/types/typegram'
import type { Web } from './core/types/platform'

/** Using Symbol.for so two copies of Telegraf recognise each other's files. */
const brand: unique symbol = Symbol.for('telegraf.InputFile')

/**
 * The constructor and the static members of `InputFile`. Each signature returns the plain
 * object that an `InputFile` of that kind matches.
 */
export interface InputFileConstructor {
  new (source: Web.URL, filename?: string | null): tg.InputFile.ByURL
  new (
    source: tg.InputFile.ByBuffer['source'],
    filename?: string | null
  ): tg.InputFile.ByBuffer
  new (
    source: tg.InputFile.ByBytes['source'],
    filename?: string | null
  ): tg.InputFile.ByBytes
  new (
    source: tg.InputFile.ByBlob['source'],
    filename?: string | null
  ): tg.InputFile.ByBlob
  new (
    source: tg.InputFile.ByReadableStream['source'],
    filename?: string | null
  ): tg.InputFile.ByReadableStream
  new (
    source: tg.InputFile.ByWebStream['source'],
    filename?: string | null
  ): tg.InputFile.ByWebStream
  new (
    source: tg.InputFile.ByAsyncIterable['source'],
    filename?: string | null
  ): tg.InputFile.ByAsyncIterable
  new (
    source: tg.InputFile.ByResponse['source'],
    filename?: string | null
  ): tg.InputFile.ByResponse
  new (
    source: tg.InputFile.ByFunction['source'],
    filename?: string | null
  ): tg.InputFile.ByFunction
  // A value typed as the union of the kinds matches none of the signatures above.
  new (source: tg.InputFile.Source, filename?: string | null): tg.InputFile

  /** The local file at `path`. */
  fromLocalFile(path: string, filename?: string | null): tg.InputFile.ByPath
  /**
   * The file at `url`, downloaded when the upload reaches it. Only `http:` and `https:` URLs
   * are accepted.
   */
  fromURLStream(
    url: string | Web.URL,
    filename?: string | null
  ): tg.InputFile.ByURL
}

/** The keys of an `InputFile`: those of the plain object it matches. */
interface Fields {
  source?: unknown
  url?: string
  filename?: string
}

/**
 * A file to upload.
 *
 * - `InputFile.fromLocalFile(path)`: the local file at `path`
 * - `InputFile.fromURLStream(url)`, or `new InputFile(url)` for a `URL`: downloaded when the
 *   upload reaches the file. Only `http:` and `https:` URLs are accepted.
 * - `new InputFile(source)` for a `Uint8Array`, such as a `Buffer`, an `ArrayBuffer`, or a
 *   `Blob`, such as a `File`
 * - `new InputFile(source)` for a Node stream, a web stream, an async iterable of bytes, or
 *   a `Response`, such as the one `fetch` returns: read once, so the file can be sent once
 * - `new InputFile(source)` for a function that returns any of these, an `InputFile`, or a
 *   promise for one: called when the upload reaches the file, in every call the file is
 *   sent in. It is passed an `AbortSignal` that aborts when the call ends, to pass on to
 *   `fetch`.
 *
 * A `file_id`, or a URL for Telegram to download, is not an `InputFile`: pass it as a
 * string.
 *
 * `filename` defaults to the file name of a path, the last segment of a URL, or the name
 * of a `File`. Without one, the file is named after the parameter it is sent in, such as
 * `photo.jpg`. When a function returns an `InputFile`, the `filename` of the outer one
 * takes precedence. `filename` may be `null` for no name, as in the plain file objects of
 * v4.
 *
 * An `InputFile` is typed as the plain object it matches, such as `InputFile.ByPath` for
 * `InputFile.fromLocalFile(path)`.
 *
 * ```ts
 * await ctx.replyWithDocument(InputFile.fromLocalFile('report.pdf'))
 * await ctx.replyWithPhoto(InputFile.fromURLStream('https://example.com/cat.jpg'))
 * await ctx.replyWithDocument(new InputFile((signal) => fetch(url, { signal })))
 * ```
 */
export const InputFile = class InputFile {
  // Not class fields: an instance has the keys of its plain object only, `source` or `url`.
  declare readonly source?: unknown
  declare readonly url?: string
  declare readonly filename?: string

  constructor(source: unknown, filename?: unknown) {
    if (typeof source === 'string') {
      throw new TypeError(
        'A string is not the source of an InputFile: use `InputFile.fromLocalFile(path)` ' +
          'for a local file, or `InputFile.fromURLStream(url)` to download a URL.'
      )
    }
    // The types refuse it too; a function that returns the `InputFile` is accepted.
    if (isBrandedInputFile(source)) {
      throw new TypeError(
        'An InputFile is not the source of an InputFile: use `new InputFile(() => file)`.'
      )
    }
    init(this, isUrl(source) ? { url: source.href } : { source }, filename)
  }

  static fromLocalFile(path: unknown, filename?: unknown) {
    if (typeof path !== 'string') {
      throw new TypeError('The path of an InputFile must be a string.')
    }
    return init(
      Object.create(this.prototype) as Fields,
      { source: path },
      filename
    )
  }

  static fromURLStream(url: unknown, filename?: unknown) {
    const href =
      typeof url === 'string' ? url : isUrl(url) ? url.href : undefined
    if (href === undefined) {
      throw new TypeError('The URL of an InputFile must be a string or a URL.')
    }
    return init(
      Object.create(this.prototype) as Fields,
      { url: href },
      filename
    )
  }

  /** Names the file, without its path or contents. */
  toJSON(): string {
    // A logger may serialise a `TelegramError`, whose `on` holds the payload of the call.
    return this.filename === undefined
      ? '[InputFile]'
      : `[InputFile ${this.filename}]`
  }
} as unknown as InputFileConstructor

/** An `InputFile`, or a file passed as a plain object, which is deprecated. */
export type InputFile = tg.InputFile

/** Sets the keys and the brand of an `InputFile`. */
function init<T extends Fields>(
  file: T,
  keys: { source: unknown } | { url: string },
  filename: unknown
): T {
  // A JavaScript caller, or a value typed `any`, can pass anything.
  if (filename != null && typeof filename !== 'string') {
    throw new TypeError('The filename of an InputFile must be a string.')
  }
  Object.assign(file, keys, { filename: filename ?? undefined })
  // Not a declared member: each installed copy would declare its own `unique symbol`,
  // and an `InputFile` of one copy wouldn't be assignable to another copy's.
  Object.defineProperty(file, brand, { value: true })
  return file
}

/**
 * @internal Whether a value was made by `InputFile`, of any installed copy of Telegraf. A
 * plain object of the same shape wasn't.
 */
export function isBrandedInputFile(value: unknown): value is InputFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [brand]?: unknown })[brand] === true
  )
}

/** @internal A `URL`: an object with a string `href`. */
export function isUrl(value: unknown): value is Web.URL {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { href?: unknown }).href === 'string'
  )
}
