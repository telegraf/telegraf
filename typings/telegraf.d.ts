import { Agent, IncomingMessage, ServerResponse } from 'https'
import { TlsOptions } from 'tls'

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

export interface Context<S extends {}> {
  telegram: Telegram
  state: S
  callbackQuery?: CallbackQuery
  channelPost?: Message
  chat?: Chat
  chosenInlineResult?: ChosenInlineResult
  editedChannelPost?: Message
  editedMessage?: Message
  from?: User
  inlineQuery?: InlineQuery
  me?: string
  message?: IncomingMessage
  preCheckoutQuery?: PreCheckoutQuery
  shippingQuery?: ShippingQuery
}

export interface ContextMessageUpdate<S extends {}> extends Context<S> {

  /**
   * Use this method to add a new sticker to a set created by the bot
   * @param ownerId User identifier of sticker set owner
   * @param name Sticker set name
   * @param stickerData Sticker object
   * @param isMasks https://github.com/telegraf/telegraf/blob/87882c42f6c2496576fdb57ca622690205c3e35e/lib/telegram.js#L304
   * @returns Returns True on success.
   */
  addStickerToSet(ownerId: number, name: string, stickerData: StickerData, isMasks: boolean): Promise<boolean>

  /**
   * Use this method to create new sticker set owned by a user. The bot will be able to edit the created sticker set
   * @param ownerId User identifier of created sticker set owner
   * @param name Short name of sticker set, to be used in t.me/addstickers/ URLs (e.g., animals). Can contain only english letters, digits and underscores. Must begin with a letter, can't contain consecutive underscores and must end in “_by_<bot username>”. <bot_username> is case insensitive. 1-64 characters.
   * @param title Sticker set title, 1-64 characters
   * @param stickerData Sticker object
   * @returns Returns True on success.
   */
  createNewStickerSet(ownerId: number, name: string, title: string, stickerData: StickerData): Promise<boolean>

  /**
   * Use this method to delete a chat photo. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @returns True on success
   */
  deleteChatPhoto(): Promise<boolean>

  /**
   * Use this method to delete a sticker from a set created by the bot.
   * @param sticker File identifier of the sticker
   * @returns Returns True on success
   */
  deleteStickerFromSet(sticker: string): Promise<boolean>

  /**
   * Use this method to export an invite link to a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @returns exported invite link as String on success.
   */
  exportChatInviteLink(): Promise<string>

  /**
   * Use this method to get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.)
   * @returns a Chat object on success.
   */
  getChat(): Promise<Chat>

  /**
   * Use this method to get a list of administrators in a chat.
   * @returns On success, returns an Array of ChatMember objects that contains information about all chat administrators except other bots. If the chat is a group or a supergroup and no administrators were appointed, only the creator will be returned.
   */
  getChatAdministrators(): Promise<Array<ChatMember>>

  /**
   * Use this method to get information about a member of a chat.
   * @param userId Unique identifier of the target user
   * @returns a ChatMember object on success
   */
  getChatMember(userId: number): Promise<ChatMember>

  /**
   * Use this method to get the number of members in a chat
   * @returns Number on success
   */
  getChatMembersCount(): Promise<number>

  /**
   * Use this method to get a sticker set
   * @param setName Name of the sticker set
   * @returns On success, a StickerSet object is returned.
   */
  getStickerSet(setName: string): Promise<StickerSet>

  /**
   * Use this method for your bot to leave a group, supergroup or channel
   * @returns True on success
   */
  leaveChat(): Promise<boolean>

  /**
   * Use this method to pin a message in a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights
   * @param messageId Identifier of a message to pin
   * @param extra Pass `{ disable_notification: true }`, if it is not necessary to send a notification to all group members about the new pinned message
   * @returns True on success
   */
  pinChatMessage(messageId: number, extra?: { disable_notification?: boolean }): Promise<boolean>

  /**
   * Use this method to reply on messages in the same chat.
   * @param text Text of the message to be sent
   * @param extra SendMessage additional params
   * @returns sent Message if Success
   */
  reply(text: string, extra?: ExtraReplyMessage): Promise<Message>

