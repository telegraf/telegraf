

/// ====================================================== ///

interface Query {
  id: string
  from: User
}

export interface InlineQuery extends Query {
  location?: Location
  query: string
  offset: string
}

export interface ShippingQuery extends Query {
  invoice_payload: string
  shipping_address: ShippingAddress
}

export interface PreCheckoutQuery extends Query {
  currency: string
  total_amount: number
  invoice_payload: string
  shipping_option_id?: string
  order_info?: OrderInfo
}

export interface CallbackQuery extends Query {
  /**
   * Global identifier, uniquely corresponding to the chat to which the message with
   * the callback button was sent. Useful for high scores in games.
   */
  chat_instance: string

  /**
   * Message with the callback button that originated the query.
   * Note that message content and message date will not be available if the message is too old
   */
  message?: Message

  /**
   * Identifier of the message sent via the bot in inline mode, that originated the query.
   */
  inline_message_id?: string

  /**
   * Data associated with the callback button.
   * Be aware that a bad client can send arbitrary data in this field.
   */
  data?: string

  /**
   * Short name of a Game to be returned, serves as the unique identifier for the game
   */
  game_short_name?: string
}

export interface ChosenInlineResult {
  result_id: string
  from: User
  query: string
  location?: Location
  inline_message_id?: string
}

export interface SuccessfulPayment {
  /**
   * Three-letter ISO 4217 currency code
   */
  currency: string

  /**
   * Total price in the smallest units of the currency (integer, not float/double).
   * For example, for a price of US$ 1.45 pass amount = 145. See the exp parameter in currencies.json,
   * it shows the number of digits past the decimal point for each currency (2 for the majority of currencies).
   */
  total_amount: number

  /**
   * Bot specified invoice payload
   */
  invoice_payload: string

  /**
   * Identifier of the shipping option chosen by the user
   */
  shipping_option_id?: string

  /**
   * Order info provided by the user
   */
  order_info?: OrderInfo

  /**
   * Telegram payment identifier
   */
  telegram_payment_charge_id: string

  /**
   * Provider payment identifier
   */
  provider_payment_charge_id: string
}

export interface Invoice {
  /**
   * Product name
   */
  title: string

  /**
   * Product description
   */
  description: string

  /**
   * Unique bot deep-linking parameter that can be used to generate this invoice
   */
  start_parameter: string

  /**
   * Three-letter ISO 4217 currency code
   */
  currency: string

  /**
   * Total price in the smallest units of the currency (integer, not float/double).
   * For example, for a price of US$ 1.45 pass amount = 145. See the exp parameter in currencies.json,
   * it shows the number of digits past the decimal point for each currency (2 for the majority of currencies).
   */
  total_amount: number

}

export interface PhotoSize {
  /**
   * Unique identifier for this file
   */
  file_id: string

  /**
   * Photo width
   */
  width: number

  /**
   * Photo height
   */
  height: number

  /**
   * File size
   */
  file_size?: number
}

export interface User {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface ShippingAddress {
  /**
   * ISO 3166-1 alpha-2 country code
   */
  country_code: string

  /**
   * State, if applicable
   */
  state: string

  /**
   * City
   */
  city: string

  /**
   * First line for the address
   */
  street_line1: string

  /**
   * Second line for the address
   */
  street_line2: string

  /**
   * Address post code
   */
  post_code: string
}

export interface Venue {
  /**
   * Venue location
   */
  location: Location

  /**
   * Name of the venue
   */
  title: string

  /**
   * Address of the venue
   */
  address: string

  /**
   * Foursquare identifier of the venue
   */
  foursquare_id?: string
}

export interface Location {
  /**
   * Longitude as defined by sender
   */
  longitude: number

  /**
   * Latitude as defined by sender
   */
  latitude: number
}

export interface Contact {
  /**
   *  Contact's phone number
   */
  phone_number: string

  /**
   * Contact's first name
   */
  first_name: string

  /**
   * Contact's last name
   */
  last_name?: string

  /**
   * Contact's user identifier in Telegram
   */
  user_id?: number
}

export interface VideoNote {
  /**
   * Unique identifier for this file
   */
  file_id: string

