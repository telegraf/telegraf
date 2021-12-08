import * as TT from 'typegram'

export * from 'typegram'

export type ParseMode = 'Markdown' | 'MarkdownV2' | 'HTML'

export type ChatAction =
  'typing' |
  'choose_sticker' |
  'upload_photo' |
  'record_video' |
  'upload_video' |
  'record_voice' |
  'upload_voice' |
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
  'poll_answer' |
  'my_chat_member' |
  'chat_member'

export type MessageSubTypes =
  'voice' |
  'video_note' |
  'video' |
  'animation' |
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
  'dice' |
  'document' |
  'delete_chat_photo' |
  'contact' |
  'channel_chat_created' |
  'audio' |
  'connected_website' |
  'passport_data' |
  'poll' |
  'forward' |
  'message_auto_delete_timer_changed' |
  'voice_chat_started' |
  'voice_chat_ended' |
  'voice_chat_participants_invited' |
  'voice_chat_scheduled'

export type InputMediaTypes =
  'photo'
  | 'video'
  | 'animation'
  | 'audio'
  | 'document'

export type ChatMemberStatus =
  'creator'
  | 'administrator'
  | 'member'
  | 'restricted'
  | 'left'
  | 'kicked'

export type MessageEntityType =
  'mention'
  | 'hashtag'
  | 'cashtag'
  | 'bot_command'
  | 'url'
  | 'email'
  | 'phone_number'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'text_link'
  | 'text_mention'
  | 'pre'

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

export interface InputMediaPhoto extends ExtraCaption {
  type: InputMediaTypes
  media: InputFile
}

export interface InputMediaVideo extends ExtraCaption {
  type: InputMediaTypes
  media: InputFile
  thumb?: string | InputFile
  width?: number
  height?: number
  duration?: number
  supports_streaming?: boolean
}

export interface InputMediaAnimation extends ExtraCaption {
  type: InputMediaTypes
  media: InputFile
  thumb?: string | InputFile
  width?: number
  height?: number
  duration?: number
  supports_streaming?: boolean
}

export interface InputMediaAudio extends ExtraCaption {
  type: InputMediaTypes
  media: InputFile
  thumb?: string | InputFile
  performer?: string
  title?: string
  duration?: number
  supports_streaming?: boolean
}

export interface InputMediaDocument extends ExtraCaption {
  type: InputMediaTypes
  media: InputFile
  thumb?: string | InputFile
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
  certificate?: InputFile

  /** The fixed IP address which will be used to send webhook requests instead of the IP address resolved through DNS */
  ip_address?: string

  /** Maximum allowed number of simultaneous HTTPS connections to the webhook for update delivery, 1-100. Defaults to 40. */
  max_connections?: number

  /** List the types of updates you want your bot to receive */
  allowed_updates?: UpdateType[]

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

  /** Pass True, if the administrator can manage voice chats */
  can_manage_voice_chats?: boolean,

  /** Pass True, if the administrator can invite new users to the chat */
  can_invite_users?: boolean

  /** Pass True, if the administrator can restrict, ban or unban chat members */
  can_restrict_members?: boolean

  /** Pass True, if the administrator can pin messages, supergroups only */
  can_pin_messages?: boolean

  /** Pass True, if the administrator can add new administrators with a subset of his own privileges or demote administrators that he has promoted, directly or indirectly (promoted by administrators that were appointed by him) */
  can_promote_members?: boolean
}

export type ReplyMarkupBundle = TT.ReplyKeyboardMarkup | TT.ReplyKeyboardRemove | TT.ForceReply

export type KeyboardMarkupBundle = TT.InlineKeyboardMarkup | ReplyMarkupBundle

export interface ExtraReplyMarkup {
  /**
   * Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user.
   */
  reply_markup?: TT.InlineKeyboardMarkup | ReplyMarkupBundle
}

export interface ExtraReply<T extends KeyboardMarkupBundle> {
  reply_markup?: T
}

export interface ExtraReplyMarkupInlineKeyboard {
  /** A JSON-serialized object for a new message inline keyboard. */
  reply_markup?: TT.InlineKeyboardMarkup
}

