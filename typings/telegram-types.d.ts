import * as TT from "telegram-typings";
export * from "telegram-typings";

export type ParseMode = 'Markdown' | 'HTML'

export type ChatAction =
'typing' |
'upload_photo' |
'record_video' |
'upload_video' |
'record_audio' |
'upload_audio' |
'upload_document' |
'find_location' |
'record_video_note' |
'upload_video_note'

export type UpdateType =
'callback_query' |
'channel_post' |
'chosen_inline_result' |
'edited_channel_post' |
'edited_message' |
'inline_query' |
'message' |
'pre_checkout_query' |
'shipping_query'

export type MessageSubTypes =
  'voice' |
  'video_note' |
  'video' |
  'venue' |
  'text' |
  'supergroup_chat_created' |
  'successful_payment' |
  'sticker' |
  'pinned_message' |
  'photo' |
  'new_chat_title' |
  'new_chat_photo' |
  'new_chat_members' |
  'migrate_to_chat_id' |
  'migrate_from_chat_id' |
  'location' |
  'left_chat_member' |
  'invoice' |
  'group_chat_created' |
  'game' |
  'document' |
  'delete_chat_photo' |
  'contact' |
  'channel_chat_created' |
  'audio' |
  'connected_website'

export type InlineQueryResult =
TT.InlineQueryResultCachedAudio |
TT.InlineQueryResultCachedDocument |
TT.InlineQueryResultCachedGif |
TT.InlineQueryResultCachedMpeg4Gif |
TT.InlineQueryResultCachedPhoto |
TT.InlineQueryResultCachedSticker |
TT.InlineQueryResultCachedVideo |
TT.InlineQueryResultCachedVoice |
TT.InlineQueryResultArticle |
TT.InlineQueryResultAudio |
TT.InlineQueryResultContact |
TT.InlineQueryResultGame |
TT.InlineQueryResultDocument |
TT.InlineQueryResultGif |
TT.InlineQueryResultLocation |
TT.InlineQueryResultMpeg4Gif |
TT.InlineQueryResultPhoto |
TT.InlineQueryResultVenue |
TT.InlineQueryResultVideo |
TT.InlineQueryResultVoice

export interface StickerData {
  png_sticker: string | Buffer
  emojis: string
  mask_position: TT.MaskPosition
}

export interface ExtraReplyMessage {
  /**
   * Sends the message silently. Users will receive a notification with no sound.
   */
  disable_notification?: boolean

  /**
   * If the message is a reply, ID of the original message
   */
  reply_to_message_id?: number

  /**
   * Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user.
   */
  reply_markup?: TT.InlineKeyboardMarkup | TT.ReplyKeyboardMarkup | TT.ReplyKeyboardRemove | TT.ForceReply
}

type FileId = string

interface InputFileByPath {
  source: string
}

interface InputFileByReadableStream {
  source: NodeJS.ReadableStream
}

interface InputFileByBuffer {
  source: Buffer
}

interface InputFileByURL {
  url: string
  filename: string
}

export type InputFile =
  FileId |
  InputFileByPath |
  InputFileByReadableStream |
  InputFileByBuffer |
  InputFileByURL

  export interface ExtraReplyMessage {

    /**
     * Sends the message silently. Users will receive a notification with no sound.
     */
    disable_notification?: boolean

    /**
     * If the message is a reply, ID of the original message
     */
    reply_to_message_id?: number

    /**
     * Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user.
     */
    reply_markup?: TT.InlineKeyboardMarkup | TT.ReplyKeyboardMarkup | TT.ReplyKeyboardRemove | TT.ForceReply
  }

  export interface ExtraEditMessage extends ExtraReplyMessage {
    /**
     * Send Markdown or HTML, if you want Telegram apps to show bold, italic, fixed-width text or inline URLs in your bot's message.
     */
    parse_mode?: ParseMode

    /**
     * Disables link previews for links in this message
     */
    disable_web_page_preview?: boolean

  }

  export interface ExtraAudio extends ExtraReplyMessage {
    /**
     * Audio caption, 0-200 characters
     */
    caption?: string

    /**
     * Duration of the audio in seconds
     */
    duration?: number

    /**
     * Performer
     */
    performer?: string

    /**
     * Track name
     */
    title?: string
  }

  export interface ExtraDocument extends ExtraReplyMessage {
    /**
     * Document caption (may also be used when resending documents by file_id), 0-200 characters
     */
    caption?: string
  }

  export interface ExtraGame extends ExtraReplyMessage {
    // no specified game props
    // https://core.telegram.org/bots/api#sendgame
  }

  export interface ExtraInvoice extends ExtraReplyMessage {
    // no specified invoice props
    // https://core.telegram.org/bots/api#sendinvoice
  }

  export interface ExtraLocation extends ExtraReplyMessage {
    // no specified location props
    // https://core.telegram.org/bots/api#sendlocation
  }

  export interface ExtraPhoto extends ExtraReplyMessage {
    /**
     * Photo caption (may also be used when resending photos by file_id), 0-200 characters
     */
    caption?: string
  }

  export interface ExtraSticker extends ExtraReplyMessage {
    // no specified sticker props
    // https://core.telegram.org/bots/api#sendsticker
  }

  export interface ExtraVideo extends ExtraReplyMessage {
    // no specified video props
    // https://core.telegram.org/bots/api#sendvideo
  }

  export interface IncomingMessage extends TT.Message {
    audio?: TT.Audio
    entities?: TT.MessageEntity[]
    caption?: string
    document?: TT.Document
    game?: TT.Game
    photo?: TT.PhotoSize[]
    sticker?: TT.Sticker
    video?: TT.Video
    video_note?: TT.VideoNote
    contact?: TT.Contact
    location?: TT.Location
    venue?: TT.Venue
    pinned_message?: TT.Message
    invoice?: TT.Invoice
    successful_payment?: TT.SuccessfulPayment
  }

  export interface MessageAudio extends TT.Message {
    audio: TT.Audio
  }

  export interface MessageDocument extends TT.Message {
    document: TT.Document
  }

  export interface MessageGame extends TT.Message {
    game: TT.Game
  }

  export interface MessageInvoice extends TT.Message {
    invoice: TT.Invoice
  }

  export interface MessageLocation extends TT.Message {
    location: TT.Location
  }

  export interface MessagePhoto extends TT.Message {
    photo: TT.PhotoSize[]
  }

  export interface MessageSticker extends TT.Message {
    sticker: TT.Sticker
  }

  export interface MessageVideo extends TT.Message {
    video: TT.Video
  }

  export interface NewInvoiceParams {
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

  export interface ExtraAnswerInlineQuery {
    /**
     * The maximum amount of time in seconds that the result of the inline query may be cached on the server. Defaults to 300.
     */
    cache_time?: number

    /**
     * Pass True, if results may be cached on the server side only for the user that sent the query. By default, results may be returned to any user who sends the same query
     */
    is_personal?: boolean

    /**
     * Pass the offset that a client should send in the next query with the same text to receive more results. Pass an empty string if there are no more results or if you don‘t support pagination. Offset length can’t exceed 64 bytes.
     */
    next_offset?: string

    /**
     * If passed, clients will display a button with specified text that switches the user to a private chat with the bot and sends the bot a start message with the parameter switch_pm_parameter
     */
    switch_pm_text?: string

    /**
     * Deep-linking parameter for the /start message sent to the bot when user presses the switch button. 1-64 characters, only A-Z, a-z, 0-9, _ and - are allowed.
     */
    switch_pm_parameter?: string
  }