  /**
   * Video width and height as defined by sender
   */
  length: number

  /**
   * Duration of the video in seconds as defined by sender
   */
  duration: number

  /**
   * Video thumbnail
   */
  thumb?: PhotoSize

  /**
   * File size
   */
  file_size?: number
}

export interface Voice {
  /**
   * Unique identifier for this file
   */
  file_id: string

  /**
   * Duration of the audio in seconds as defined by sender
   */
  duration: number

  /**
   * MIME type of the file as defined by sender
   */
  mime_type?: string

  /**
   * File size
   */
  file_size?: number
}

export interface Video {
  /**
   * Unique identifier for this file
   */
  file_id: string

  /**
   * Video width as defined by sender
   */
  width: number

  /**
   * Video height as defined by sender
   */
  height: number

  /**
   * Duration of the video in seconds as defined by sender
   */
  duration: number

  /**
   * Video thumbnail
   */
  thumb?: PhotoSize

  /**
   * Mime type of a file as defined by sender
   */
  mime_type?: string

  /**
   * File size
   */
  file_size?: number
}

export interface Sticker {
  /**
   * Unique identifier for this file
   */
  file_id: string

  /**
   * Sticker width
   */
  width: number

  /**
   * Sticker height
   */
  height: number

  /**
   * Sticker thumbnail in the .webp or .jpg format
   */
  thumb?: PhotoSize

  /**
   * Emoji associated with the sticker
   */
  emoji?: string

  /**
   * Name of the sticker set to which the sticker belongs
   */
  set_name?: string

  /**
   * For mask stickers, the position where the mask should be placed
   */
  mask_position?: MaskPosition

  /**
   * File size
   */
  file_size?: number
}

export interface StickerSet {
  /**
   * Sticker set name
   */
  name: string

  /**
   * Sticker set title
   */
  title: string

  /**
   * True, if the sticker set contains masks
   */
  contains_masks: boolean

  /**
   * List of all set stickers
   */
  stickers: Array<Sticker>
}

export interface Animation {
  /**
   * Unique file identifier
   */
  file_id: string

  /**
   * Animation thumbnail as defined by sender
   */
  thumb?: PhotoSize

  /**
   * Original animation filename as defined by sender
   */
  file_name?: string

  /**
   * MIME type of the file as defined by sender
   */
  mime_type?: string

  /**
   * File size
   */
  file_size?: number
}

export interface Game {
  /**
   * Title of the game
   */
  title: string

  /**
   * Description of the game
   */
  description: string

  /**
   * Photo that will be displayed in the game message in chats.
   */
  photo: Array<PhotoSize>

  /**
   * Brief description of the game or high scores included in the game message.
   * Can be automatically edited to include current high scores for the game when the bot calls
   * setGameScore, or manually edited using editMessageText. 0-4096 characters.
   */
  text?: string

  /**
   * Special entities that appear in text, such as usernames, URLs, bot commands, etc.
   */
  text_entities?: Array<MessageEntity>

  /**
   * Animation that will be displayed in the game message in chats. Upload via BotFather
   */
  animation?: Animation
}

export interface Document {
  /**
   * Unique file identifier
   */
  file_id: string

  /**
   * Document thumbnail as defined by sender
   */
  thumb?: PhotoSize

  /**
   * Original filename as defined by sender
   */
  file_name?: string

  /**
   * MIME type of the file as defined by sender
   */
  mime_type?: string

  /**
   * File size
   */
  file_size?: number
}

export interface Audio {
  /**
   * Unique identifier for this file
   */
  file_id: string

  /**
   * Duration of the audio in seconds as defined by sender
   */
  duration: number

  /**
   * Performer of the audio as defined by sender or by audio tags
   */
  performer?: string

  /**
   * Title of the audio as defined by sender or by audio tags
   */
  title?: string

  /**
   * MIME type of the file as defined by sender
   */
  mime_type?: string

  /**
   * File size
   */
  file_size?: number
}

export interface MessageEntity {
  /**
   * Type of the entity. Can be mention (@username), hashtag, bot_command, url, email,
   * bold (bold text), italic (italic text), code (monowidth string), pre (monowidth block),
   * text_link (forclickable text URLs), text_mention (for users without usernames)
   */
  type: string