export interface ExtraFormatting {
  /**
   * Mode for parsing entities in the message text. See formatting options for more details.
   */
  parse_mode?: ParseMode

  /**
   * List of special entities that appear in message text, which can be specified instead of parse_mode
   */
  entities?: TT.MessageEntity[]
}

export interface ExtraCaptionFormatting {
  /**
   * Mode for parsing entities in the photo caption. See formatting options for more details.
   */
  parse_mode?: ParseMode

  /**
   * List of special entities that appear in message text, which can be specified instead of parse_mode
   */
  caption_entities?: TT.MessageEntity[]
}

export interface ExtraCaption extends ExtraCaptionFormatting {
  /**
   * Media caption, 0-1024 characters
   */
  caption?: string
}

export interface ExtraDisableWebPagePreview {
  /**
   * Disables link previews for links in this message
   */
  disable_web_page_preview?: boolean
}

export interface ExtraDisableNotifications {
  /**
   * Sends the message silently. Users will receive a notification with no sound.
   */
  disable_notification?: boolean
}

export interface ExtraReplyMessage {
  /**
   * If the message is a reply, ID of the original message
   */
  reply_to_message_id?: number

  /**
   * Pass True, if the message should be sent even if the specified replied-to message is not found
   */
  allow_sending_without_reply?: boolean
}

export interface ExtraSendMessage extends ExtraFormatting, ExtraDisableWebPagePreview, ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {}

export interface ExtraEditMessage extends ExtraFormatting, ExtraDisableWebPagePreview, ExtraReplyMarkupInlineKeyboard {}

export interface ExtraEditMessageMedia extends ExtraReplyMarkupInlineKeyboard {}

export interface ExtraUnpinMessage {
  /**
   * Identifier of a message to unpin. If not specified, the most recent pinned message (by sending date) will be unpinned.
   */
  message_id?: number
}

export interface ExtraAudio extends ExtraCaption, ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {

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
}

export interface ExtraDocument extends ExtraCaption, ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {
  /**
   * Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side.
   * The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail‘s width and height should not exceed 320.
   * Ignored if the file is not uploaded using multipart/form-data. Thumbnails can’t be reused and can be only uploaded as a new file,
   * so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>.
   */
  thumb?: InputFile

  /**
   * Disables automatic server-side content type detection for files uploaded using multipart/form-data
   */
  disable_content_type_detection?: Boolean
}

export interface ExtraGame extends ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkupInlineKeyboard {}

export interface ExtraInvoice extends ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkupInlineKeyboard {}

export interface ExtraLocation extends ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {
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
}

export interface ExtraEditLocation extends ExtraReplyMarkupInlineKeyboard {
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
}

export interface ExtraStopLiveLocation extends ExtraReplyMarkupInlineKeyboard {}

export interface ExtraVenue extends ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {
  /**
   * Foursquare identifier of the venue
   */
  foursquare_id?: string

  /**
   * Foursquare type of the venue, if known. (For example, “arts_entertainment/default”, “arts_entertainment/aquarium” or “food/icecream”.)
   */
  foursquare_type?: string

  /**
   * Google Places identifier of the venue
   */
  google_place_id?: string

  /**
   * Google Places type of the venue. (See [supported types](https://developers.google.com/places/web-service/supported_types).)
   */
  google_place_type?: string
}

export interface ExtraContact extends ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {
  /**
   * Contact's last name
   */
  last_name?: string

  /**
   * Additional data about the contact in the form of a [vCard](https://en.wikipedia.org/wiki/VCard), 0-2048 bytes
   */
  vcard?: string
}

export interface ExtraPhoto extends ExtraCaption, ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {}

export interface ExtraMediaGroup extends ExtraDisableNotifications, ExtraReplyMessage {}

export interface ExtraAnimation extends ExtraCaption, ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {}

export interface ExtraSticker extends ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {}

export interface ExtraVideo extends ExtraCaption, ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {
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
   * Pass True, if the uploaded video is suitable for streaming
   */
  supports_streaming?: boolean
}

