import * as Typegram from '@telegraf/types'
import type { WebReadableStream } from '../network/fetch-client'

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

type ByteStream = AsyncIterable<Uint8Array | string> | WebReadableStream
/** A stream, or a fetch `Response`, whose `body` is one. */
type LazyStream = ByteStream | { readonly body: ByteStream | null }
// telegraf input file definition
export declare namespace InputFile {
  interface ByPath {
    source: string
    filename?: string
  }
  interface ByReadableStream {
    source: NodeJS.ReadableStream
    filename?: string
  }
  interface ByBuffer {
    source: Buffer
    filename?: string
  }
  interface ByURL {
    url: string
    filename?: string
  }
  interface ByLazyStream {
    source: () => LazyStream | Promise<LazyStream>
    filename?: string
  }
}
export type InputFile =
  | InputFile.ByPath
  | InputFile.ByReadableStream
  | InputFile.ByBuffer
  | InputFile.ByURL
  | InputFile.ByLazyStream

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