  /**
   * Offset in UTF-16 code units to the start of the entity
   */
  offset: number

  /**
   * Length of the entity in UTF-16 code units
   */
  length: number

  /**
   * For “text_link” only, url that will be opened after user taps on the text
   */
  url?: string

  /**
   * For “text_mention” only, the mentioned user
   */
  user?: User
}

export interface ChatPhoto {
  /**
   * Unique file identifier of small (160x160) chat photo.
   * This file_id can be used only for photo download.
   */
  small_file_id: string

  /**
   * Unique file identifier of big (640x640) chat photo.
   * This file_id can be used only for photodownload.
   */
  big_file_id: string
}

export interface Chat {
  /**
   * Unique identifier for this chat.
   * This number may be greater than 32 bits and some programming languages may have
   * difficulty/silent defects in interpreting it. But it is smaller than 52 bits,
   * so a signed 64 bit integer or double-precision float type are safe for storing this identifier.
   */
  id: number

  /**
   * Type of chat, can be either “private”, “group”, “supergroup” or “channel”
   */
  type: string

  /**
   * Title, for supergroups, channels and group chats
   */
  title?: string

  /**
   * Username, for private chats, supergroups and channels if available
   */
  username?: string

  /**
   * First name of the other party in a private chat
   */
  first_name?: string

  /**
   * Last name of the other party in a private chat
   */
  last_name?: string

  /**
   * True if a group has ‘All Members Are Admins’ enabled.
   */
  all_members_are_administrators?: true

  /**
   * Chat photo. Returned only in getChat.
   */
  photo?: ChatPhoto

  /**
   * Description, for supergroups and channel chats.
   * Returned only in getChat.
   */
  description?: string

  /**
   * Chat invite link, for supergroups and channel chats.
   * Returned only in getChat.
   */
  invite_link?: string
}

export interface ChatMember {
  /**
   * Information about the user
   */
  user: User

  /**
   * The member's status in the chat. Can be “creator”, “administrator”, “member”, “restricted”, “left” or “kicked”
   */
  status: string

  /**
   * Restictred and kicked only. Date when restrictions will be lifted for this user, unix time
   */
  until_date?: number

  /**
   * Administrators only. True, if the bot is allowed to edit administrator privileges of that user
   */
  can_be_edited?: true

  /**
   * Administrators only. True, if the administrator can change the chat title, photo and other settings
   */
  can_change_info?: true

  /**
   * Administrators only. True, if the administrator can post in the channel, channels only
   */
  can_post_messages?: true

  /**
   * Administrators only. True, if the administrator can edit messages of other users, channels only
   */
  can_edit_messages?: true

  /**
   * Administrators only. True, if the administrator can delete messages of other users
   */
  can_delete_messages?: true

  /**
   * Administrators only. True, if the administrator can invite new users to the chat
   */
  can_invite_users?: true

  /**
   * Administrators only. True, if the administrator can restrict, ban or unban chat members
   */
  can_restrict_members?: true

  /**
   * Administrators only. True, if the administrator can pin messages, supergroups only
   */
  can_pin_messages?: true

  /**
   * Administrators only. True, if the administrator can add new administrators
   * with a subset of his own privileges or demote administrators that he has promoted,
   * directly or indirectly (promoted by administrators that were appointed by the user)
   */
  can_promote_members?: true

  /**
   * Restricted only. True, if the user can send text messages, contacts, locations and venues
   */
  can_send_messages?: true

  /**
   * Restricted only. True, if the user can send audios, documents, photos, videos,
   * video notes and voice notes, implies can_send_messages
   */
  can_send_media_messages?: true

  /**
   * Restricted only. True, if the user can send animations, games, stickers and use inline bots,
   * implies can_send_media_messages
   */
  can_send_other_messages?: true

  /**
   * Restricted only. True, if user may add web page previews to his messages,
   * implies can_send_media_messages
   */
  can_add_web_page_previews?: true
}

export interface File {
  /**
   * Unique identifier for this file
   */
  file_id: string