export interface ExtraVideoNote extends ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {
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

export interface ExtraVoice extends ExtraCaption, ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {
  /**
   * Duration of the voice message in seconds
   */
  duration?: number
}

export interface ExtraDice extends ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {
  /**
   * Emoji on which the dice throw animation is based.
   * Currently, must be one of “🎲”, “🎯”, “🏀”, “⚽”, or “🎰”.
   * Dice can have values 1-6 for “🎲” and “🎯”, values 1-5 for “🏀” and “⚽”, and values 1-64 for “🎰”.
   * Defaults to “🎲”
   * */
  emoji?: string
}

export interface ExtraPoll extends ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {
  /** True, if the poll needs to be anonymous, defaults to True */
  is_anonymous?: boolean

  /** True, if the poll allows multiple answers, ignored for polls in quiz mode, defaults to False */
  allows_multiple_answers?: boolean

  /** Pass True, if the poll needs to be immediately closed. This can be useful for poll preview. */
  is_closed?: boolean

  /** Amount of time in seconds the poll will be active after creation, 5-600. Can't be used together with close_date. */
  open_period?: number

  /** Point in time (Unix timestamp) when the poll will be automatically closed. Must be at least 5 and no more than 600 seconds in the future. Can't be used together with open_period. */
  close_date?: number
}

export interface ExtraQuiz extends ExtraPoll {
  /** 0-based identifier of the correct answer option, required for polls in quiz mode */
  correct_option_id: number

  /** Text that is shown when a user chooses an incorrect answer or taps on the lamp icon in a quiz-style poll, 0-200 characters with at most 2 line feeds after entities parsing */
  explanation?: string

  /** List of special entities that appear in the poll explanation, which can be specified instead of parse_mode */
  explanation_entities?: TT.MessageEntity[]

  /** Mode for parsing entities in the explanation. See formatting options for more details. */
  explanation_parse_mode?: ParseMode
}

export interface ExtraStopPoll extends ExtraReplyMarkupInlineKeyboard {}

export interface ExtraEditCaption extends ExtraCaptionFormatting, ExtraReplyMarkupInlineKeyboard {}

export interface ExtraAnswerCallbackQuery {
  /**
   * URL that will be opened by the user's client.
   * If you have created a Game and accepted the conditions via @Botfather, specify the URL that opens your game — note that this will only work if the query comes from a `callback_game` button.
   *
   * Otherwise, you may use links like t.me/your_bot?start=XXXX that open your bot with a parameter.
   */
  url?: string

  /**
   * The maximum amount of time in seconds that the result of the callback query may be cached client-side.
   * Telegram apps will support caching starting in version 3.14. Defaults to 0.
   */
  cache_time?: number
}

export interface ExtraCopyMessage extends ExtraCaption, ExtraDisableNotifications, ExtraReplyMessage, ExtraReplyMarkup {}

export type Extra = ExtraSendMessage
  | ExtraEditMessage
  | ExtraEditMessageMedia
  | ExtraUnpinMessage
  | ExtraAudio
  | ExtraDocument
  | ExtraGame
  | ExtraInvoice
  | ExtraLocation
  | ExtraEditLocation
  | ExtraStopLiveLocation
  | ExtraVenue
  | ExtraContact
  | ExtraPhoto
  | ExtraMediaGroup
  | ExtraAnimation
  | ExtraSticker
  | ExtraVideo
  | ExtraVideoNote
  | ExtraVoice
  | ExtraDice
  | ExtraPoll
  | ExtraQuiz
  | ExtraStopPoll
  | ExtraEditCaption
  | ExtraAnswerCallbackQuery
  | ExtraCopyMessage

export interface ExtraUnban {
  /** 
   * Do nothing if the user is not banned 
   */
  only_if_banned?: Boolean
}

export interface ExtraBan {
  /**
   * Date when the user will be unbanned, unix time. 
   * If user is banned for more than 366 days or less than 30 seconds from the current time they are considered to be banned forever.
   * Applied for supergroups and channels only.
   */
   until_date?: number,

   /**
    * Pass True to delete all messages from the chat for the user that is being removed.
    * If False, the user will be able to see messages in the group that were sent before the user was removed.
    * Always True for supergroups and channels.
    */
    revoke_messages: boolean
}

interface ExtraChatIviteLink {
  /**
   * Invite link name; 0-32 characters
   */
  name?: string