  /**
   * Use this method to send audio files to the same chat, if you want Telegram clients to display them in the music player.
   * Your audio must be in the .mp3 format.
   * Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future.
   * @param audio Audio file to send. Pass a file_id as String to send an audio file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an audio file from the Internet, or upload a new one using multipart/form-data
   * @param extra Audio extra parameters
   * @returns On success, the sent Message is returned.
   */
  replyWithAudio(audio: InputFile, extra?: ExtraAudio): Promise<MessageAudio>

  /**
   * Use this method when you need to tell the user that something is happening on the bot's side.
   * The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status).
   * Choose one, depending on what the user is about to receive:
   * - typing for text messages,
   * - upload_photo for photos,
   * - record_video or upload_video for videos,
   * - record_audio or upload_audio for audio files,
   * - upload_document for general files,
   * - find_location for location data,
   * - record_video_note or upload_video_note for video notes.
   * @param action Type of action to broadcast.
   * @returns True on success
   */
  replyWithChatAction(action: ChatAction): Promise<boolean>

  /**
   * Use this method to send general files. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.
   * @param document File to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data
   * @param extra Additional params for send document
   * @returns a Message on success
   */
  replyWithDocument(document: InputFile, extra?: ExtraDocument): Promise<MessageDocument>

  /**
   * Use this method to send a game
   * @param gameShortName Short name of the game, serves as the unique identifier for the game. Set up your games via Botfather.
   * @param extra Additional params for send game
   * @returns a Message on success
   */
  replyWithGame(gameShortName: string, extra?: ExtraGame): Promise<MessageGame>

  /**
   * The Bot API supports basic formatting for messages
   * @param html You can use bold and italic text, as well as inline links and pre-formatted code in your bots' messages.
   * @param extra Additional params to send message
   * @returns a Message on success
   */
  replyWithHTML(html: string, extra?: ExtraEditMessage): Promise<Message>

  /**
   * Use this method to send invoices
   * @param invoice Object with new invoice params
   * @param extra Additional params for send invoice
   * @returns a Message on success
   */
  replyWithInvoice(invoice: NewInvoiceParams, extra?: ExtraInvoice): Promise<MessageInvoice>

  /**
   * Use this method to send point on the map
   * @param latitude Latitude of location
   * @param longitude Longitude of location
   * @param extra Additional params for send location
   * @returns a Message on success
   */
  replyWithLocation(latitude: number, longitude: number, extra?: ExtraLocation): Promise<MessageLocation>

  /**
   * The Bot API supports basic formatting for messages
   * @param markdown You can use bold and italic text, as well as inline links and pre-formatted code in your bots' messages.
   * @param extra Additional params to send message
   * @returns a Message on success
   */
  replyWithMarkdown(markdown: string, extra?: ExtraEditMessage): Promise<Message>

  /**
   * Use this method to send photos
   * @param photo Photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a photo from the Internet, or upload a new photo using multipart/form-data
   * @param extra Additional params to send photo
   * @returns a Message on success
   */
  replyWithPhoto(photo: InputFile, extra?: ExtraPhoto): Promise<MessagePhoto>

  /**
   * Use this method to send .webp stickers
   * @param sticker Sticker to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a .webp file from the Internet, or upload a new one using multipart/form-data
   * @param extra Additional params to send sticker
   * @returns a Message on success
   */
  replyWithSticker(sticker: InputFile, extra?: ExtraSticker): Promise<MessageSticker>

  /**
   * Use this method to send video files, Telegram clients support mp4 videos (other formats may be sent as Document)
   * Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.
   * @param video video to send. Pass a file_id as String to send a video that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a video from the Internet, or upload a new video using multipart/form-data
   * @param extra Additional params to send video
   * @returns a Message on success
   */
  replyWithVideo(video: InputFile, extra?: ExtraVideo): Promise<MessageVideo>


  // ------------------------------------------------------------------------------------------ //
  // ------------------------------------------------------------------------------------------ //
  // ------------------------------------------------------------------------------------------ //


  /**
   * Use this method to send answers to an inline query. On success, True is returned.
   * No more than 50 results per query are allowed.
   * @param results Array of results for the inline query
   * @param extra Extra optional parameters
   */
  answerInlineQuery(results: InlineQueryResult[], extra?: ExtraAnswerInlineQuery): Promise<boolean>