  /**
   * File size, if known
   */
  file_size?: number

  /**
   * File path. Use https://api.telegram.org/file/bot<token>/<file_path> to get the file.
   */
  file_path?: string
}

export interface Message {
  message_id: number
  date: number
  chat: Chat
  text?: string
  from?: User

  forward_from?: User
  forward_from_chat?: Chat
  forward_from_message_id?: number
  forward_date?: number
  reply_to_message?: Message

  edit_date?: number
  new_chat_members?: User[]
  new_chat_member?: User
  left_chat_member: User
  new_chat_title?: string
  new_chat_photo?: PhotoSize[]

  delete_chat_photo?: true
  group_chat_created?: true
  supergroup_chat_created?: true
  channel_chat_created?: true
  migrate_to_chat_id?: number
  migrate_from_chat_id?: number
}

export interface IncomingMessage extends Message {
  audio?: Audio
  entities?: MessageEntity[]
  caption?: string
  document?: Document
  game?: Game
  photo?: PhotoSize[]
  sticker?: Sticker
  video?: Video
  video_note?: VideoNote
  contact?: Contact
  location?: Location
  venue?: Venue
  pinned_message?: Message
  invoice?: Invoice
  successful_payment?: SuccessfulPayment
}

export interface MessageAudio extends Message {
  audio: Audio
}

export interface MessageDocument extends Message {
  document: Document
}

export interface MessageGame extends Message {
  game: Game
}

export interface MessageInvoice extends Message {
  invoice: Invoice
}

export interface MessageLocation extends Message {
  location: Location
}

export interface MessagePhoto extends Message {
  photo: PhotoSize[]
}

export interface MessageSticker extends Message {
  sticker: Sticker
}

export interface MessageVideo extends Message {
  video: Video
}

export interface MaskPosition {
  point: string
  x_shift: number
  y_shift: number
  scale: number
}

export interface LabeledPrice {
  /**
   * Portion label
   */
  label: string

  /**
   * Price of the product in the smallest units of the currency (integer, not float/double).
   * For example, for a price of US$ 1.45 pass amount = 145.
   * See the exp parameter in currencies.json, it shows
   * the number of digits past the decimal point for each currency (2 for the majority of currencies).
   */
  amount: number
}

export interface ShippingOption {
  /**
   * Shipping option identifier
   */
  id: string

  /**
   *  Option title
   */
  title: string

  /**
   *  List of price portions
   */
  prices: LabeledPrice[]
}

export interface OrderInfo {
  /**
   * User name
   */
  name?: string

  /**
   * User's phone number
   */
  phone_number?: string

  /**
   * User email
   */
  email?: string

  /**
   * User shipping address
   */
  shipping_address?: ShippingAddress
}


export type InputMessageContent =
  InputTextMessageContent |
  InputLocationMessageContent |
  InputVenueMessageContent |
  InputContactMessageContent

export interface InputTextMessageContent {
  /**
   * Text of the message to be sent, 1-4096 characters
   */
  message_text: string

  /**
   * Send Markdown or HTML, if you want Telegram apps to show bold,
   * italic, fixed-width text or inline URLs in your bot's message.
   */
  parse_mode?: string

  /**
   * Disables link previews for links in the sent message
   */
  disable_web_page_preview?: true
}

export interface InputLocationMessageContent {
  /**
   * Latitude of the location in degrees
   */
  latitude: number

  /**
   * Longitude of the location in degrees
   */
  longitude: number
}

export interface InputVenueMessageContent {
  /**
   * Latitude of the venue in degrees
   */
  latitude: number

  /**
   * Longitude of the venue in degrees
   */
  longitude: number

  /**
   * Name of the venue
   */
  title: string

  /**
   * Address of the venue
   */
  address: string

  /**
   * Foursquare identifier of the venue, if known
   */
  foursquare_id?: string
}

export interface InputContactMessageContent {
  /**
   * Contact's phone number
   */
  phone_number: string

  /**
   * Contact's first name
   */
  first_name: string

