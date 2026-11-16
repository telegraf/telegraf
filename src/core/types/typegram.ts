import * as Typegram from '@telegraf/types'
import type { ByteStream, Web } from './platform'

// internal type provisions
export * from '@telegraf/types/api'
export * from '@telegraf/types/inline'
export * from '@telegraf/types/manage'
export * from '@telegraf/types/markup'
export * from '@telegraf/types/message'
export * from '@telegraf/types/methods'
export * from '@telegraf/types/passport'
export * from '@telegraf/types/payment'
export * from '@telegraf/types/settings'
export * from '@telegraf/types/update'

// telegraf input file definition
/**
 * The plain objects that an `InputFile` matches, one for each kind of file. Passing one
 * yourself, such as `{ source: 'report.pdf' }`, is deprecated: use `InputFile`.
 */
export declare namespace InputFile {
  /** The contents of a file that the function of an `InputFile` may return. */
  type Contents =
    | Web.URL
    | Uint8Array
    | ArrayBuffer
    | Web.Blob
    | ByteStream
    | Web.Response
  /** The `source` that `new InputFile()` accepts. */
  type Source = Contents | ByFunction['source']
  /** `InputFile.fromLocalFile(path)` */
  interface ByPath {
    source: string
    filename?: string
  }
  /** `new InputFile(stream)` for a Node stream */
  interface ByReadableStream {
    source: NodeJS.ReadableStream
    filename?: string
  }
  /** `new InputFile(buffer)` */
  interface ByBuffer {
    source: Buffer
    filename?: string
  }
  /** `InputFile.fromURLStream(url)`, or `new InputFile(url)` for a `URL` */
  interface ByURL {
    url: string
    filename?: string
  }
  /** `new InputFile(bytes)` for a `Uint8Array` that is not a `Buffer`, or an `ArrayBuffer` */
  interface ByBytes {
    source: Uint8Array | ArrayBuffer
    filename?: string
  }
  /** `new InputFile(blob)` for a `Blob` or a `File` */
  interface ByBlob {
    source: Web.Blob
    filename?: string
  }
  /** `new InputFile(stream)` for a web stream */
  interface ByWebStream {
    source: Web.ReadableStream
    filename?: string
  }
  /** `new InputFile(iterable)` for an async iterable of bytes */
  interface ByAsyncIterable {
    source: AsyncIterable<Uint8Array | string>
    filename?: string
  }
  /** `new InputFile(response)` */
  interface ByResponse {
    source: Web.Response
    filename?: string
  }
  /**
   * `new InputFile(open)`. The function is passed the runtime's own `AbortSignal`, to pass
   * on to `fetch`, which aborts when the call ends.
   */
  interface ByFunction {
    source: (
      signal: AbortSignal
    ) => Contents | InputFile | Promise<Contents | InputFile>
    filename?: string
  }
}
/** An `InputFile`, or a file passed as a plain object, which is deprecated. */
export type InputFile =
  | InputFile.ByPath
  | InputFile.ByReadableStream
  | InputFile.ByBuffer
  | InputFile.ByURL
  | InputFile.ByBytes
  | InputFile.ByBlob
  | InputFile.ByWebStream
  | InputFile.ByAsyncIterable
  | InputFile.ByResponse
  | InputFile.ByFunction

export type Telegram = Typegram.ApiMethods<InputFile>

export type Opts<M extends keyof Telegram> = Typegram.Opts<InputFile>[M]
export type InputMedia = Typegram.InputMedia<InputFile>
export type InputMediaPhoto = Typegram.InputMediaPhoto<InputFile>
export type InputMediaVideo = Typegram.InputMediaVideo<InputFile>
export type InputMediaAnimation = Typegram.InputMediaAnimation<InputFile>
export type InputMediaAudio = Typegram.InputMediaAudio<InputFile>
export type InputMediaDocument = Typegram.InputMediaDocument<InputFile>

// tiny helper types
export type ChatAction = Opts<'sendChatAction'>['action']

/**
 * @deprecated The same as `InputFile`. What Telegram doesn't take as a video note is a URL
 * passed as a string; a file that Telegraf downloads from a URL is uploaded as any other.
 */
export type InputFileVideoNote = InputFile
