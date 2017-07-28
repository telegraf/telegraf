import { Agent, IncomingMessage, ServerResponse } from 'https'
import { TlsOptions } from 'tls'


export type UpdateType =
  'callback_query' |
  'channel_post' |
  'chosen_inline_result' |
  'edited_channel_post' |
  'edited_message' |
  'inline_query' |
  'shipping_query' |
  'pre_checkout_query' |
  'message'

export type UpdateSubType =
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
  'new_chat_member' |
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
  'audio'

export interface Update {
  update_id: number
  message?: Message
  edited_message?: Message
  channel_post?: Message
  edited_channel_post?: Message
  inline_query?: InlineQuery
}

export interface Context {
  telegram: Telegram
  me?: string
  message: Message

}

export type Middleware = (ctx: Context) => void

export type HearsTriggers = string[] | string | RegExp | RegExp[] | Function

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

export interface ChosenInlineResult {
  result_id: string
  from: User
  query: string
  location?: Location
  inline_message_id?: string
}
export interface SuccessfulPayment {}
export interface Invoice {}
export interface PhotoSize {}

export interface User {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}
export interface ShippingAddress {}
export interface Venue {}
export interface Location {}
export interface Contact {}
export interface VideoNote {}
export interface Voice {}
export interface Video {}
export interface Sticker {}
export interface Game {}
export interface Document {}
export interface Audio {}
export interface MessageEntity {}
export interface Chat {}

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

export interface TelegramUpdate {}

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

export interface MaskPosition {
  point: string
  x_shift: number
  y_shift: number
  scale: number
}

export interface StickerData {
  png_sticker: string | Buffer
  emojis: string
  mask_position: MaskPosition
}

/**
 * This object represents a portion of the price for goods or services.
 */
export interface LabeledPrice {
  /**
   * Portion label
   */
  label: string

  /**
   * Price of the product in the smallest units of the currency (integer, not float/double).
   * For example, for a price of US$ 1.45 pass amount = 145.
   * See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies).
   */
  amount: number
}

/**
 * This object represents one shipping option.
 */
export interface ShippingOption {
  /**
   * Shipping option identifier
   */
  id: string

  /**
   * 	Option title
   */
  title: string

  /**
   * 	List of price portions
   */
  prices: LabeledPrice[]
}

export interface InlineQueryResultCachedAudio {}
export interface InlineQueryResultCachedDocument {}
export interface InlineQueryResultCachedGif {}

export type InlineQueryResult =
  InlineQueryResultCachedAudio |
  InlineQueryResultCachedDocument |
  InlineQueryResultCachedGif

export interface AnswerInlineQueryExtra {
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
   * Use this method to add a new sticker to a set created by the bot.
   * @param ownerId User identifier of sticker set owner
   * @param name Sticker set name
   * @param stickerData Sticker data
   */
  addStickerToSet(ownerId: string | number, name: string, stickerData: StickerData): Promise<boolean>

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
   * If you sent an invoice requesting a shipping address and the parameter is_flexible was specified, the Bot API will send an Update with a shipping_query field to the bot. Use this method to reply to shipping queries. On success, True is returned.
   * @param shippingQueryId Unique identifier for the query to be answered
   * @param ok 	Specify True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible)
   * @param shippingOptions Required if ok is True. A JSON-serialized array of available shipping options.
   * @param errorMessage Required if ok is False. Error message in human readable form that explains why it is impossible to complete the order (e.g. "Sorry, delivery to your desired address is unavailable'). Telegram will display this message to the user.
   */
  answerShippingQuery(shippingQueryId: string, ok: boolean, shippingOptions: ShippingOption[], errorMessage: string): Promise<boolean>

  /**
   *
   * @param preCheckoutQueryId 	Unique identifier for the query to be answered
   * @param ok 	Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems.
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
  answerInlineQuery(inlineQueryId: string, results: InlineQueryResult[], extra?: AnswerInlineQueryExtra): Promise<boolean>
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
   * @param test 	Value or predicate (ctx) => bool
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