  /**
   * Use this method to send answers to callback queries.
   * @param text Notification text
   * @param url Game url
   * @param showAlert Show alert instead of notification
   * @param cacheTime The maximum amount of time in seconds that the result of the callback query may be cached client-side. Telegram apps will support caching starting in version 3.14. Defaults to 0.
   */
  answerCallbackQuery(text?: string, url?: string, showAlert?: boolean, cacheTime?: number): Promise<boolean>

  /**
   * Use this method to send answers to game query.
   * @param url Notification text
   */
  answerGameQuery(url: string): Promise<boolean>

  /**
   * If you sent an invoice requesting a shipping address and the parameter is_flexible was specified, the Bot API will send an Update with a shipping_query field to the bot. Use this method to reply to shipping queries. On success, True is returned.
   * @param ok  Specify True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible)
   * @param shippingOptions Required if ok is True. A JSON-serialized array of available shipping options.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains why it is impossible to complete the order (e.g. "Sorry, delivery to your desired address is unavailable'). Telegram will display this message to the user.
   */
  answerShippingQuery(ok: boolean, shippingOptions: ShippingOption[], errorMessage: string): Promise<boolean>

  /**
   * Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query. Use this method to respond to such pre-checkout queries. On success, True is returned. Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.
   * @param ok  Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains the reason for failure to proceed with the checkout (e.g. "Sorry, somebody just bought the last of our amazing black T-shirts while you were busy filling out your payment details. Please choose a different color or garment!"). Telegram will display this message to the user.
   */
  answerPreCheckoutQuery(ok: boolean, errorMessage?: string): Promise<boolean>

  /**
   * Use this method to send answers to an inline query.
   * No more than 50 results per query are allowed.
   * @returns On success, True is returned.
   * @param results Array of results for the inline query
   * @param extra Extra optional parameters
   */
  answerInlineQuery(results: InlineQueryResult[], extra?: ExtraAnswerInlineQuery): Promise<boolean>

  /**
   * Use this method to edit text and game messages sent by the bot or via the bot (for inline bots).
   * @returns On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param text New text of the message
   * @param extra Extra params
   */
  editMessageText(text: string, extra?: ExtraEditMessage): Promise<boolean>

  /**
   * Use this method to edit captions of messages sent by the bot or via the bot (for inline bots).
   * On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param caption New caption of the message
   * @param markup Markup of inline keyboard
   */
  editMessageCaption(caption?: string, markup?: InlineKeyboardMarkup): Promise<Message | boolean>

  /**
   * Use this method to edit only the reply markup of messages sent by the bot or via the bot (for inline bots).
   * @returns On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param markup Markup of inline keyboard
   */
  editMessageReplyMarkup(markup?: InlineKeyboardMarkup): Promise<Message | boolean>

  /**
   * Use this method to delete a message, including service messages, with the following limitations:
   * - A message can only be deleted if it was sent less than 48 hours ago.
   * - Bots can delete outgoing messages in groups and supergroups.
   * - Bots granted can_post_messages permissions can delete outgoing messages in channels.
   * - If the bot is an administrator of a group, it can delete any message there.
   * - If the bot has can_delete_messages permission in a supergroup or a channel, it can delete any message there.
   * @returns Returns True on success.
   */
  deleteMessage(): Promise<boolean>

  /**
   * Use this method to upload a .png file with a sticker for later use in createNewStickerSet and addStickerToSet methods (can be used multiple times)
   * https://core.telegram.org/bots/api#sending-files
   * @param ownerId User identifier of sticker file owner
   * @param stickerFile Png image with the sticker, must be up to 512 kilobytes in size, dimensions must not exceed 512px, and either width or height must be exactly 512px.
   * @returns Returns the uploaded File on success
   */
  uploadStickerFile(ownerId: number, stickerFile: InputFile): Promise<File>

  /**
   * Use this method to move a sticker in a set created by the bot to a specific position
   * @param sticker File identifier of the sticker
   * @param position New sticker position in the set, zero-based
   * @returns Returns True on success.
   */
  setStickerPositionInSet(sticker: string, position: number): Promise<boolean>

}

export interface Middleware<S = {}> {
  (ctx: Context<S>): any

  (ctx: Context<S>, next: () => Promise<any>): Promise<any>
}

export type HearsTriggers = string[] | string | RegExp | RegExp[] | Function


export interface TelegramOptions {
  /**
   * https.Agent instance, allows custom proxy, certificate, keep alive, etc.
   */
  agent?: Agent

