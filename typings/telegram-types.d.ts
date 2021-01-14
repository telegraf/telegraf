import * as TT from 'typegram'
export * from 'typegram'

export type ParseMode = 'Markdown' | 'MarkdownV2' | 'HTML'

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

export type ChatType =
  'private' |
  'group' |
  'supergroup' |
  'channel'

export type UpdateType =
  'callback_query' |
  'channel_post' |
  'chosen_inline_result' |
  'edited_channel_post' |
  'edited_message' |
  'inline_query' |
  'message' |
  'pre_checkout_query' |
  'shipping_query' |
  'poll' |
  'poll_answer'

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
  'passport_data' |
  'connected_website' |
  'animation'

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

export type MessageMedia =
  InputMediaPhoto |
  InputMediaVideo |
  InputMediaAnimation |
  InputMediaAudio |
  InputMediaDocument

export interface InputMediaPhoto {
  type: string
  media: InputFile
  caption?: string
  parse_mode?: string
}

export interface InputMediaVideo {
 type: string
 media: InputFile
 thumb?: string | InputFile
 caption?: string
 parse_mode?: string
 width?: number
 height?: number
 duration?: number
 supports_streaming?: boolean
}

export interface InputMediaAnimation {
 type: string
 media: InputFile
 thumb?: string | InputFile
 caption?: string
 parse_mode?: string
 width?: number
 height?: number
 duration?: number
 supports_streaming?: boolean
}

export interface InputMediaAudio {
 type: string
 media: InputFile
 thumb?: string | InputFile
 caption?: string
 parse_mode?: string
 performer?: string
 title?: string
 duration?: number
 supports_streaming?: boolean
}

export interface InputMediaDocument {
 type: string
 media: InputFile
 thumb?: string | InputFile
 caption?: string
 parse_mode?: string
}

export interface StickerData {
  png_sticker: string | Buffer
  emojis: string
  mask_position: TT.MaskPosition
}

type FileId = string

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
  filename: string
}

export type InputFile =
  FileId |
  InputFileByPath |
  InputFileByReadableStream |
  InputFileByBuffer |
  InputFileByURL

/**
 * Sending video notes by a URL is currently unsupported
 */
export type InputFileVideoNote = Exclude<InputFile, InputFileByURL>

export interface ChatPermissions {
  /** True, if the user is allowed to send text messages, contacts, locations and venues */
  can_send_messages?: boolean

  /** True, if the user is allowed to send audios, documents, photos, videos, video notes and voice notes, implies can_send_messages */
  can_send_media_messages?: boolean

  /** True, if the user is allowed to send polls, implies can_send_messages */
  can_send_polls?: boolean

  /** True, if the user is allowed to send animations, games, stickers and use inline bots, implies can_send_media_messages */
  can_send_other_messages?: boolean

  /** True, if the user is allowed to add web page previews to their messages, implies can_send_media_messages */
  can_add_web_page_previews?: boolean

  /** True, if the user is allowed to change the chat title, photo and other settings. Ignored in public supergroups */
  can_change_info?: boolean

  /** True, if the user is allowed to invite new users to the chat */
  can_invite_users?: boolean

  /** True, if the user is allowed to pin messages. Ignored in public supergroups */
  can_pin_messages?: boolean
}

export interface ExtraSetWebhook {
  /** SSL public certificate */
  certificate?:	InputFile

  /** The fixed IP address which will be used to send webhook requests instead of the IP address resolved through DNS */
  ip_address?: string

  /** Maximum allowed number of simultaneous HTTPS connections to the webhook for update delivery, 1-100. Defaults to 40. */
  max_connections?:	number

  /** List the types of updates you want your bot to receive */
  allowed_updates?:	UpdateType[]

  /** Pass True to drop all pending updates */
  drop_pending_updates?: boolean
}

export interface ExtraDeleteWebhook {
  /** Pass True to drop all pending updates */
  drop_pending_updates?: boolean
}

export interface ExtraRestrictChatMember {
  /** New user permissions */
  permissions: ChatPermissions

  /** Date when restrictions will be lifted for the user, unix time. If user is restricted for more than 366 days or less than 30 seconds from the current time, they are considered to be restricted forever */
  until_date?: number
}

export interface ExtraPromoteChatMember {
  /** Pass True, if the administrator can change chat title, photo and other settings */
  can_change_info?: boolean

  /** Pass True, if the administrator can create channel posts, channels only */
  can_post_messages?: boolean

  /** Pass True, if the administrator can edit messages of other users and can pin messages, channels only */
  can_edit_messages?: boolean

  /** Pass True, if the administrator can delete messages of other users */
  can_delete_messages?: boolean

  /** Pass True, if the administrator can invite new users to the chat */
  can_invite_users?: boolean

  /** Pass True, if the administrator can restrict, ban or unban chat members */
  can_restrict_members?: boolean

  /** Pass True, if the administrator can pin messages, supergroups only */
  can_pin_messages?: boolean