  /** 
   * Point in time (Unix timestamp) when the link will expire 
   */
  expire_date?: number,

  /** 
   * Maximum number of users that can be members of the chat simultaneously after joining the chat via this invite link; 1-99999
   */
  member_limit?: number
  
  /**
   * True, if users joining the chat via the link need to be approved by chat administrators. If True, member_limit can't be specified
   */
  creates_join_request?: boolean
}


export interface ExtraCreateChatIviteLink extends ExtraChatIviteLink {}

export interface ExtraEditChatIviteLink extends ExtraChatIviteLink {}

export type MessageAudio = TT.Message.AudioMessage
export type MessageContact = TT.Message.ContactMessage
export type MessageDocument = TT.Message.DocumentMessage
export type MessageGame = TT.Message.GameMessage
export type MessageInvoice = TT.Message.InvoiceMessage
export type MessageLocation = TT.Message.LocationMessage
export type MessageVenue = TT.Message.VenueMessage
export type MessagePhoto = TT.Message.PhotoMessage
export type MessageAnimation = TT.Message.AnimationMessage
export type MessageSticker = TT.Message.StickerMessage
export type MessageVideo = TT.Message.VideoMessage
export type MessageVideoNote = TT.Message.VideoNoteMessage
export type MessageVoice = TT.Message.VoiceMessage
export type MessageDice = TT.Message.DiceMessage
export type MessagePoll = TT.Message.PollMessage

type ServiceMessageBundle = TT.Message.ChannelChatCreatedMessage
  & TT.Message.ConnectedWebsiteMessage
  & TT.Message.DeleteChatPhotoMessage
  & TT.Message.GroupChatCreatedMessage
  & TT.Message.InvoiceMessage
  & TT.Message.LeftChatMemberMessage
  & TT.Message.MigrateFromChatIdMessage
  & TT.Message.MigrateToChatIdMessage
  & TT.Message.NewChatMembersMessage
  & TT.Message.NewChatPhotoMessage
  & TT.Message.NewChatTitleMessage
  & TT.Message.PassportDataMessage
  & TT.Message.ProximityAlertTriggeredMessage
  & TT.Message.PinnedMessageMessage
  & TT.Message.SuccessfulPaymentMessage
  & TT.Message.SupergroupChatCreated
  & TT.Message.MessageAutoDeleteTimerChangedMessage
  & TT.Message.VoiceChatStartedMessage
  & TT.Message.VoiceChatEndedMessage
  & TT.Message.VoiceChatEndedMessage
  & TT.Message.VoiceChatScheduledMessage

type CommonMessageBundle = TT.Message.AnimationMessage
  & TT.Message.AudioMessage
  & TT.Message.ContactMessage
  & TT.Message.DiceMessage
  & TT.Message.DocumentMessage
  & TT.Message.GameMessage
  & TT.Message.LocationMessage
  & TT.Message.PhotoMessage
  & TT.Message.PollMessage
  & TT.Message.StickerMessage
  & TT.Message.TextMessage
  & TT.Message.VenueMessage
  & TT.Message.VideoMessage
  & TT.Message.VideoNoteMessage
  & TT.Message.VoiceMessage

export type Message = ServiceMessageBundle & CommonMessageBundle

export type Update = TT.Update.CallbackQueryUpdate
  & TT.Update.ChannelPostUpdate
  & TT.Update.ChosenInlineResultUpdate
  & TT.Update.EditedChannelPostUpdate
  & TT.Update.EditedMessageUpdate
  & TT.Update.InlineQueryUpdate
  & TT.Update.MessageUpdate
  & TT.Update.PreCheckoutQueryUpdate
  & TT.Update.PollAnswerUpdate
  & TT.Update.PollUpdate
  & TT.Update.ShippingQueryUpdate
  & TT.Update.MyChatMemberUpdate
  & TT.Update.ChatMemberUpdate

export interface CallbackQuery extends TT.CallbackQuery.DataCallbackQuery, TT.CallbackQuery.GameShortGameCallbackQuery {
  message: Message
}

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
   * Unique deep-linking parameter.
   * If left empty, forwarded copies of the sent message will have a Pay button, allowing multiple users to pay directly from the forwarded message, using the same invoice.
   * If non-empty, forwarded copies of the sent message will have a URL button with a deep link to the bot (instead of a Pay button), with the value used as the start parameter
   */
  start_parameter?: string