  /**
   * Reply via webhook
   */
  webhookReply?: boolean
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

export class Telegram {
  /**
   * Use this property to control reply via webhook feature.
   */
  public webkhookReply: boolean

  /**
   * Initialize new Telegram app.
   * @param token Bot token
   * @param options Telegram options
   */
  constructor(token: string, options: TelegramOptions)


  /**
   * Use this method to send answers to callback queries.
   * @param callbackQueryId Query id
   * @param text Notification text
   * @param url Game url
   * @param showAlert Show alert instead of notification
   * @param cacheTime The maximum amount of time in seconds that the result of the callback query may be cached client-side. Telegram apps will support caching starting in version 3.14. Defaults to 0.
   */
  answerCallbackQuery(callbackQueryId: string, text?: string, url?: string, showAlert?: boolean, cacheTime?: number): Promise<boolean>

  /**
   * Use this method to send answers to game query.
   * @param callbackQueryId Query id
   * @param url Notification text
   */
  answerGameQuery(callbackQueryId: string, url: string): Promise<boolean>

  /**
   * If you sent an invoice requesting a shipping address and the parameter is_flexible was specified,
   * the Bot API will send an Update with a shipping_query field to the bot.
   * Use this method to reply to shipping queries.
   * On success, True is returned.
   * @param shippingQueryId Unique identifier for the query to be answered
   * @param ok  Specify True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible)
   * @param shippingOptions Required if ok is True. A JSON-serialized array of available shipping options.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains why it is impossible to complete the order (e.g. "Sorry, delivery to your desired address is unavailable'). Telegram will display this message to the user.
   */
  answerShippingQuery(shippingQueryId: string, ok: boolean, shippingOptions: ShippingOption[], errorMessage: string): Promise<boolean>

  /**
   * Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query.
   * Use this method to respond to such pre-checkout queries. On success, True is returned.
   * Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.
   * @param preCheckoutQueryId  Unique identifier for the query to be answered
   * @param ok  Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains the reason for failure to proceed with the checkout (e.g. "Sorry, somebody just bought the last of our amazing black T-shirts while you were busy filling out your payment details. Please choose a different color or garment!"). Telegram will display this message to the user.
   */
  answerPreCheckoutQuery(preCheckoutQueryId: string, ok: boolean, errorMessage?: string): Promise<boolean>

  /**
   * Use this method to send answers to an inline query. On success, True is returned.
   * No more than 50 results per query are allowed.
   * @param inlineQueryId Unique identifier for the answered query
   * @param results Array of results for the inline query
   * @param extra Extra optional parameters
   */
  answerInlineQuery(inlineQueryId: string, results: InlineQueryResult[], extra?: ExtraAnswerInlineQuery): Promise<boolean>

  /**
   * Use this method to edit text and game messages sent by the bot or via the bot (for inline bots).
   * On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param text New text of the message
   * @param extra Extra params
   */
  editMessageText(chatId: number | string | void, messageId: number | void, inlineMessageId: string | void, text: string, extra?: ExtraEditMessage): Promise<Message | boolean>

  /**
   * Use this method to edit captions of messages sent by the bot or via the bot (for inline bots).
   * On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param caption New caption of the message
   * @param markup A JSON-serialized object for an inline keyboard.
   */
  editMessageCaption(chatId?: number | string, messageId?: number, inlineMessageId?: string, caption?: string, markup?: string): Promise<Message | boolean>

  /**
   * Use this method to edit only the reply markup of messages sent by the bot or via the bot (for inline bots).
   * On success, if edited message is sent by the bot, the edited Message is returned, otherwise True is returned.
   * @param chatId Required if inlineMessageId is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Required if inlineMessageId is not specified. Identifier of the sent message
   * @param inlineMessageId Required if chatId and messageId are not specified. Identifier of the inline message
   * @param markup A JSON-serialized object for an inline keyboard.
   */
  editMessageReplyMarkup(chatId?: number | string, messageId?: number, inlineMessageId?: string, markup?: string): Promise<Message | boolean>

  /**
   * Use this method to delete a message, including service messages, with the following limitations:
   * - A message can only be deleted if it was sent less than 48 hours ago.
   * - Bots can delete outgoing messages in groups and supergroups.
   * - Bots granted can_post_messages permissions can delete outgoing messages in channels.
   * - If the bot is an administrator of a group, it can delete any message there.
   * - If the bot has can_delete_messages permission in a supergroup or a channel, it can delete any message there.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param messageId Identifier of the message to delete
   * @returns Returns True on success.
   */
  deleteMessage(chatId: number | string, messageId: number): Promise<boolean>

