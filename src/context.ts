import * as tg from './core/types/typegram'
import * as tt from './telegram-types'
import { Deunionize, PropOr, UnionKeys } from './deunionize'
import ApiClient from './core/network/client'
import { Guard, Guarded, MaybeArray } from './core/helpers/util'
import Telegram from './telegram'
import { FmtString } from './format'
import d from 'debug'

const debug = d('telegraf:context')

type Tail<T> = T extends [unknown, ...infer U] ? U : never

type Shorthand<FName extends Exclude<keyof Telegram, keyof ApiClient>> = Tail<
  Parameters<Telegram[FName]>
>

/**
 * Narrows down `C['update']` (and derived getters)
 * to specific update type `U`.
 *
 * Used by [[`Composer`]],
 * possibly useful for splitting a bot into multiple files.
 */
export type NarrowedContext<
  C extends Context,
  U extends tg.Update,
> = Context<U> & Omit<C, keyof Context>

export type FilteredContext<
  Ctx extends Context,
  Filter extends tt.UpdateType | Guard<Ctx['update']>,
> = Filter extends tt.UpdateType
  ? NarrowedContext<Ctx, Extract<tg.Update, Record<Filter, object>>>
  : NarrowedContext<Ctx, Guarded<Filter>>

export class Context<U extends Deunionize<tg.Update> = tg.Update> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly state: Record<string | symbol, any> = {}

  constructor(
    readonly update: U,
    readonly telegram: Telegram,
    readonly botInfo: tg.UserFromGetMe
  ) {}

  get updateType() {
    for (const key in this.update) {
      if (typeof this.update[key] === 'object') return key as UpdateTypes<U>
    }

    throw new Error(
      `Cannot determine \`updateType\` of ${JSON.stringify(this.update)}`
    )
  }

  get me() {
    return this.botInfo?.username
  }

  /**
   * @deprecated Use ctx.telegram instead
   */
  get tg() {
    return this.telegram
  }

  get message() {
    return this.update.message as PropOr<U, 'message'>
  }

  get editedMessage() {
    return this.update.edited_message as PropOr<U, 'edited_message'>
  }

  get inlineQuery() {
    return this.update.inline_query as PropOr<U, 'inline_query'>
  }

  get shippingQuery() {
    return this.update.shipping_query as PropOr<U, 'shipping_query'>
  }

  get preCheckoutQuery() {
    return this.update.pre_checkout_query as PropOr<U, 'pre_checkout_query'>
  }

  get chosenInlineResult() {
    return this.update.chosen_inline_result as PropOr<U, 'chosen_inline_result'>
  }

  get channelPost() {
    return this.update.channel_post as PropOr<U, 'channel_post'>
  }

  get editedChannelPost() {
    return this.update.edited_channel_post as PropOr<U, 'edited_channel_post'>
  }

  get callbackQuery() {
    return this.update.callback_query as PropOr<U, 'callback_query'>
  }

  get poll() {
    return this.update.poll as PropOr<U, 'poll'>
  }

  get pollAnswer() {
    return this.update.poll_answer as PropOr<U, 'poll_answer'>
  }

  get myChatMember() {
    return this.update.my_chat_member as PropOr<U, 'my_chat_member'>
  }

  get chatMember() {
    return this.update.chat_member as PropOr<U, 'chat_member'>
  }

  get chatJoinRequest() {
    return this.update.chat_join_request as PropOr<U, 'chat_join_request'>
  }

  get chat(): Getter<U, 'chat'> {
    return (
      this.chatMember ??
      this.myChatMember ??
      this.chatJoinRequest ??
      getMessageFromAnySource(this)
    )?.chat as Getter<U, 'chat'>
  }

  get senderChat() {
    return getMessageFromAnySource(this)?.sender_chat as Getter<
      U,
      'sender_chat'
    >
  }

  get from() {
    return (
      this.callbackQuery ??
      this.inlineQuery ??
      this.shippingQuery ??
      this.preCheckoutQuery ??
      this.chosenInlineResult ??
      this.chatMember ??
      this.myChatMember ??
      this.chatJoinRequest ??
      getMessageFromAnySource(this)
    )?.from as Getter<U, 'from'>
  }

  get inlineMessageId() {
    return (this.callbackQuery ?? this.chosenInlineResult)?.inline_message_id
  }

  get passportData() {
    if (this.message == null) return undefined
    if (!('passport_data' in this.message)) return undefined
    return this.message?.passport_data
  }

  get webAppData() {
    if (!(this.message && 'web_app_data' in this.message)) return undefined

    const { data, button_text } = this.message.web_app_data

    return {
      data: {
        json<T>() {
          return JSON.parse(data) as T
        },
        text() {
          return data
        },
      },
      button_text,
    }
  }

  /**
   * @deprecated use {@link Telegram.webhookReply}
   */
  get webhookReply(): boolean {
    return this.telegram.webhookReply
  }

  set webhookReply(enable: boolean) {
    this.telegram.webhookReply = enable
  }

  /**
   * @internal
   */
  assert<T extends string | number | object>(
    value: T | undefined,
    method: string
  ): asserts value is T {
    if (value === undefined) {
      throw new TypeError(
        `Telegraf: "${method}" isn't available for "${this.updateType}"`
      )
    }
  }

  has<Filter extends tt.UpdateType | Guard<Context['update']>>(
    filters: MaybeArray<Filter>
  ): this is FilteredContext<Context, Filter> {
    if (!Array.isArray(filters)) filters = [filters]
    for (const filter of filters)
      if (
        // TODO: this should change to === 'function' once TS bug is fixed
        // https://github.com/microsoft/TypeScript/pull/51502
        typeof filter !== 'string'
          ? // filter is a type guard
            filter(this.update)
          : // check if filter is the update type
            filter in this.update
      )
        return true

    return false
  }

  /**
   * @see https://core.telegram.org/bots/api#answerinlinequery
   */
  answerInlineQuery(...args: Shorthand<'answerInlineQuery'>) {
    this.assert(this.inlineQuery, 'answerInlineQuery')
    return this.telegram.answerInlineQuery(this.inlineQuery.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#answercallbackquery
   */
  answerCbQuery(...args: Shorthand<'answerCbQuery'>) {
    this.assert(this.callbackQuery, 'answerCbQuery')
    return this.telegram.answerCbQuery(this.callbackQuery.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#answercallbackquery
   */
  answerGameQuery(...args: Shorthand<'answerGameQuery'>) {
    this.assert(this.callbackQuery, 'answerGameQuery')
    return this.telegram.answerGameQuery(this.callbackQuery.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#answershippingquery
   */
  answerShippingQuery(...args: Shorthand<'answerShippingQuery'>) {
    this.assert(this.shippingQuery, 'answerShippingQuery')
    return this.telegram.answerShippingQuery(this.shippingQuery.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#answerprecheckoutquery
   */
  answerPreCheckoutQuery(...args: Shorthand<'answerPreCheckoutQuery'>) {
    this.assert(this.preCheckoutQuery, 'answerPreCheckoutQuery')
    return this.telegram.answerPreCheckoutQuery(
      this.preCheckoutQuery.id,
      ...args
    )
  }

  /**
   * @see https://core.telegram.org/bots/api#editmessagetext
   */
  editMessageText(text: string | FmtString, extra?: tt.ExtraEditMessageText) {
    this.assert(this.callbackQuery ?? this.inlineMessageId, 'editMessageText')
    return this.telegram.editMessageText(
      this.chat?.id,
      this.callbackQuery?.message?.message_id,
      this.inlineMessageId,
      text,
      extra
    )
  }

  /**
   * @see https://core.telegram.org/bots/api#editmessagecaption
   */
  editMessageCaption(
    caption: string | FmtString | undefined,
    extra?: tt.ExtraEditMessageCaption
  ) {
    this.assert(
      this.callbackQuery ?? this.inlineMessageId,
      'editMessageCaption'
    )
    return this.telegram.editMessageCaption(
      this.chat?.id,
      this.callbackQuery?.message?.message_id,
      this.inlineMessageId,
      caption,
      extra
    )
  }

  /**
   * @see https://core.telegram.org/bots/api#editmessagemedia
   */
  editMessageMedia(
    media: tt.WrapCaption<tg.InputMedia>,
    extra?: tt.ExtraEditMessageMedia
  ) {
    this.assert(this.callbackQuery ?? this.inlineMessageId, 'editMessageMedia')
    return this.telegram.editMessageMedia(
      this.chat?.id,
      this.callbackQuery?.message?.message_id,
      this.inlineMessageId,
      media,
      extra
    )
  }

  /**
   * @see https://core.telegram.org/bots/api#editmessagereplymarkup
   */
  editMessageReplyMarkup(markup: tg.InlineKeyboardMarkup | undefined) {
    this.assert(
      this.callbackQuery ?? this.inlineMessageId,
      'editMessageReplyMarkup'
    )
    return this.telegram.editMessageReplyMarkup(
      this.chat?.id,
      this.callbackQuery?.message?.message_id,
      this.inlineMessageId,
      markup
    )
  }

  /**
   * @see https://core.telegram.org/bots/api#editmessagelivelocation
   */
  editMessageLiveLocation(
    latitude: number,
    longitude: number,
    extra?: tt.ExtraEditMessageLiveLocation
  ) {
    this.assert(
      this.callbackQuery ?? this.inlineMessageId,
      'editMessageLiveLocation'
    )
    return this.telegram.editMessageLiveLocation(
      this.chat?.id,
      this.callbackQuery?.message?.message_id,
      this.inlineMessageId,
      latitude,
      longitude,
      extra
    )
  }

  /**
   * @see https://core.telegram.org/bots/api#stopmessagelivelocation
   */
  stopMessageLiveLocation(markup?: tg.InlineKeyboardMarkup) {
    this.assert(
      this.callbackQuery ?? this.inlineMessageId,
      'stopMessageLiveLocation'
    )
    return this.telegram.stopMessageLiveLocation(
      this.chat?.id,
      this.callbackQuery?.message?.message_id,
      this.inlineMessageId,
      markup
    )
  }

  /**
   * @see https://core.telegram.org/bots/api#sendmessage
   */
  sendMessage(text: string | FmtString, extra?: tt.ExtraReplyMessage) {
    this.assert(this.chat, 'sendMessage')
    return this.telegram.sendMessage(this.chat.id, text, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendmessage
   */
  reply(...args: Shorthand<'sendMessage'>) {
    return this.sendMessage(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#getchat
   */
  getChat(...args: Shorthand<'getChat'>) {
    this.assert(this.chat, 'getChat')
    return this.telegram.getChat(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#exportchatinvitelink
   */
  exportChatInviteLink(...args: Shorthand<'exportChatInviteLink'>) {
    this.assert(this.chat, 'exportChatInviteLink')
    return this.telegram.exportChatInviteLink(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#createchatinvitelink
   */
  createChatInviteLink(...args: Shorthand<'createChatInviteLink'>) {
    this.assert(this.chat, 'createChatInviteLink')
    return this.telegram.createChatInviteLink(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#editchatinvitelink
   */
  editChatInviteLink(...args: Shorthand<'editChatInviteLink'>) {
    this.assert(this.chat, 'editChatInviteLink')
    return this.telegram.editChatInviteLink(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#revokechatinvitelink
   */
  revokeChatInviteLink(...args: Shorthand<'revokeChatInviteLink'>) {
    this.assert(this.chat, 'revokeChatInviteLink')
    return this.telegram.revokeChatInviteLink(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#banchatmember
   */
  banChatMember(...args: Shorthand<'banChatMember'>) {
    this.assert(this.chat, 'banChatMember')
    return this.telegram.banChatMember(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#banchatmember
   * @deprecated since API 5.3. Use {@link Context.banChatMember}
   */
  get kickChatMember() {
    return this.banChatMember
  }

  /**
   * @see https://core.telegram.org/bots/api#unbanchatmember
   */
  unbanChatMember(...args: Shorthand<'unbanChatMember'>) {
    this.assert(this.chat, 'unbanChatMember')
    return this.telegram.unbanChatMember(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#restrictchatmember
   */
  restrictChatMember(...args: Shorthand<'restrictChatMember'>) {
    this.assert(this.chat, 'restrictChatMember')
    return this.telegram.restrictChatMember(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#promotechatmember
   */
  promoteChatMember(...args: Shorthand<'promoteChatMember'>) {
    this.assert(this.chat, 'promoteChatMember')
    return this.telegram.promoteChatMember(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#setchatadministratorcustomtitle
   */
  setChatAdministratorCustomTitle(
    ...args: Shorthand<'setChatAdministratorCustomTitle'>
  ) {
    this.assert(this.chat, 'setChatAdministratorCustomTitle')
    return this.telegram.setChatAdministratorCustomTitle(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#setchatphoto
   */
  setChatPhoto(...args: Shorthand<'setChatPhoto'>) {
    this.assert(this.chat, 'setChatPhoto')
    return this.telegram.setChatPhoto(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#deletechatphoto
   */
  deleteChatPhoto(...args: Shorthand<'deleteChatPhoto'>) {
    this.assert(this.chat, 'deleteChatPhoto')
    return this.telegram.deleteChatPhoto(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#setchattitle
   */
  setChatTitle(...args: Shorthand<'setChatTitle'>) {
    this.assert(this.chat, 'setChatTitle')
    return this.telegram.setChatTitle(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#setchatdescription
   */
  setChatDescription(...args: Shorthand<'setChatDescription'>) {
    this.assert(this.chat, 'setChatDescription')
    return this.telegram.setChatDescription(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#pinchatmessage
   */
  pinChatMessage(...args: Shorthand<'pinChatMessage'>) {
    this.assert(this.chat, 'pinChatMessage')
    return this.telegram.pinChatMessage(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#unpinchatmessage
   */
  unpinChatMessage(...args: Shorthand<'unpinChatMessage'>) {
    this.assert(this.chat, 'unpinChatMessage')
    return this.telegram.unpinChatMessage(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#unpinallchatmessages
   */
  unpinAllChatMessages(...args: Shorthand<'unpinAllChatMessages'>) {
    this.assert(this.chat, 'unpinAllChatMessages')
    return this.telegram.unpinAllChatMessages(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#leavechat
   */
  leaveChat(...args: Shorthand<'leaveChat'>) {
    this.assert(this.chat, 'leaveChat')
    return this.telegram.leaveChat(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#setchatpermissions
   */
  setChatPermissions(...args: Shorthand<'setChatPermissions'>) {
    this.assert(this.chat, 'setChatPermissions')
    return this.telegram.setChatPermissions(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#getchatadministrators
   */
  getChatAdministrators(...args: Shorthand<'getChatAdministrators'>) {
    this.assert(this.chat, 'getChatAdministrators')
    return this.telegram.getChatAdministrators(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#getchatmember
   */
  getChatMember(...args: Shorthand<'getChatMember'>) {
    this.assert(this.chat, 'getChatMember')
    return this.telegram.getChatMember(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#getchatmembercount
   */
  getChatMembersCount(...args: Shorthand<'getChatMembersCount'>) {
    this.assert(this.chat, 'getChatMembersCount')
    return this.telegram.getChatMembersCount(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#setpassportdataerrors
   */
  setPassportDataErrors(errors: readonly tg.PassportElementError[]) {
    this.assert(this.from, 'setPassportDataErrors')
    return this.telegram.setPassportDataErrors(this.from.id, errors)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendphoto
   */
  sendPhoto(photo: string | tg.InputFile, extra?: tt.ExtraPhoto) {
    this.assert(this.chat, 'sendPhoto')
    return this.telegram.sendPhoto(this.chat.id, photo, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendphoto
   */
  replyWithPhoto(...args: Shorthand<'sendPhoto'>) {
    return this.sendPhoto(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendmediagroup
   */
  sendMediaGroup(media: tt.MediaGroup, extra?: tt.ExtraMediaGroup) {
    this.assert(this.chat, 'sendMediaGroup')
    return this.telegram.sendMediaGroup(this.chat.id, media, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendmediagroup
   */
  replyWithMediaGroup(...args: Shorthand<'sendMediaGroup'>) {
    return this.sendMediaGroup(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendaudio
   */
  sendAudio(audio: string | tg.InputFile, extra?: tt.ExtraAudio) {
    this.assert(this.chat, 'sendAudio')
    return this.telegram.sendAudio(this.chat.id, audio, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendaudio
   */
  replyWithAudio(...args: Shorthand<'sendAudio'>) {
    return this.sendAudio(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#senddice
   */
  sendDice(extra?: tt.ExtraDice) {
    this.assert(this.chat, 'sendDice')
    return this.telegram.sendDice(this.chat.id, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#senddice
   */
  replyWithDice(...args: Shorthand<'sendDice'>) {
    return this.sendDice(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#senddocument
   */
  sendDocument(document: string | tg.InputFile, extra?: tt.ExtraDocument) {
    this.assert(this.chat, 'sendDocument')
    return this.telegram.sendDocument(this.chat.id, document, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#senddocument
   */
  replyWithDocument(...args: Shorthand<'sendDocument'>) {
    return this.sendDocument(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendsticker
   */
  sendSticker(sticker: string | tg.InputFile, extra?: tt.ExtraSticker) {
    this.assert(this.chat, 'sendSticker')
    return this.telegram.sendSticker(this.chat.id, sticker, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendsticker
   */
  replyWithSticker(...args: Shorthand<'sendSticker'>) {
    return this.sendSticker(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvideo
   */
  sendVideo(video: string | tg.InputFile, extra?: tt.ExtraVideo) {
    this.assert(this.chat, 'sendVideo')
    return this.telegram.sendVideo(this.chat.id, video, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvideo
   */
  replyWithVideo(...args: Shorthand<'sendVideo'>) {
    return this.sendVideo(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendanimation
   */
  sendAnimation(animation: string | tg.InputFile, extra?: tt.ExtraAnimation) {
    this.assert(this.chat, 'sendAnimation')
    return this.telegram.sendAnimation(this.chat.id, animation, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendanimation
   */
  replyWithAnimation(...args: Shorthand<'sendAnimation'>) {
    return this.sendAnimation(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvideonote
   */
  sendVideoNote(
    videoNote: string | tg.InputFileVideoNote,
    extra?: tt.ExtraVideoNote
  ) {
    this.assert(this.chat, 'sendVideoNote')
    return this.telegram.sendVideoNote(this.chat.id, videoNote, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvideonote
   */
  replyWithVideoNote(...args: Shorthand<'sendVideoNote'>) {
    return this.sendVideoNote(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendinvoice
   */
  sendInvoice(invoice: tt.NewInvoiceParameters, extra?: tt.ExtraInvoice) {
    this.assert(this.chat, 'sendInvoice')
    return this.telegram.sendInvoice(this.chat.id, invoice, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendinvoice
   */
  replyWithInvoice(...args: Shorthand<'sendInvoice'>) {
    return this.sendInvoice(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendgame
   */
  sendGame(game: string, extra?: tt.ExtraGame) {
    this.assert(this.chat, 'sendGame')
    return this.telegram.sendGame(this.chat.id, game, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendgame
   */
  replyWithGame(...args: Shorthand<'sendGame'>) {
    return this.sendGame(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvoice
   */
  sendVoice(voice: string | tg.InputFile, extra?: tt.ExtraVoice) {
    this.assert(this.chat, 'sendVoice')
    return this.telegram.sendVoice(this.chat.id, voice, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvoice
   */
  replyWithVoice(...args: Shorthand<'sendVoice'>) {
    return this.sendVoice(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendpoll
   */
  sendPoll(poll: string, options: readonly string[], extra?: tt.ExtraPoll) {
    this.assert(this.chat, 'sendPoll')
    return this.telegram.sendPoll(this.chat.id, poll, options, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendpoll
   */
  replyWithPoll(...args: Shorthand<'sendPoll'>) {
    return this.sendPoll(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendpoll
   */
  sendQuiz(quiz: string, options: readonly string[], extra?: tt.ExtraPoll) {
    this.assert(this.chat, 'sendQuiz')
    return this.telegram.sendQuiz(this.chat.id, quiz, options, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendpoll
   */
  replyWithQuiz(...args: Shorthand<'sendQuiz'>) {
    return this.sendQuiz(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#stoppoll
   */
  stopPoll(...args: Shorthand<'stopPoll'>) {
    this.assert(this.chat, 'stopPoll')
    return this.telegram.stopPoll(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendchataction
   */
  sendChatAction(
    action: Shorthand<'sendChatAction'>[0],
    extra?: tt.ExtraSendChatAction
  ) {
    this.assert(this.chat, 'sendChatAction')
    return this.telegram.sendChatAction(this.chat.id, action, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendchataction
   *
   * Sends the sendChatAction request repeatedly, with a delay between requests,
   * as long as the provided callback function is being processed.
   *
   * The sendChatAction errors should be ignored, because the goal is the actual long process completing and performing an action.
   *
   * @param action - chat action type.
   * @param callback - a function to run along with the chat action.
   * @param extra - extra parameters for sendChatAction.
   * @param {number} [extra.intervalDuration=8000] - The duration (in milliseconds) between subsequent sendChatAction requests.
   */
  async persistentChatAction(
    action: Shorthand<'sendChatAction'>[0],
    callback: () => Promise<void>,
    {
      intervalDuration,
      ...extra
    }: tt.ExtraSendChatAction & { intervalDuration?: number } = {}
  ) {
    await this.sendChatAction(action, { ...extra })

    const timer = setInterval(
      () =>
        this.sendChatAction(action, { ...extra }).catch((err) => {
          debug('Ignored error while persisting sendChatAction:', err)
        }),
      intervalDuration ?? 4000
    )

    try {
      await callback()
    } finally {
      clearInterval(timer)
    }
  }

  /**
   * @deprecated use {@link Context.sendChatAction} instead
   * @see https://core.telegram.org/bots/api#sendchataction
   */
  replyWithChatAction(...args: Shorthand<'sendChatAction'>) {
    return this.sendChatAction(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendlocation
   */
  sendLocation(latitude: number, longitude: number, extra?: tt.ExtraLocation) {
    this.assert(this.chat, 'sendLocation')
    return this.telegram.sendLocation(this.chat.id, latitude, longitude, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendlocation
   */
  replyWithLocation(...args: Shorthand<'sendLocation'>) {
    return this.sendLocation(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvenue
   */
  sendVenue(
    latitude: number,
    longitude: number,
    title: string,
    address: string,
    extra?: tt.ExtraVenue
  ) {
    this.assert(this.chat, 'sendVenue')
    return this.telegram.sendVenue(
      this.chat.id,
      latitude,
      longitude,
      title,
      address,
      { message_thread_id: getThreadId(this), ...extra }
    )
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvenue
   */
  replyWithVenue(...args: Shorthand<'sendVenue'>) {
    return this.sendVenue(...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendcontact
   */
  sendContact(phoneNumber: string, firstName: string, extra?: tt.ExtraContact) {
    this.assert(this.chat, 'sendContact')
    return this.telegram.sendContact(this.chat.id, phoneNumber, firstName, {
      message_thread_id: getThreadId(this),
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendcontact
   */
  replyWithContact(...args: Shorthand<'sendContact'>) {
    return this.sendContact(...args)
  }

  /**
   * @deprecated use {@link Telegram.getStickerSet}
   * @see https://core.telegram.org/bots/api#getstickerset
   */
  getStickerSet(setName: string) {
    return this.telegram.getStickerSet(setName)
  }

  /**
   * @see https://core.telegram.org/bots/api#setchatstickerset
   */
  setChatStickerSet(setName: string) {
    this.assert(this.chat, 'setChatStickerSet')
    return this.telegram.setChatStickerSet(this.chat.id, setName)
  }

  /**
   * @see https://core.telegram.org/bots/api#deletechatstickerset
   */
  deleteChatStickerSet() {
    this.assert(this.chat, 'deleteChatStickerSet')
    return this.telegram.deleteChatStickerSet(this.chat.id)
  }

  /**
   * Use this method to create a topic in a forum supergroup chat. The bot must be an administrator in the chat for this
   * to work and must have the can_manage_topics administrator rights. Returns information about the created topic as a
   * ForumTopic object.
   *
   * @see https://core.telegram.org/bots/api#createforumtopic
   */
  createForumTopic(...args: Shorthand<'createForumTopic'>) {
    this.assert(this.chat, 'createForumTopic')
    return this.telegram.createForumTopic(this.chat.id, ...args)
  }

  /**
   * Use this method to edit name and icon of a topic in a forum supergroup chat. The bot must be an administrator in
   * the chat for this to work and must have can_manage_topics administrator rights, unless it is the creator of the
   * topic. Returns True on success.
   *
   * @see https://core.telegram.org/bots/api#editforumtopic
   */
  editForumTopic(extra: tt.ExtraEditForumTopic) {
    this.assert(this.chat, 'editForumTopic')
    this.assert(this.message?.message_thread_id, 'editForumTopic')
    return this.telegram.editForumTopic(
      this.chat.id,
      this.message.message_thread_id,
      extra
    )
  }

  /**
   * Use this method to close an open topic in a forum supergroup chat. The bot must be an administrator in the chat
   * for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic.
   * Returns True on success.
   *
   * @see https://core.telegram.org/bots/api#closeforumtopic
   */
  closeForumTopic() {
    this.assert(this.chat, 'closeForumTopic')
    this.assert(this.message?.message_thread_id, 'closeForumTopic')

    return this.telegram.closeForumTopic(
      this.chat.id,
      this.message.message_thread_id
    )
  }

  /**
   * Use this method to reopen a closed topic in a forum supergroup chat. The bot must be an administrator in the chat
   * for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic.
   * Returns True on success.
   *
   * @see https://core.telegram.org/bots/api#reopenforumtopic
   */
  reopenForumTopic() {
    this.assert(this.chat, 'reopenForumTopic')
    this.assert(this.message?.message_thread_id, 'reopenForumTopic')

    return this.telegram.reopenForumTopic(
      this.chat.id,
      this.message.message_thread_id
    )
  }

  /**
   * Use this method to delete a forum topic along with all its messages in a forum supergroup chat. The bot must be an
   * administrator in the chat for this to work and must have the can_delete_messages administrator rights.
   * Returns True on success.
   *
   * @see https://core.telegram.org/bots/api#deleteforumtopic
   */
  deleteForumTopic() {
    this.assert(this.chat, 'deleteForumTopic')
    this.assert(this.message?.message_thread_id, 'deleteForumTopic')

    return this.telegram.deleteForumTopic(
      this.chat.id,
      this.message.message_thread_id
    )
  }

  /**
   * Use this method to clear the list of pinned messages in a forum topic. The bot must be an administrator in the chat
   * for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success.
   *
   * @see https://core.telegram.org/bots/api#unpinallforumtopicmessages
   */
  unpinAllForumTopicMessages() {
    this.assert(this.chat, 'unpinAllForumTopicMessages')
    this.assert(this.message?.message_thread_id, 'unpinAllForumTopicMessages')

    return this.telegram.unpinAllForumTopicMessages(
      this.chat.id,
      this.message.message_thread_id
    )
  }

  /**
   * Use this method to edit the name of the 'General' topic in a forum supergroup chat. The bot must be an administrator
   * in the chat for this to work and must have can_manage_topics administrator rights. Returns True on success.
   *
   * @see https://core.telegram.org/bots/api#editgeneralforumtopic
   */
  editGeneralForumTopic(name: string) {
    this.assert(this.chat, 'editGeneralForumTopic')
    return this.telegram.editGeneralForumTopic(this.chat.id, name)
  }

  /**
   * Use this method to close an open 'General' topic in a forum supergroup chat. The bot must be an administrator in the
   * chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
   *
   * @see https://core.telegram.org/bots/api#closegeneralforumtopic
   */
  closeGeneralForumTopic() {
    this.assert(this.chat, 'closeGeneralForumTopic')
    return this.telegram.closeGeneralForumTopic(this.chat.id)
  }

  /**
   * Use this method to reopen a closed 'General' topic in a forum supergroup chat. The bot must be an administrator in
   * the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically
   * unhidden if it was hidden. Returns True on success.
   *
   * @see https://core.telegram.org/bots/api#reopengeneralforumtopic
   */
  reopenGeneralForumTopic() {
    this.assert(this.chat, 'reopenGeneralForumTopic')
    return this.telegram.reopenGeneralForumTopic(this.chat.id)
  }

  /**
   * Use this method to hide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat
   * for this to work and must have the can_manage_topics administrator rights. The topic will be automatically closed
   * if it was open. Returns True on success.
   *
   * @see https://core.telegram.org/bots/api#hidegeneralforumtopic
   */
  hideGeneralForumTopic() {
    this.assert(this.chat, 'hideGeneralForumTopic')
    return this.telegram.hideGeneralForumTopic(this.chat.id)
  }

  /**
   * Use this method to unhide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the
   * chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
   *
   * @see https://core.telegram.org/bots/api#unhidegeneralforumtopic
   */
  unhideGeneralForumTopic() {
    this.assert(this.chat, 'unhideGeneralForumTopic')
    return this.telegram.unhideGeneralForumTopic(this.chat.id)
  }

  /**
   * Use this method to clear the list of pinned messages in a General forum topic.
   * The bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator
   * right in the supergroup.
   *
   * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
   *
   * @see https://core.telegram.org/bots/api#unpinallgeneralforumtopicmessages
   */
  unpinAllGeneralForumTopicMessages() {
    this.assert(this.chat, 'unpinAllGeneralForumTopicMessages')
    return this.telegram.unpinAllGeneralForumTopicMessages(this.chat.id)
  }

  /**
   * @deprecated use {@link Telegram.setStickerPositionInSet}
   * @see https://core.telegram.org/bots/api#setstickerpositioninset
   */
  setStickerPositionInSet(sticker: string, position: number) {
    return this.telegram.setStickerPositionInSet(sticker, position)
  }

  /**
   * @deprecated use {@link Telegram.setStickerSetThumbnail}
   * @see https://core.telegram.org/bots/api#setstickersetthumbnail
   */
  setStickerSetThumb(...args: Parameters<Telegram['setStickerSetThumbnail']>) {
    return this.telegram.setStickerSetThumbnail(...args)
  }

  setStickerSetThumbnail(
    ...args: Parameters<Telegram['setStickerSetThumbnail']>
  ) {
    return this.telegram.setStickerSetThumbnail(...args)
  }

  setStickerMaskPosition(
    ...args: Parameters<Telegram['setStickerMaskPosition']>
  ) {
    return this.telegram.setStickerMaskPosition(...args)
  }

  setStickerKeywords(...args: Parameters<Telegram['setStickerKeywords']>) {
    return this.telegram.setStickerKeywords(...args)
  }

  setStickerEmojiList(...args: Parameters<Telegram['setStickerEmojiList']>) {
    return this.telegram.setStickerEmojiList(...args)
  }

  deleteStickerSet(...args: Parameters<Telegram['deleteStickerSet']>) {
    return this.telegram.deleteStickerSet(...args)
  }

  setStickerSetTitle(...args: Parameters<Telegram['setStickerSetTitle']>) {
    return this.telegram.setStickerSetTitle(...args)
  }

  setCustomEmojiStickerSetThumbnail(
    ...args: Parameters<Telegram['setCustomEmojiStickerSetThumbnail']>
  ) {
    return this.telegram.setCustomEmojiStickerSetThumbnail(...args)
  }

  /**
   * @deprecated use {@link Telegram.deleteStickerFromSet}
   * @see https://core.telegram.org/bots/api#deletestickerfromset
   */
  deleteStickerFromSet(sticker: string) {
    return this.telegram.deleteStickerFromSet(sticker)
  }

  /**
   * @see https://core.telegram.org/bots/api#uploadstickerfile
   */
  uploadStickerFile(...args: Shorthand<'uploadStickerFile'>) {
    this.assert(this.from, 'uploadStickerFile')
    return this.telegram.uploadStickerFile(this.from.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#createnewstickerset
   */
  createNewStickerSet(...args: Shorthand<'createNewStickerSet'>) {
    this.assert(this.from, 'createNewStickerSet')
    return this.telegram.createNewStickerSet(this.from.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#addstickertoset
   */
  addStickerToSet(...args: Shorthand<'addStickerToSet'>) {
    this.assert(this.from, 'addStickerToSet')
    return this.telegram.addStickerToSet(this.from.id, ...args)
  }

  /**
   * @deprecated use {@link Telegram.getMyCommands}
   * @see https://core.telegram.org/bots/api#getmycommands
   */
  getMyCommands() {
    return this.telegram.getMyCommands()
  }

  /**
   * @deprecated use {@link Telegram.setMyCommands}
   * @see https://core.telegram.org/bots/api#setmycommands
   */
  setMyCommands(commands: readonly tg.BotCommand[]) {
    return this.telegram.setMyCommands(commands)
  }

  /**
   * @deprecated use {@link Context.replyWithMarkdownV2}
   * @see https://core.telegram.org/bots/api#sendmessage
   */
  replyWithMarkdown(markdown: string, extra?: tt.ExtraReplyMessage) {
    return this.reply(markdown, { parse_mode: 'Markdown', ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendmessage
   */
  replyWithMarkdownV2(markdown: string, extra?: tt.ExtraReplyMessage) {
    return this.reply(markdown, { parse_mode: 'MarkdownV2', ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendmessage
   */
  replyWithHTML(html: string, extra?: tt.ExtraReplyMessage) {
    return this.reply(html, { parse_mode: 'HTML', ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#deletemessage
   */
  deleteMessage(messageId?: number) {
    this.assert(this.chat, 'deleteMessage')
    if (typeof messageId !== 'undefined') {
      return this.telegram.deleteMessage(this.chat.id, messageId)
    }
    const message = getMessageFromAnySource(this)
    this.assert(message, 'deleteMessage')
    return this.telegram.deleteMessage(this.chat.id, message.message_id)
  }

  /**
   * @see https://core.telegram.org/bots/api#forwardmessage
   */
  forwardMessage(
    chatId: string | number,
    extra?: Shorthand<'forwardMessage'>[2]
  ) {
    const message = getMessageFromAnySource(this)
    this.assert(message, 'forwardMessage')
    return this.telegram.forwardMessage(
      chatId,
      message.chat.id,
      message.message_id,
      extra
    )
  }

  /**
   * @see https://core.telegram.org/bots/api#copymessage
   */
  copyMessage(chatId: string | number, extra?: tt.ExtraCopyMessage) {
    const message = getMessageFromAnySource(this)
    this.assert(message, 'copyMessage')
    return this.telegram.copyMessage(
      chatId,
      message.chat.id,
      message.message_id,
      extra
    )
  }

  /**
   * @see https://core.telegram.org/bots/api#approvechatjoinrequest
   */
  approveChatJoinRequest(userId: number) {
    this.assert(this.chat, 'approveChatJoinRequest')
    return this.telegram.approveChatJoinRequest(this.chat.id, userId)
  }

  /**
   * @see https://core.telegram.org/bots/api#declinechatjoinrequest
   */
  declineChatJoinRequest(userId: number) {
    this.assert(this.chat, 'declineChatJoinRequest')
    return this.telegram.declineChatJoinRequest(this.chat.id, userId)
  }

  /**
   * @see https://core.telegram.org/bots/api#banchatsenderchat
   */
  banChatSenderChat(senderChatId: number) {
    this.assert(this.chat, 'banChatSenderChat')
    return this.telegram.banChatSenderChat(this.chat.id, senderChatId)
  }

  /**
   * @see https://core.telegram.org/bots/api#unbanchatsenderchat
   */
  unbanChatSenderChat(senderChatId: number) {
    this.assert(this.chat, 'unbanChatSenderChat')
    return this.telegram.unbanChatSenderChat(this.chat.id, senderChatId)
  }

  /**
   * Use this method to change the bot's menu button in the current private chat. Returns true on success.
   * @see https://core.telegram.org/bots/api#setchatmenubutton
   */
  setChatMenuButton(menuButton?: tg.MenuButton) {
    this.assert(this.chat, 'setChatMenuButton')
    return this.telegram.setChatMenuButton({ chatId: this.chat.id, menuButton })
  }

  /**
   * Use this method to get the current value of the bot's menu button in the current private chat. Returns MenuButton on success.
   * @see https://core.telegram.org/bots/api#getchatmenubutton
   */
  getChatMenuButton() {
    this.assert(this.chat, 'getChatMenuButton')
    return this.telegram.getChatMenuButton({ chatId: this.chat.id })
  }

  /**
   * @see https://core.telegram.org/bots/api#setmydefaultadministratorrights
   */
  setMyDefaultAdministratorRights(
    extra?: Parameters<Telegram['setMyDefaultAdministratorRights']>[0]
  ) {
    return this.telegram.setMyDefaultAdministratorRights(extra)
  }

  /**
   * @see https://core.telegram.org/bots/api#getmydefaultadministratorrights
   */
  getMyDefaultAdministratorRights(
    extra?: Parameters<Telegram['getMyDefaultAdministratorRights']>[0]
  ) {
    return this.telegram.getMyDefaultAdministratorRights(extra)
  }
}

export default Context

type UpdateTypes<U extends Deunionize<tg.Update>> = Extract<
  UnionKeys<U>,
  tt.UpdateType
>

export type GetUpdateContent<U extends tg.Update> =
  U extends tg.Update.CallbackQueryUpdate
    ? U['callback_query']['message']
    : U[UpdateTypes<U>]

type Getter<U extends Deunionize<tg.Update>, P extends string> = PropOr<
  GetUpdateContent<U>,
  P
>

function getMessageFromAnySource<U extends tg.Update>(ctx: Context<U>) {
  return (
    ctx.message ??
    ctx.editedMessage ??
    ctx.callbackQuery?.message ??
    ctx.channelPost ??
    ctx.editedChannelPost
  )
}

const getThreadId = <U extends tg.Update>(ctx: Context<U>) => {
  const msg = getMessageFromAnySource(ctx)
  return msg?.is_topic_message ? msg.message_thread_id : undefined
}
