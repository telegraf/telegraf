import * as tg from 'typegram'
import * as tt from './telegram-types'
import { Deunionize, PropOr, UnionKeys } from './deunionize'
import Telegram from './telegram'

type Tail<T> = T extends [unknown, ...infer U] ? U : never

type Shorthand<FName extends keyof Telegram> = Telegram[FName] extends (
  ...args: infer Parameters
) => unknown
  ? Tail<Parameters>
  : never

// for types readability
export type Update = Deunionize<tg.Update>

export class Context<U extends Update = Update> {
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

  get message(): U['message'] {
    return this.update.message
  }

  get editedMessage(): U['edited_message'] {
    return this.update.edited_message
  }

  get inlineQuery(): U['inline_query'] {
    return this.update.inline_query
  }

  get shippingQuery(): U['shipping_query'] {
    return this.update.shipping_query
  }

  get preCheckoutQuery(): U['pre_checkout_query'] {
    return this.update.pre_checkout_query
  }

  get chosenInlineResult(): U['chosen_inline_result'] {
    return this.update.chosen_inline_result
  }

  get channelPost(): U['channel_post'] {
    return this.update.channel_post
  }

  get editedChannelPost(): U['edited_channel_post'] {
    return this.update.edited_channel_post
  }

  get callbackQuery(): U['callback_query'] {
    return this.update.callback_query
  }

  get poll(): U['poll'] {
    return this.update.poll
  }

  get pollAnswer(): U['poll_answer'] {
    return this.update.poll_answer
  }

  get myChatMember(): U['my_chat_member'] {
    return this.update.my_chat_member
  }

  get chatMember(): U['chat_member'] {
    return this.update.chat_member
  }