  /**
   * Use this method to get a sticker set
   * @param setName Name of the sticker set
   * @returns On success, a StickerSet object is returned.
   */
  getStickerSet(setName: string): Promise<StickerSet>

  /**
   * Use this method to upload a .png file with a sticker for later use in createNewStickerSet and addStickerToSet methods (can be used multiple times)
   * https://core.telegram.org/bots/api#sending-files
   * @param ownerId User identifier of sticker file owner
   * @param stickerFile Png image with the sticker, must be up to 512 kilobytes in size, dimensions must not exceed 512px, and either width or height must be exactly 512px.
   * @returns Returns the uploaded File on success
   */
  uploadStickerFile(ownerId: number, stickerFile: InputFile): Promise<File>

  /**
   * Use this method to create new sticker set owned by a user. The bot will be able to edit the created sticker set
   * @param ownerId User identifier of created sticker set owner
   * @param name Short name of sticker set, to be used in t.me/addstickers/ URLs (e.g., animals). Can contain only english letters, digits and underscores. Must begin with a letter, can't contain consecutive underscores and must end in “_by_<bot username>”. <bot_username> is case insensitive. 1-64 characters.
   * @param title Sticker set title, 1-64 characters
   * @param stickerData Sticker object
   * @returns Returns True on success.
   */
  createNewStickerSet(ownerId: number, name: string, title: string, stickerData: StickerData): Promise<boolean>

  /**
   * Use this method to add a new sticker to a set created by the bot
   * @param ownerId User identifier of sticker set owner
   * @param name Sticker set name
   * @param stickerData Sticker object
   * @param isMasks https://github.com/telegraf/telegraf/blob/87882c42f6c2496576fdb57ca622690205c3e35e/lib/telegram.js#L304
   * @returns Returns True on success.
   */
  addStickerToSet(ownerId: number, name: string, stickerData: StickerData, isMasks: boolean): Promise<boolean>

  /**
   * Use this method to move a sticker in a set created by the bot to a specific position
   * @param sticker File identifier of the sticker
   * @param position New sticker position in the set, zero-based
   * @returns Returns True on success.
   */
  setStickerPositionInSet(sticker: string, position: number): Promise<boolean>

  /**
   * Use this method to delete a sticker from a set created by the bot.
   * @param sticker File identifier of the sticker
   * @returns Returns True on success
   */
  deleteStickerFromSet(sticker: string): Promise<boolean>

  /**
   * Use this method to send copy of exists message.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param message Received message object
   * @param extra Specified params for message
   * @returns On success, the sent Message is returned.
   */
  sendCopy(chatId: number | string, message?: Message, extra?: object): Promise<Message>

  /**
   * Use this method to delete a chat photo. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @returns True on success
   */
  deleteChatPhoto(chatId: number | string): Promise<boolean>

  /**
   * Use this method to export an invite link to a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @returns exported invite link as String on success.
   */
  exportChatInviteLink(chatId: number | string): Promise<string>

  /**
   * Use this method to get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.)
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @returns a Chat object on success.
   */
  getChat(chatId: number | string): Promise<Chat>

  /**
   * Use this method to get a list of administrators in a chat.
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @returns On success, returns an Array of ChatMember objects that contains information about all chat administrators except other bots. If the chat is a group or a supergroup and no administrators were appointed, only the creator will be returned.
   */
  getChatAdministrators(chatId: number | string): Promise<Array<ChatMember>>

  /**
   * Use this method to get information about a member of a chat.
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @param userId Unique identifier of the target user
   * @returns a ChatMember object on success
   */
  getChatMember(chatId: string | number, userId: number): Promise<ChatMember>

  /**
   * Use this method to get the number of members in a chat
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @returns Number on success
   */
  getChatMembersCount(chatId: string | number): Promise<number>

  /**
   * Use this method for your bot to leave a group, supergroup or channel
   * @param chatId Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
   * @returns True on success
   */
  leaveChat(chatId: number | string): Promise<boolean>

