import type * as tg from './core/types/typegram'

/** Using Symbol.for so two copies of Telegraf recognise each other's files. */
const brand: unique symbol = Symbol.for('telegraf.InputFile')

/**
 * A file to upload. `source` is one of:
 *
 * - a string that starts with `http://` or `https://`, or a `URL`: downloaded when the
 *   upload reaches the file
 * - any other string: the path of a local file
 * - a `Uint8Array`, such as a `Buffer`, an `ArrayBuffer`, or a `Blob`, such as a `File`
 * - a Node stream, a web stream, an async iterable of bytes, or a `Response`, such as
 *   the one `fetch` returns: read once, so the file can be sent once
 * - a function that returns any of these, an `InputFile`, or a promise for one: called
 *   when the upload reaches the file, in every call the file is sent in. It is passed an
 *   `AbortSignal` that aborts when the call ends, to pass on to `fetch`.
 *
 * A `file_id`, or a URL for Telegram to download, is not an `InputFile`: pass it as a
 * string.
 *
 * A string that doesn't start with `http://` or `https://` is read as a local path, so
 * wrap a URL from outside the bot in `new URL()`.
 *
 * `filename` defaults to the file name of a path, the last segment of a URL, or the name
 * of a `File`. Without one, the file is named after the parameter it is sent in, such as
 * `photo.jpg`. When a function returns an `InputFile`, the `filename` of the outer one
 * takes precedence.
 *
 * ```ts
 * await ctx.replyWithDocument(new InputFile('report.pdf'))
 * await ctx.replyWithPhoto(new InputFile('https://example.com/cat.jpg'))
 * await ctx.replyWithDocument(new InputFile((signal) => fetch(url, { signal })))
 * ```
 */
export class InputFile {
  readonly filename?: string

  /** `filename` may be `null` for no name, as in the plain file objects of v4. */
  constructor(
    readonly source: tg.InputFile.Source,
    filename?: string | null
  ) {
    // A JavaScript caller, or a value typed `any`, can pass anything.
    if (filename != null && typeof filename !== 'string') {
      throw new TypeError('The filename of an InputFile must be a string.')
    }
    this.filename = filename ?? undefined
    // Not a declared member: each installed copy would declare its own `unique symbol`,
    // and an `InputFile` of one copy wouldn't be assignable to another copy's.
    Object.defineProperty(this, brand, { value: true })
  }

  static is(value: unknown): value is InputFile {
    return (
      typeof value === 'object' &&
      value !== null &&
      (value as { [brand]?: unknown })[brand] === true
    )
  }

  /** Names the file, without its path or contents. */
  toJSON(): string {
    // A logger may serialise a `TelegramError`, whose `on` holds the payload of the call.
    return this.filename === undefined
      ? '[InputFile]'
      : `[InputFile ${this.filename}]`
  }
}