  /** Pass True, if the administrator can add new administrators with a subset of his own privileges or demote administrators that he has promoted, directly or indirectly (promoted by administrators that were appointed by him) */
  can_promote_members?: boolean
}

export interface ExtraReplyMessage {

  /**
   * Send Markdown or HTML, if you want Telegram apps to show bold, italic, fixed-width text or inline URLs in your bot's message.
   */
  parse_mode?: ParseMode

  /**
   * Disables link previews for links in this message
   */
  disable_web_page_preview?: boolean

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
  // no specified properties
}

export interface ExtraUnpinMessage {
  /**
   * Identifier of a message to unpin. If not specified, the most recent pinned message (by sending date) will be unpinned.
   */
  message_id?: number
}

export interface ExtraAudio extends ExtraReplyMessage {
  /**
   * Audio caption, 0-1024 characters
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

  /**
   * Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side.
   * The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail‘s width and height should not exceed 320.
   * Ignored if the file is not uploaded using multipart/form-data. Thumbnails can’t be reused and can be only uploaded as a new file,
   * so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>.
   */
  thumb?: InputFile

  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendaudio
   */
  disable_web_page_preview?: never
}

export interface ExtraDocument extends ExtraReplyMessage {
  /**
   * Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side.
   * The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail‘s width and height should not exceed 320.
   * Ignored if the file is not uploaded using multipart/form-data. Thumbnails can’t be reused and can be only uploaded as a new file,
   * so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>.
   */
  thumb?: InputFile

  /**
   * Document caption (may also be used when resending documents by file_id), 0-1024 characters
   */
  caption?: string

  /**
   * List of special entities that appear in the caption, which can be specified instead of parse_mode
   */
  caption_entities?: TT.MessageEntity

  /**
   * Disables automatic server-side content type detection for files uploaded using multipart/form-data
   */
  disable_content_type_detection?: Boolean

  /**
   * Pass True, if the message should be sent even if the specified replied-to message is not found
   */
  allow_sending_without_reply?: Boolean

  /**
   * Does not exist, see https://core.telegram.org/bots/api#senddocument
   */
  disable_web_page_preview?: never
}

export interface ExtraGame extends ExtraReplyMessage {
  /**
   * Inline keyboard. If empty, one ‘Play game_title’ button will be shown. If not empty, the first button must launch the game.
   */
  reply_markup?: TT.InlineKeyboardMarkup

  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendgame
   */
  disable_web_page_preview?: never

  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendgame
   */
  parse_mode?: never
}

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

export interface ExtraLocation extends ExtraReplyMessage {
  /**
   * The radius of uncertainty for the location, measured in meters; 0-1500
   */
  horizontal_accuracy?: number

  /**
   * Period in seconds for which the location will be updated (should be between 60 and 86400)
   */
  live_period?: number

  /**
   * For live locations, a direction in which the user is moving, in degrees. Must be between 1 and 360 if specified.
   */
  heading?: number

  /**
   * For live locations, a maximum distance for proximity alerts about approaching another chat member, in meters. Must be between 1 and 100000 if specified.
   */
  proximity_alert_radius?: number

  /**
   * Pass True, if the message should be sent even if the specified replied-to message is not found
   */
  allow_sending_without_reply?: boolean

  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendlocation
   */
  disable_web_page_preview?: never

  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendlocation
   */
  parse_mode?: never
}

export interface ExtraEditLocation extends ExtraLocation {
  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendlocation
   */
  live_period?: never
}

export interface ExtraPhoto extends ExtraReplyMessage {
  /**
   * Photo caption (may also be used when resending photos by file_id), 0-1024 characters
   */
  caption?: string

  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendphoto
   */
  disable_web_page_preview?: never
}

export interface ExtraMediaGroup extends ExtraReplyMessage {
  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendmediagroup
   */
  disable_web_page_preview?: never

  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendmediagroup
   */
  parse_mode?: never

  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendmediagroup
   */
  reply_markup?: never

  /**
   * Pass True, if the message should be sent even if the specified replied-to message is not found
   */
  allow_sending_without_reply?: Boolean
}

export interface ExtraAnimation extends ExtraReplyMessage {
  /**
   * Animation caption (may also be used when resending animation by file_id), 0-200 characters
   */
  caption?: string
}

export interface ExtraSticker extends ExtraReplyMessage {
  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendsticker
   */
  disable_web_page_preview?: never

  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendsticker
   */
  parse_mode?: never
}

export interface ExtraVideo extends ExtraReplyMessage {
  /**
   * Duration of sent video in seconds
   */
  duration?: number

  /**
   * Video width
   */
  width?: number

  /**
   * Video height
   */
  height?: number

  /**
   * Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side.
   * The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail‘s width and height should not exceed 320.
   * Ignored if the file is not uploaded using multipart/form-data. Thumbnails can’t be reused and can be only uploaded as a new file,
   * so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>.
   */
  thumb?: InputFile

  /**
   * Video caption (may also be used when resending videos by file_id), 0-1024 characters
   */
  caption?: string