  /**
   * Use this method to pin a message in a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights
   * @param chatId Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   * @param messageId Identifier of a message to pin
   * @param extra Pass `{ disable_notification: true }`, if it is not necessary to send a notification to all group members about the new pinned message
   * @returns True on success
   */
  pinChatMessage(chatId: number | string, messageId: number, extra?: { disable_notification?: boolean }): Promise<boolean>

  /**
   * Use this method to send text messages
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param text Text of the message to be sent
   * @param extra SendMessage additional params
   * @returns sent Message if Success
   */
  sendMessage(chatId: number | string, text: string, extra?: ExtraReplyMessage): Promise<Message>

  /**
   * Use this method to send audio files, if you want Telegram clients to display them in the music player.
   * Your audio must be in the .mp3 format.
   * Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param audio Audio file to send. Pass a file_id as String to send an audio file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an audio file from the Internet, or upload a new one using multipart/form-data
   * @param extra Audio extra parameters
   * @returns On success, the sent Message is returned.
   */
  sendAudio(chatId: number | string, audio: InputFile, extra?: ExtraAudio): Promise<MessageAudio>

  /**
   * Use this method when you need to tell the user that something is happening on the bot's side.
   * The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status).
   * Choose one, depending on what the user is about to receive:
   * - typing for text messages,
   * - upload_photo for photos,
   * - record_video or upload_video for videos,
   * - record_audio or upload_audio for audio files,
   * - upload_document for general files,
   * - find_location for location data,
   * - record_video_note or upload_video_note for video notes.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param action Type of action to broadcast.
   * @returns True on success
   */
  sendChatAction(chatId: number | string, action: ChatAction): Promise<boolean>

  /**
   * Use this method to send general files. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param document File to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data
   * @param extra Additional params for send document
   * @returns a Message on success
   */
  sendDocument(chatId: number | string, document: InputFile, extra?: ExtraDocument): Promise<MessageDocument>

  /**
   * Use this method to send a game
   * @param chatId Unique identifier for the target chat
   * @param gameShortName Short name of the game, serves as the unique identifier for the game. Set up your games via Botfather.
   * @param extra Additional params for send game
   * @returns a Message on success
   */
  sendGame(chatId: number | string, gameShortName: string, extra?: ExtraGame): Promise<MessageGame>

  /**
   * Use this method to send invoices
   * @param chatId Unique identifier for the target private chat
   * @param invoice Object with new invoice params
   * @param extra Additional params for send invoice
   * @returns a Message on success
   */
  sendInvoice(chatId: number, invoice: NewInvoiceParams, extra?: ExtraInvoice): Promise<MessageInvoice>

  /**
   * Use this method to send point on the map
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param latitude Latitude of location
   * @param longitude Longitude of location
   * @param extra Additional params for send location
   * @returns a Message on success
   */
  sendLocation(chatId: number | string, latitude: number, longitude: number, extra?: ExtraLocation): Promise<MessageLocation>

  /**
   * Use this method to send photos
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param photo Photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a photo from the Internet, or upload a new photo using multipart/form-data
   * @param extra Additional params to send photo
   * @returns a Message on success
   */
  sendPhoto(chatId: number | string, photo: InputFile, extra?: ExtraPhoto): Promise<MessagePhoto>

  /**
   * Use this method to send .webp stickers
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param sticker Sticker to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a .webp file from the Internet, or upload a new one using multipart/form-data
   * @param extra Additional params to send sticker
   * @returns a Message on success
   */
  sendSticker(chatId: number | string, sticker: InputFile, extra?: ExtraSticker): Promise<MessageSticker>

  /**
   * Use this method to send video files, Telegram clients support mp4 videos (other formats may be sent as Document)
   * Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.
   * @param chatId Unique identifier for the target chat or username of the target channel (in the format @channelusername)
   * @param video video to send. Pass a file_id as String to send a video that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a video from the Internet, or upload a new video using multipart/form-data
   * @param extra Additional params to send video
   * @returns a Message on success
   */
  sendVideo(chatId: number | string, video: InputFile, extra?: ExtraVideo): Promise<MessageVideo>
}


export interface TelegrafOptions {
  /**
   * Telegram options
   */
  telegram?: TelegramOptions

  /**
   * Bot username
   */
  username?: string
}

export class Telegraf {
  /**
   * Use this property to get/set bot token
   */
  public token: string

  /**
   * Use this property to control reply via webhook feature.
   */
  public webhookReply: boolean

