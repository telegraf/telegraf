import * as Typegram from '@telegraf/types'
import type { InputFile as InputFileClass } from '../../input-file'
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
export declare namespace InputFile {
  /** The contents of a file that `new InputFile()` accepts. */
  type Contents =
    | string
    | Web.URL
    | Uint8Array
    | ArrayBuffer
    | Web.Blob
    | ByteStream
    | Web.Response
  /**
   * The `source` that `new InputFile()` accepts. A function is passed the runtime's own
   * `AbortSignal`, to pass on to `fetch`, which aborts when the call ends.
   */
  type Source =
    | Contents
    | ((
        signal: AbortSignal
      ) => Contents | InputFileClass | Promise<Contents | InputFileClass>)
  /** @deprecated Use `new InputFile(path)`. */
  interface ByPath {
    source: string
    filename?: string
  }
  /** @deprecated Use `new InputFile(stream)`. */
  interface ByReadableStream {
    source: NodeJS.ReadableStream
    filename?: string
  }
  /** @deprecated Use `new InputFile(buffer)`. */
  interface ByBuffer {
    source: Buffer
    filename?: string
  }
  /** @deprecated Use `new InputFile(new URL(url))`. */
  interface ByURL {
    url: string
    filename?: string
  }
}
/** An `InputFile`, or a file passed as a plain object, which is deprecated. */
export type InputFile =
  | InputFileClass
  | InputFile.ByPath
  | InputFile.ByReadableStream
  | InputFile.ByBuffer
  | InputFile.ByURL

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
 * Sending video notes by a URL is currently unsupported
 */
export type InputFileVideoNote = Exclude<InputFile, InputFile.ByURL>