  get chatJoinRequest(): U['chat_join_request'] {
    return this.update.chat_join_request
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
    if (
      !(
        'message' in this.update &&
        this.update.message &&
        'web_app_data' in this.update.message
      )
    )
      return undefined

    const { data, button_text } = this.update.message.web_app_data

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
   * @internal
   */
  assert<T extends string | object>(
    value: T | undefined,
    method: string
  ): asserts value is T {
    if (value === undefined) {
      throw new TypeError(
        `Telegraf: "${method}" isn't available for "${this.updateType}"`
      )
    }
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
  editMessageText(text: string, extra?: tt.ExtraEditMessageText) {
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
    caption: string | undefined,
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
  editMessageMedia(media: tg.InputMedia, extra?: tt.ExtraEditMessageMedia) {
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
  sendMessage(...args: Shorthand<'sendMessage'>) {
    this.assert(this.chat, 'sendMessage')
    return this.telegram.sendMessage(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendmessage
   */
  reply(text: string, extra?: tt.ExtraReplyMessage) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendMessage(text, { reply_to_message_id, ...extra })
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
  sendPhoto(...args: Shorthand<'sendPhoto'>) {
    this.assert(this.chat, 'sendPhoto')
    return this.telegram.sendPhoto(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendphoto
   */
  replyWithPhoto(photo: string | tt.InputFile, extra?: tt.ExtraPhoto) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendPhoto(photo, { reply_to_message_id, ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendmediagroup
   */
  sendMediaGroup(...args: Shorthand<'sendMediaGroup'>) {
    this.assert(this.chat, 'sendMediaGroup')
    return this.telegram.sendMediaGroup(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendmediagroup
   */
  replyWithMediaGroup(
    media: Parameters<Telegram['sendMediaGroup']>[1],
    extra?: tt.ExtraMediaGroup
  ) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendMediaGroup(media, { reply_to_message_id, ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendaudio
   */
  sendAudio(...args: Shorthand<'sendAudio'>) {
    this.assert(this.chat, 'sendAudio')
    return this.telegram.sendAudio(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendaudio
   */
  replyWithAudio(audio: string | tt.InputFile, extra?: tt.ExtraAudio) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendAudio(audio, { reply_to_message_id, ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#senddice
   */
  sendDice(...args: Shorthand<'sendDice'>) {
    this.assert(this.chat, 'sendDice')
    return this.telegram.sendDice(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#senddice
   */
  replyWithDice(extra?: tt.ExtraDice) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendDice({ reply_to_message_id, ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#senddocument
   */
  sendDocument(...args: Shorthand<'sendDocument'>) {
    this.assert(this.chat, 'sendDocument')
    return this.telegram.sendDocument(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#senddocument
   */
  replyWithDocument(document: string | tt.InputFile, extra?: tt.ExtraDocument) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendDocument(document, { reply_to_message_id, ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendsticker
   */
  sendSticker(...args: Shorthand<'sendSticker'>) {
    this.assert(this.chat, 'sendSticker')
    return this.telegram.sendSticker(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendsticker
   */
  replyWithSticker(sticker: string | tt.InputFile, extra?: tt.ExtraSticker) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendSticker(sticker, { reply_to_message_id, ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvideo
   */
  sendVideo(...args: Shorthand<'sendVideo'>) {
    this.assert(this.chat, 'sendVideo')
    return this.telegram.sendVideo(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvideo
   */
  replyWithVideo(video: string | tt.InputFile, extra?: tt.ExtraVideo) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendVideo(video, { reply_to_message_id, ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendanimation
   */
  sendAnimation(...args: Shorthand<'sendAnimation'>) {
    this.assert(this.chat, 'sendAnimation')
    return this.telegram.sendAnimation(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendanimation
   */
  replyWithAnimation(
    animation: string | tt.InputFile,
    extra?: tt.ExtraAnimation
  ) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendAnimation(animation, { reply_to_message_id, ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvideonote
   */
  sendVideoNote(...args: Shorthand<'sendVideoNote'>) {
    this.assert(this.chat, 'sendVideoNote')
    return this.telegram.sendVideoNote(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvideonote
   */
  replyWithVideoNote(
    videoNote: string | tt.InputFile,
    extra?: tt.ExtraVideoNote
  ) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendVideoNote(videoNote, { reply_to_message_id, ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendinvoice
   */
  sendInvoice(...args: Shorthand<'sendInvoice'>) {
    this.assert(this.chat, 'sendInvoice')
    return this.telegram.sendInvoice(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendinvoice
   */
  replyWithInvoice(invoice: tt.NewInvoiceParameters, extra?: tt.ExtraInvoice) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendInvoice(invoice, { reply_to_message_id, ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendgame
   */
  sendGame(...args: Shorthand<'sendGame'>) {
    this.assert(this.chat, 'sendGame')
    return this.telegram.sendGame(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendgame
   */
  replyWithGame(gameName: string, extra?: tt.ExtraGame) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendGame(gameName, { reply_to_message_id, ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvoice
   */
  sendVoice(...args: Shorthand<'sendVoice'>) {
    this.assert(this.chat, 'sendVoice')
    return this.telegram.sendVoice(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvoice
   */
  replyWithVoice(voice: string | tt.InputFile, extra?: tt.ExtraVoice) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendVoice(voice, { reply_to_message_id, ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendpoll
   */
  sendPoll(...args: Shorthand<'sendPoll'>) {
    this.assert(this.chat, 'sendPoll')
    return this.telegram.sendPoll(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendpoll
   */
  replyWithPoll(
    question: string,
    options: readonly string[],
    extra?: tt.ExtraPoll
  ) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendPoll(question, options, { reply_to_message_id, ...extra })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendquiz
   */
  sendQuiz(...args: Shorthand<'sendQuiz'>) {
    this.assert(this.chat, 'sendQuiz')
    return this.telegram.sendQuiz(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendquiz
   */
  replyWithQuiz(
    question: string,
    options: readonly string[],
    extra: tt.ExtraPoll
  ) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendQuiz(question, options, { reply_to_message_id, ...extra })
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
  sendChatAction(...args: Shorthand<'sendChatAction'>) {
    this.assert(this.chat, 'sendChatAction')
    return this.telegram.sendChatAction(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendlocation
   */
  sendLocation(...args: Shorthand<'sendLocation'>) {
    this.assert(this.chat, 'sendLocation')
    return this.telegram.sendLocation(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendlocation
   */
  replyWithLocation(
    latitude: number,
    longitude: number,
    extra?: tt.ExtraLocation
  ) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendLocation(latitude, longitude, {
      reply_to_message_id,
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvenue
   */
  sendVenue(...args: Shorthand<'sendVenue'>) {
    this.assert(this.chat, 'sendVenue')
    return this.telegram.sendVenue(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendvenue
   */
  replyWithVenue(
    latitude: number,
    longitude: number,
    title: string,
    address: string,
    extra?: tt.ExtraVenue
  ) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendVenue(latitude, longitude, title, address, {
      reply_to_message_id,
      ...extra,
    })
  }

  /**
   * @see https://core.telegram.org/bots/api#sendcontact
   */
  sendContact(...args: Shorthand<'sendContact'>) {
    this.assert(this.chat, 'sendContact')
    return this.telegram.sendContact(this.chat.id, ...args)
  }

  /**
   * @see https://core.telegram.org/bots/api#sendcontact
   */
  replyWithContact(
    phoneNumber: string,
    firstName: string,
    extra?: tt.ExtraContact
  ) {
    const reply_to_message_id = getMessageFromAnySource(this)?.message_id
    return this.sendContact(phoneNumber, firstName, {
      reply_to_message_id,
      ...extra,
    })
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
  deleteChatStickerSet(this: Context) {
    this.assert(this.chat, 'deleteChatStickerSet')
    return this.telegram.deleteChatStickerSet(this.chat.id)
  }

  /**
   * @deprecated use {@link Telegram.setStickerPositionInSet}
   * @see https://core.telegram.org/bots/api#setstickerpositioninset
   */
  setStickerPositionInSet(sticker: string, position: number) {
    return this.telegram.setStickerPositionInSet(sticker, position)
  }

  /**
   * @deprecated use {@link Telegram.setStickerSetThumb}
   * @see https://core.telegram.org/bots/api#setstickersetthumb
   */
  setStickerSetThumb(...args: Parameters<Telegram['setStickerSetThumb']>) {
    return this.telegram.setStickerSetThumb(...args)
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
  getMyCommands(this: Context) {
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
    extra?: {
      disable_notification?: boolean
    }
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

function getMessageFromAnySource<U extends Deunionize<tg.Update>>(
  ctx: Context<U>
) {
  return (
    ctx.message ??
    ctx.editedMessage ??
    ctx.callbackQuery?.message ??
    ctx.channelPost ??
    ctx.editedChannelPost
  )
}
