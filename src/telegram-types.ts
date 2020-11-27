/** @format */

import {
  Chat,
  InlineKeyboardMarkup,
  LabeledPrice,
  Message,
  Typegram,
} from 'typegram'
import { MessageSubTypesUnionMapped, UpdateTypesUnion } from './context'

export * from 'typegram/callback'
export * from 'typegram/inline'
export * from 'typegram/manage'
export * from 'typegram/message'
export * from 'typegram/passport'
export * from 'typegram/payment'
export * from 'typegram/update'

export interface InputFileByPath {
  source: string
}
export interface InputFileByReadableStream {
  source: NodeJS.ReadableStream
}
export interface InputFileByBuffer {
  source: Buffer
}
export interface InputFileByURL {
  url: string
  filename?: string
}
export type InputFile =
  | InputFileByPath
  | InputFileByReadableStream
  | InputFileByBuffer
  | InputFileByURL

type TelegrafTypegram = Typegram<InputFile>

export type Telegram = TelegrafTypegram['Telegram']
export type Opts<M extends keyof Telegram> = TelegrafTypegram['Opts'][M]
export type InputMedia = TelegrafTypegram['InputMedia']
export type InputMediaPhoto = TelegrafTypegram['InputMediaPhoto']
export type InputMediaVideo = TelegrafTypegram['InputMediaVideo']
export type InputMediaAnimation = TelegrafTypegram['InputMediaAnimation']
export type InputMediaAudio = TelegrafTypegram['InputMediaAudio']
export type InputMediaDocument = TelegrafTypegram['InputMediaDocument']

export type ChatAction = Opts<'sendChatAction'>['action']

export type ChatType = Chat['type']

export type UpdateType = UpdateTypesUnion
export type MessageSubType = MessageSubTypesUnionMapped

/**
 * Sending video notes by a URL is currently unsupported
 */
export type InputFileVideoNote = Exclude<InputFile, InputFileByURL>

/**
 * Create an `Extra*` type from the arguments of a given method `M extends keyof Telegram` but `Omit`ting fields with key `K` from it.
 *
 * Note that `chat_id` may not be specified in `K` because it is `Omit`ted by default.
 */
export type MakeExtra<
  M extends keyof Telegram,
  K extends keyof Omit<Opts<M>, 'chat_id'> = never
> = Omit<Opts<M>, 'chat_id' | K>

export type ExtraAddStickerToSet = MakeExtra<
  'addStickerToSet',
  'name' | 'user_id'
>
export type ExtraAnimation = MakeExtra<'sendAnimation', 'animation'>
export type ExtraAnswerInlineQuery = MakeExtra<
  'answerInlineQuery',
  'inline_query_id' | 'results'
>
export type ExtraAudio = MakeExtra<'sendAudio', 'audio'>
export type ExtraContact = MakeExtra<
  'sendContact',
  'phone_number' | 'first_name'
>
export type ExtraCopyMessage = MakeExtra<
  'copyMessage',
  'from_chat_id' | 'message_id'
>
export type ExtraCreateNewStickerSet = MakeExtra<
  'createNewStickerSet',
  'name' | 'title' | 'user_id'
>
export type ExtraDice = MakeExtra<'sendDice'>
export type ExtraDocument = MakeExtra<'sendDocument', 'document'>
export type ExtraEditMessageCaption = MakeExtra<
  'editMessageCaption',
  'message_id' | 'inline_message_id' | 'caption'
>
export type ExtraEditMessageLiveLocation = MakeExtra<
  'editMessageLiveLocation',
  'message_id' | 'inline_message_id' | 'latitude' | 'longitude'
>
export type ExtraEditMessageMedia = MakeExtra<
  'editMessageMedia',
  'message_id' | 'inline_message_id' | 'media'
>
export type ExtraEditMessageText = MakeExtra<
  'editMessageText',
  'message_id' | 'inline_message_id'
>
export type ExtraGame = MakeExtra<'sendGame', 'game_short_name'>
export interface ExtraInvoice extends ExtraReplyMessage {
  /**
   * Inline keyboard. If empty, one 'Pay total price' button will be shown. If not empty, the first button must be a Pay button.
   */
  reply_markup?: InlineKeyboardMarkup

  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendinvoice
   */
  disable_web_page_preview?: never

  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendinvoice
   */
  parse_mode?: never
}
export type ExtraLocation = MakeExtra<'sendLocation', 'latitude' | 'longitude'>
export type ExtraMediaGroup = MakeExtra<'sendMediaGroup', 'media'>
export type ExtraPhoto = MakeExtra<'sendPhoto', 'photo'>
export type ExtraPoll = MakeExtra<'sendPoll', 'question' | 'options' | 'type'>
export type ExtraPromoteChatMember = MakeExtra<'promoteChatMember', 'user_id'>
export type ExtraReplyMessage = MakeExtra<'sendMessage', 'text'>
export type ExtraRestrictChatMember = MakeExtra<'restrictChatMember', 'user_id'>
export type ExtraSetWebhook = MakeExtra<'setWebhook', 'url'>
export type ExtraSticker = MakeExtra<'sendSticker', 'sticker'>
export type ExtraStopPoll = MakeExtra<'stopPoll', 'message_id'>
export type ExtraVenue = MakeExtra<
  'sendVenue',
  'latitude' | 'longitude' | 'title' | 'address'
>
export type ExtraVideo = MakeExtra<'sendVideo', 'video'>
export type ExtraVideoNote = MakeExtra<'sendVideoNote', 'video_note'>
export type ExtraVoice = MakeExtra<'sendVoice', 'voice'>

export type IncomingMessage = Message

/** @deprecated */
export interface NewInvoiceParameters {
  /**
   * Product name, 1-32 characters
   */
  title: string

  /**
   * Product description, 1-255 characters
   */
  description: string

  /**
   * Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use for your internal processes.
   */
  payload: string

  /**
   * Payments provider token, obtained via Botfather
   */
  provider_token: string

  /**
   * Unique deep-linking parameter that can be used to generate this invoice when used as a start parameter
   */
  start_parameter: string

  /**
   * Three-letter ISO 4217 currency code, see more on currencies
   */
  currency: string

  /**
   * Price breakdown, a list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.)
   */
  prices: LabeledPrice[]

  /**
   * URL of the product photo for the invoice. Can be a photo of the goods or a marketing image for a service. People like it better when they see what they are paying for.
   */
  photo_url?: string

  /**
   * Photo size
   */
  photo_size?: number

  /**
   * Photo width
   */
  photo_width?: number

  /**
   * Photo height
   */
  photo_height?: number

  /**
   * Pass True, if you require the user's full name to complete the order
   */
  need_name?: boolean

  /**
   * Pass True, if you require the user's phone number to complete the order
   */
  need_phone_number?: boolean

  /**
   * Pass True, if you require the user's email to complete the order
   */
  need_email?: boolean

  /**
   * Pass True, if you require the user's shipping address to complete the order
   */
  need_shipping_address?: boolean

  /**
   * Pass True, if the final price depends on the shipping method
   */
  is_flexible?: boolean
}