  /**
   * Initialize new Telegraf app.
   * @param token Bot token
   * @param options options
   * @example
   * new Telegraf(token, options)
   */
  constructor(token: string, options?: TelegrafOptions)

  /**
   * Registers a middleware.
   * @param middleware Middleware function
   */
  use(middleware: Middleware)

  /**
   * Registers middleware for provided update type.
   * @param updateTypes Update type
   * @param middlewares Middleware functions
   */
  on(updateTypes: UpdateType | UpdateType[], middleware: Middleware, ...middlewares: Middleware[])

  /**
   * Registers middleware for handling text messages.
   * @param triggers Triggers
   * @param middlewares Middleware functions
   */
  hears(triggers: HearsTriggers, middleware: Middleware, ...middlewares: Middleware[])

  /**
   * Command handling.
   * @param command Commands
   * @param middlwares Middleware functions
   */
  command(command: string | string[], middleware: Middleware, ...middlewares: Middleware[])

  /**
   * Registers middleware for handling callback_data actions with game query.
   * @param middlewares Middleware functions
   */
  gameQuery(middleware: Middleware, ...middlewares: Middleware[])

  /**
   * Start poll updates.
   * @param timeout Poll timeout in seconds
   * @param limit Limits the number of updates to be retrieved
   * @param allowedUpdates List the types of updates you want your bot to receive
   */
  startPolling(timeout?: number, limit?: number, allowedUpdates?: UpdateType[])

  /**
   * Start listening @ https://host:port/webhookPath for Telegram calls.
   * @param webhookPath Webhook url path (see Telegraf.setWebhook)
   * @param tlsOptions TLS server options. Pass null to use http
   * @param port Port number
   * @param host Hostname
   */
  startWebhook(webhookPath: string, tlsOptions: TlsOptions, port: number, host?: string)

  /**
   * Stop Webhook and polling
   */
  stop()

  /**
   * Return a callback function suitable for the http[s].createServer() method to handle a request.
   * You may also use this callback function to mount your telegraf app in a Koa/Connect/Express app.
   * @param webhookPath Webhook url path (see Telegraf.setWebhook)
   */
  webhookCallback(webhookPath: string): (req: IncomingMessage, res: ServerResponse) => void

  /**
   * Handle raw Telegram update. In case you use centralized webhook server, queue, etc.
   * @param rawUpdate Telegram update payload
   * @param webhookResponse http.ServerResponse
   */
  handleUpdate(rawUpdate: Update, webhookResponse?: ServerResponse)

  /**
   * Compose middlewares returning a fully valid middleware comprised of all those which are passed.
   * @param middlewares Array of middlewares functions
   */
  static compose(middlewares: Middleware[]): Middleware

  /**
   * Generates middleware for handling provided update types.
   * @param updateTypes Update type
   * @param middleware Middleware function
   */
  static mount(updateTypes: UpdateType | UpdateType[], middleware: Middleware): Middleware

  /**
   * Generates middleware for handling text messages with regular expressions.
   * @param triggers Triggers
   * @param handler Handler
   */
  static hears(triggers: HearsTriggers, handler: Middleware): Middleware

  /**
   * Generates middleware for handling callbackQuery data with regular expressions.
   * @param triggers Triggers
   * @param handler Handler
   */
  static action(triggers: HearsTriggers, handler: Middleware): Middleware

  /**
   * Generates pass thru middleware.
   */
  static passThru(): Middleware

  /**
   * Generates safe version of pass thru middleware.
   */
  static safePassThru(): Middleware

  /**
   * Generates optional middleware.
   * @param test Value or predicate (ctx) => bool
   * @param middleware Middleware function
   */
  static optional(test: boolean | ((ctx: Context) => boolean), middleware: Middleware): Middleware

  /**
   * Generates filter middleware.
   * @param test  Value or predicate (ctx) => bool
   */
  static filter(test: boolean | ((ctx: Context) => boolean)): Middleware

  /**
   * Generates branch middleware.
   * @param test Value or predicate (ctx) => bool
   * @param trueMiddleware true action middleware
   * @param falseMiddleware false action middleware
   */
  static branch(test: boolean | ((ctx: Context) => boolean), trueMiddleware: Middleware, falseMiddleware: Middleware): Middleware
}


export default Telegraf
