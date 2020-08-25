/** @format */

import * as TT from 'typegram'
export * from 'typegram'

export type ChatAction = TT.Opts<'sendChatAction'>['action']

export type ChatType = TT.Chat['type']

export type UpdateType =
  | 'callback_query'
  | 'channel_post'
  | 'chosen_inline_result'
  | 'edited_channel_post'
  | 'edited_message'
  | 'inline_query'
  | 'message'
  | 'pre_checkout_query'
  | 'shipping_query'
  | 'poll'
  | 'poll_answer'

export type MessageSubTypes =
  | 'voice'
  | 'video_note'
  | 'video'
  | 'venue'
  | 'text'
  | 'supergroup_chat_created'
  | 'successful_payment'
  | 'sticker'
  | 'pinned_message'
  | 'photo'
  | 'new_chat_title'
  | 'new_chat_photo'
  | 'new_chat_members'
  | 'migrate_to_chat_id'
  | 'migrate_from_chat_id'
  | 'location'
  | 'left_chat_member'
  | 'invoice'
  | 'group_chat_created'
  | 'game'
  | 'document'
  | 'delete_chat_photo'
  | 'contact'
  | 'channel_chat_created'
  | 'audio'
  | 'passport_data'
  | 'connected_website'
  | 'animation'

/** @deprecated use `InputMedia` */
export type MessageMedia = TT.InputMedia

export interface StickerData {
  png_sticker: string | Buffer
  emojis: string
  mask_position: TT.MaskPosition
}

export type DiceEmoji = '🎲' | '🎯' | '🏀'

/**
 * Sending video notes by a URL is currently unsupported
 */
export type InputFileVideoNote = Exclude<TT.InputFile, TT.InputFileByURL>

type MakeExtra<
  M extends keyof TT.Telegram, // method name
  P extends keyof Omit<TT.Opts<M>, 'chat_id'> // fields to skip
> = Omit<TT.Opts<M>, 'chat_id' | P>

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
export type ExtraDice = MakeExtra<'sendDice', never>
export type ExtraDocument = MakeExtra<'sendDocument', 'document'>
export type ExtraEditMessage = ExtraReplyMessage
export type ExtraGame = MakeExtra<'sendGame', 'game_short_name'>
export interface ExtraInvoice extends ExtraReplyMessage {
  /**
   * Inline keyboard. If empty, one 'Pay total price' button will be shown. If not empty, the first button must be a Pay button.
   */
  reply_markup?: TT.InlineKeyboardMarkup

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
export type ExtraSticker = MakeExtra<'sendSticker', 'sticker'>
export type ExtraStopPoll = MakeExtra<'stopPoll', 'message_id'>
export type ExtraVenue = MakeExtra<
  'sendVenue',
  'latitude' | 'longitude' | 'title' | 'address'
>
export type ExtraVideo = MakeExtra<'sendVideo', 'video'>
export type ExtraVideoNote = MakeExtra<'sendVideoNote', 'video_note'>
export type ExtraVoice = MakeExtra<'sendVoice', 'voice'>

export type IncomingMessage = TT.Message

/** @deprecated use `Message.AudioMessage` */
export type MessageAudio = TT.Message.AudioMessage
/** @deprecated use `Message.DocumentMessage` */
export type MessageDocument = TT.Message.DocumentMessage
/** @deprecated use `Message.GameMessage` */
export type MessageGame = TT.Message.GameMessage
/** @deprecated use `Message.InvoiceMessage` */
export type MessageInvoice = TT.Message.InvoiceMessage
/** @deprecated use `Message.LocationMessage` */
export type MessageLocation = TT.Message.LocationMessage
/** @deprecated use `Message.PhotoMessage` */
export type MessagePhoto = TT.Message.PhotoMessage
/** @deprecated use `Message.AnimationMessage` */
export type MessageAnimation = TT.Message.AnimationMessage
/** @deprecated use `Message.StickerMessage` */
export type MessageSticker = TT.Message.StickerMessage
/** @deprecated use `Message.VideoMessage` */
export type MessageVideo = TT.Message.VideoMessage
/** @deprecated use `Message.VideoNoteMessage` */
export type MessageVideoNote = TT.Message.VideoNoteMessage
/** @deprecated use `Message.VoiceMessage` */
export type MessageVoice = TT.Message.VoiceMessage
/** @deprecated use `Message.DiceMessage` */
export type MessageDice = TT.Message.DiceMessage
/** @deprecated use `Message.PollMessage` */
export type MessagePoll = TT.Message.PollMessage

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
  prices: TT.LabeledPrice[]

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
  need_name?: true

  /**
   * Pass True, if you require the user's phone number to complete the order
   */
  need_phone_number?: true

  /**
   * Pass True, if you require the user's email to complete the order
   */
  need_email?: true

  /**
   * Pass True, if you require the user's shipping address to complete the order
   */
  need_shipping_address?: true

  /**
   * Pass True, if the final price depends on the shipping method
   */
  is_flexible?: true
}