  /**
   * Three-letter ISO 4217 currency code, see more on currencies
   */
  currency: string

  /**
   * Price breakdown, a list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.)
   */
  prices: TT.LabeledPrice[]

  /**
   * The maximum accepted amount for tips in the smallest units of the currency (integer, not float/double).
   * For example, for a maximum tip of US$ 1.45 pass max_tip_amount = 145.
   * Defaults to 0
   */
  max_tip_amount: number

  /**
   * A JSON-serialized array of suggested amounts of tips in the smallest units of the currency (integer, not float/double).
   * At most 4 suggested tip amounts can be specified.
   * The suggested tip amounts must be positive, passed in a strictly increased order and must not exceed max_tip_amount.
   */
  suggested_tip_amounts: number[]

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
 * Represents the default scope of bot commands.
 * Default commands are used if no commands with a narrower scope are specified for the user.
 */
export interface BotCommandScopeDefault {
  /**
   * Scope type
   */
  type: 'default'
}

/**
 * Represents the scope of bot commands, covering all private chats.
 */
export interface BotCommandScopeAllPrivateChats {
  /**
   * Scope type
   */
  type: 'all_private_chats'
}

/**
 * Represents the scope of bot commands, covering all group and supergroup chats.
 */
export interface BotCommandScopeAllGroupChats {
  /**
   * Scope type
   */
  type: 'all_groups_chats'
}

/**
 * Represents the scope of bot commands, covering all group and supergroup chat administrators.
 */
export interface BotCommandScopeAllChatAdministrators {
  /**
   * Scope type
   */
  type: 'all_chat_administrators'
}

/**
 * Represents the scope of bot commands, covering a specific chat.
 */
export interface BotCommandScopeChat {
  /**
   * Scope type
   */
  type: 'chat'

  /**
   * Unique identifier for the target chat or username of the target supergroup
   */
  chat_id: number | string
}

/**
 * Represents the scope of bot commands, covering all administrators of a specific group or supergroup chat.
 */
export interface BotCommandScopeChatAdministrators {
  /**
   * Scope type
   */
  type: 'chat_administrators'

  /**
   * Unique identifier for the target chat or username of the target supergroup
   */
  chat_id: number | string
}

/**
 * Represents the scope of bot commands, covering a specific member of a group or supergroup chat.
 */
export interface BotCommandScopeChatMember {
  /**
   * Scope type
   */
  type: 'chat_member'

  /**
   * Unique identifier for the target chat or username of the target supergroup
   */
  chat_id: number | string

   /**
    * Unique identifier of the target user
    */
  user_id: number
}

/**
 * This object represents the scope to which bot commands are applied.
 */
export type BotCommandScope = 
  BotCommandScopeDefault
  | BotCommandScopeAllPrivateChats
  | BotCommandScopeAllGroupChats
  | BotCommandScopeAllChatAdministrators
  | BotCommandScopeChat
  | BotCommandScopeChatAdministrators
  | BotCommandScopeChatMember

export interface ExtraScope {
  /**
   * A JSON-serialized object, describing scope of users for which the commands are relevant.
   * Defaults to BotCommandScopeDefault.
   */
  scope?: BotCommandScope
}

export interface ExtraSetMyCommands extends ExtraScope {
  /**
   * A two-letter ISO 639-1 language code.
   * If empty, commands will be applied to all users from the given scope, for whose language there are no dedicated commands
   */
   language_code?: string
}

export interface ExtraDeleteMyCommands extends ExtraScope {
  /**
   * A two-letter ISO 639-1 language code.
   * If empty, commands will be applied to all users from the given scope, for whose language there are no dedicated commands
   */
   language_code?: string
}

export interface ExtraGetMyCommands extends ExtraScope {
  /**
   * A two-letter ISO 639-1 language code or an empty string
   */
   language_code?: string
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

export type ChatInviteLink = TT.ChatInviteLink