  /**
   * Pass True, if the uploaded video is suitable for streaming
   */
  supports_streaming?: boolean

  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendvideo
   */
  disable_web_page_preview?: never
}

export interface ExtraVideoNote extends ExtraReplyMessage {
  /**
   * Duration of sent video in seconds
   */
  duration?: number

  /**
   * Video width and height, i.e. diameter of the video message
   */
  length?: number

  /**
   * Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side.
   * The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail‘s width and height should not exceed 320.
   * Ignored if the file is not uploaded using multipart/form-data. Thumbnails can’t be reused and can be only uploaded as a new file,
   * so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>.
   */
  thumb?: InputFile
}

export interface ExtraVoice extends ExtraReplyMessage {
  /**
   * Voice message caption, 0-1024 characters
   */
  caption?: string

  /**
   * Duration of the voice message in seconds
   */
  duration?: number

  /**
   * Does not exist, see https://core.telegram.org/bots/api#sendvoice
   */
  disable_web_page_preview?: never
}

export interface ExtraDice extends ExtraReplyMessage {
  /**
   * Emoji on which the dice throw animation is based.
   * Currently, must be one of “🎲”, “🎯”, “🏀”, “⚽”, or “🎰”.
   * Dice can have values 1-6 for “🎲” and “🎯”, values 1-5 for “🏀” and “⚽”, and values 1-64 for “🎰”.
   * Defaults to “🎲”
   * */
  emoji?: string

  /**
   * Does not exist, see https://core.telegram.org/bots/api#senddice
   */
  parse_mode?: never

  /**
   * Does not exist, see https://core.telegram.org/bots/api#senddice
   */
  disable_web_page_preview?: never
}

export interface ExtraPoll {
  /** True, if the poll needs to be anonymous, defaults to True */
  is_anonymous?: boolean

  /** True, if the poll allows multiple answers, ignored for polls in quiz mode, defaults to False */
  allows_multiple_answers?: boolean

  /** 0-based identifier of the correct answer option, required for polls in quiz mode */
  correct_option_id?: number

  /** Pass True, if the poll needs to be immediately closed. This can be useful for poll preview. */
  is_closed?: boolean

  /**	Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean

  /** If the message is a reply, ID of the original message */
  reply_to_message_id?: number

  /** Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | TT.InlineKeyboardMarkup
    | TT.ReplyKeyboardMarkup
    | TT.ReplyKeyboardRemove
    | TT.ForceReply
}

export interface ExtraStopPoll {
  /** A JSON-serialized object for a new message inline keyboard. */
  reply_markup?: TT.InlineKeyboardMarkup
}

export interface ExtraUnban {
  /** Do nothing if the user is not banned */
  only_if_banned?: Boolean
}

export type MessageAudio = TT.Message.AudioMessage
export type MessageDocument = TT.Message.DocumentMessage
export type MessageGame = TT.Message.GameMessage
export type MessageInvoice = TT.Message.InvoiceMessage
export type MessageLocation = TT.Message.LocationMessage
export type MessagePhoto = TT.Message.PhotoMessage
export type MessageAnimation = TT.Message.AnimationMessage
export type MessageSticker = TT.Message.StickerMessage
export type MessageVideo = TT.Message.VideoMessage
export type MessageVideoNote = TT.Message.VideoNoteMessage
export type MessageVoice = TT.Message.VoiceMessage
export type MessageDice = TT.Message.DiceMessage
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

/**
 * This object represents a bot command
 */
export interface BotCommand {
  /**
   * Text of the command, 1-32 characters. Can contain only lowercase English letters, digits and underscores.
   */
  command: string

  /**
   * Description of the command, 3-256 characters.
   */
  description: string
}

/**
 * This object represents a dice with random value from 1 to 6. (Yes, we're aware of the “proper” singular of die. But it's awkward, and we decided to help it change. One dice at a time!)
 */
export interface Dice {
  /**
   * Value of the dice, 1-6
   */
  value: number
}

export interface PollOption {
  /** Option text, 1-100 characters */
  text: string

  /** Number of users that voted for this option */
  voter_count: number
}

export interface PollAnswer {
  /** Unique poll identifier */
  poll_id: string

  /** The user, who changed the answer to the poll */
  user: TT.User

  /** 0-based identifiers of answer options, chosen by the user. May be empty if the user retracted their vote. */
  option_ids: number[]
}

export interface Poll {
  /** Unique poll identifier */
  id: string

  /** Poll question, 1-255 characters */
  question: string

  /** List of poll options */
  options: PollOption[]

  /** Total number of users that voted in the poll */
  total_voter_count: number

  /** True, if the poll is closed */
  is_closed: boolean

  /** True, if the poll is anonymous */
  is_anonymous: boolean

  /** Poll type, currently can be “regular” or “quiz” */
  type: 'regular' | 'quiz'

  /** True, if the poll allows multiple answers */
  allows_multiple_answers: boolean

  /** 0-based identifier of the correct answer option. Available only for polls in the quiz mode, which are closed, or was sent (not forwarded) by the bot or to the private chat with the bot. */
  correct_option_id?: number
}