  /**
   * Contact's last name
   */
  last_name?: string
}


export interface InlineQueryResultCachedAudio {
  /**
   * Type of the result, must be audio
   */
  type: string

  /**
   * Unique identifier for this result, 1-64 bytes
   */
  id: string

  /**
   * A valid file identifier for the audio file
   */
  audio_file_id: string

  /**
   * Caption, 0-200 characters
   */
  caption?: string

  /**
   * Inline keyboard attached to the message
   */
  reply_markup?: InlineKeyboardMarkup

  /**
   * Content of the message to be sent instead of the audio
   */
  input_message_content?: InputMessageContent
}

export interface InlineQueryResultCachedDocument {
  /**
   * Type of the result, must be document
   */
  type: string

  /**
   * Unique identifier for this result, 1-64 bytes
   */
  id: string

  /**
   * Title for the result
   */
  title: string

  /**
   * A valid file identifier for the file
   */
  document_file_id: string

  /**
   * Short description of the result
   */
  description?: string

  /**
   * Caption of the document to be sent, 0-200 characters
   */
  caption?: string

  /**
   * Inline keyboard attached to the message
   */
  reply_markup?: InlineKeyboardMarkup

  /**
   * Content of the message to be sent instead of the file
   */
  input_message_content?: InputMessageContent

}

export interface InlineQueryResultCachedGif {
  /**
   * Type of the result, must be gif
   */
  type: string

  /**
   * Unique identifier for this result, 1-64 bytes
   */
  id: string

  /**
   * A valid file identifier for the GIF file
   */
  gif_file_id: string

  /**
   * Title for the result
   */
  title?: string

  /**
   * Caption of the GIF file to be sent, 0-200 characters
   */
  caption?: string

  /**
   * Inline keyboard attached to the message
   */
  reply_markup?: InlineKeyboardMarkup

  /**
   * Content of the message to be sent instead of the GIF animation
   */
  input_message_content?: InputMessageContent
}

/**
 * A placeholder, currently holds no information. Use BotFather to set up your game.
 */
export interface CallbackGame {
}

export type InlineQueryResult =
  InlineQueryResultCachedAudio |
  InlineQueryResultCachedDocument |
  InlineQueryResultCachedGif

export interface InlineKeyboardButton {
  /**
   * Label text on the button
   */
  text: string

  /**
   * HTTP url to be opened when button is pressed
   */
  url?: string

  /**
   * Data to be sent in a callback query to the bot when button is pressed, 1-64 bytes
   */
  callback_data?: string

  /**
   * If set, pressing the button will prompt the user to select one of their chats,
   * open that chat and insert the bot‘s username and the specified inline query in the input field.
   * Can be empty, in which case just the bot’s username will be inserted.
   * Note: This offers an easy way for users to start using your bot in inline mode when they are currently
   * in a private chat with it. Especially useful when combined with switch_pm… actions – in this case
   * the user will be automatically returned to the chat they switched from, skipping the chat selection screen.
   */
  switch_inline_query?: string

  /**
   * If set, pressing the button will insert the bot‘s username and the specified inline query in the
   * current chat's input field. Can be empty, in which case only the bot’s username will be inserted.
   * This offers a quick way for the user to open your bot in inlinemode in the same chat –
   * good for selecting something from multiple options.
   */
  switch_inline_query_current_chat?: string

  /**
   * Description of the game that will be launched when the user presses the button.
   * NOTE: This type of button must always be the first button in the first row.
   */
  callback_game?: CallbackGame

  /**
   * Specify True, to send a Pay button.
   * NOTE: This type of button must always be the first button in the first row.
   */
  pay?: true
}

export interface InlineKeyboardMarkup {
  /**
   * Array of button rows, each represented by an Array of InlineKeyboardButton objects
   */
  inline_keyboard: Array<Array<InlineKeyboardButton>>
}

export interface KeyboardButton {
  /**
   * Text of the button. If none of the optional fields are used,
   * it will be sent to the bot as a message when the button is pressed
   */
  text: string

  /**
   * If True, the user's phone number will be sent as a contact when the button is pressed.
   * Available in private chats only
   */
  request_contact?: true

