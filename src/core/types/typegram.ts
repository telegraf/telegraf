import * as Typegram from 'typegram'

// internal type provisions
export * from 'typegram/api'
export * from 'typegram/inline'
export * from 'typegram/manage'
export * from 'typegram/markup'
export * from 'typegram/message'
export * from 'typegram/methods'
export * from 'typegram/passport'
export * from 'typegram/payment'
export * from 'typegram/settings'
export * from 'typegram/update'

// telegraf input file definition
interface InputFileByPath {
  source: string
  filename?: string
}
interface InputFileByReadableStream {
  source: NodeJS.ReadableStream
  filename?: string
}
interface InputFileByBuffer {
  source: Buffer
  filename?: string
}
interface InputFileByURL {
  url: string
  filename?: string
}
export type InputFile =
  | InputFileByPath
  | InputFileByReadableStream
  | InputFileByBuffer
  | InputFileByURL

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
export type InputFileVideoNote = Exclude<InputFile, InputFileByURL>
