import { Typegram } from 'typegram'

// internal type provisions
export * from 'typegram/api'
export * from 'typegram/markup'
export * from 'typegram/menu-button'
export * from 'typegram/inline'
export * from 'typegram/manage'
export * from 'typegram/message'
export * from 'typegram/passport'
export * from 'typegram/payment'
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

// typegram proxy type setup
type TelegrafTypegram = Typegram<InputFile>

export type Telegram = TelegrafTypegram['Telegram']
export type Opts<M extends keyof Telegram> = TelegrafTypegram['Opts'][M]
export type InputMedia = TelegrafTypegram['InputMedia']
export type InputMediaPhoto = TelegrafTypegram['InputMediaPhoto']
export type InputMediaVideo = TelegrafTypegram['InputMediaVideo']
export type InputMediaAnimation = TelegrafTypegram['InputMediaAnimation']
export type InputMediaAudio = TelegrafTypegram['InputMediaAudio']
export type InputMediaDocument = TelegrafTypegram['InputMediaDocument']

// tiny helper types
export type ChatAction = Opts<'sendChatAction'>['action']

/**
 * Sending video notes by a URL is currently unsupported
 */
export type InputFileVideoNote = Exclude<InputFile, InputFileByURL>