  /**
   * If True, the user's current location will be sent when the button is pressed.
   * Available in private chats only
   */
  request_location?: true
}

export interface ReplyKeyboardMarkup {
  /**
   * Array of button rows, each represented by an Array of KeyboardButton objects
   */
  keyboard: Array<Array<KeyboardButton>>

  /**
   * Requests clients to resize the keyboard vertically for optimal fit (e.g., make the keyboard smaller if there are just two rows of buttons). Defaults to false, in which case the custom keyboard is always of the same height as the app's standard keyboard.
   */
  resize_keyboard?: true

  /**
   * Requests clients to hide the keyboard as soon as it's been used. The keyboard will still be available,
   * but clients will automatically display the usual
   * letter-keyboard in the chat – the user can press a special button
   * in the input field to see the custom keyboard again. Defaults to false.
   */
  one_time_keyboard?: true

  /**
   * Use this parameter if you want to show the keyboard to specific users only.
   * Targets:
   * 1) users that are @mentioned in the text of the Message object;
   * 2) if the bot's message is a reply (has reply_to_message_id), sender of the original message.
   * Example:
   * A user requests to change the bot‘s language, bot replies to the request with a keyboard
   * to select the new language. Other users in the group don’t see the keyboard.
   */
  selective?: true
}

export interface ReplyKeyboardRemove {
  /**
   * Requests clients to remove the custom keyboard
   * (user will not be able to summon this keyboard; if you want to hide the keyboard from sight but keep it
   * accessible, use one_time_keyboard in ReplyKeyboardMarkup)
   */
  remove_keyboard: true

  /**
   * Use this parameter if you want to remove the keyboard for specific users only.
   * Targets:
   * 1) users that are @mentioned in the text of the Message object;
   * 2) if the bot's message is a reply (has reply_to_message_id), sender of the original message.
   * Example: A u ser votes in a poll, bot returns confirmation message in reply to the vote and removes
   * the keyboard for that user, while still showing the keyboard with poll options to users who haven't voted yet.
   */
  selective?: true
}

export interface ForceReply {
  /**
   * Shows reply interface to the user, as if they manually selected the bot‘s message and tapped ’Reply'
   */
  force_reply: true

  /**
   * Use this parameter if you want to force reply from specific users only.
   * Targets:
   * 1) users that are @mentioned in the text of the Message object;
   * 2) if the bot's message is a reply (has reply_to_message_id), sender of the original message.
   */
  selective?: true
}

export interface StickerData {
  png_sticker: string | Buffer
  emojis: string
  mask_position: MaskPosition
}

type FileId = string

interface InputFileByPath {
  source: string
}

interface InputFileByReadableStream {
  source: ReadableStream
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

/// ====================================================== ///

export type ParseMode = 'Markdown' | 'HTML'

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

export type UpdateSubType =
  'audio' |
  'channel_chat_created' |
  'contact' |
  'delete_chat_photo' |
  'document' |
  'game' |
  'group_chat_created' |
  'invoice' |
  'left_chat_member' |
  'location' |
  'migrate_from_chat_id' |
  'migrate_to_chat_id' |
  'new_chat_member' |
  'new_chat_photo' |
  'new_chat_title' |
  'photo' |
  'pinned_message' |
  'sticker' |
  'successful_payment' |
  'supergroup_chat_created' |
  'text' |
  'venue' |
  'video' |
  'video_note' |
  'voice'

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

export interface Update {
  update_id: number
  channel_post?: Message
  edited_channel_post?: Message
  edited_message?: Message
  inline_query?: InlineQuery
  message?: Message
}

export interface ExtraAnswerInlineQuery {
  /**
   * The maximum amount of time in seconds that the result of the inline query may be cached on the server. Defaults to 300.
   */
  cache_time?: number

  /**
   * Pass True, if results may be cached on the server side only for the user that sent the query. By default, results may be returned to any user who sends the same query
   */
  is_personal?: number

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
  reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply
}

interface ExtraEditMessage extends ExtraReplyMessage {
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

export interface NewVideoParams {
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
   * Video caption (may also be used when resending videos by file_id), 0-200 characters
   */
  caption?: string
}
