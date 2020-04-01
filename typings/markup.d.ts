import * as tt from './telegram-types.d'

interface Button {
  text: string
  hide: boolean
}

interface ContactRequestButton {
  text: string
  hide: boolean
  request_contact: boolean
}

interface LocationRequestButton {
  text: string
  hide: boolean
  request_location: boolean
}

interface UrlButton {
  url: string
  text: string
  hide?: boolean
}

interface CallbackButton {
  text: string
  hide: boolean
  callback_data: string
}

interface SwitchToChatButton {
  text: string
  hide: boolean
  switch_inline_query: string
}

interface SwitchToCurrentChatButton {
  text: string
  hide: boolean
  switch_inline_query_current_chat: string
}

interface GameButton {
  text: string
  hide: boolean
  callback_game: tt.CallbackGame
}

interface PayButton {
  pay: boolean
  text: string
  hide: boolean
}

interface Buttons {
  url?: string
  pay?: boolean
  text: string
  callback_data?: string
  callback_game?: string
  switch_inline_query?: string
  switch_inline_query_current_chat?: string
}

export declare class Markup {
  forceReply(value?: boolean): this

  removeKeyboard(value?: boolean): this

  selective(value?: boolean): this

  extra(options?: object): object

  keyboard(
    buttons: (Buttons | string)[] | (Buttons | string)[][],
    options?: object
  ): this & tt.ReplyKeyboardMarkup

  resize(value?: boolean): this

  oneTime(value?: boolean): this

  inlineKeyboard(
    buttons: Buttons[] | Buttons[][],
    options: object
  ): this & tt.InlineKeyboardMarkup

  button(text: string, hide: boolean): Button

  contactRequestButton(text: string, hide: boolean): ContactRequestButton

  locationRequestButton(text: string, hide: boolean): LocationRequestButton

  urlButton(text: string, url: string, hide: boolean): UrlButton

  callbackButton(text: string, data: string, hide: boolean): CallbackButton

  switchToChatButton(
    text: string,
    value: string,
    hide: boolean
  ): SwitchToChatButton

  switchToCurrentChatButton(
    text: string,
    value: string,
    hide: boolean
  ): SwitchToCurrentChatButton

  gameButton(text: string, hide: boolean): GameButton

  payButton(text: string, hide: boolean): PayButton

  static removeKeyboard(value?: string): Markup

  static forceReply(value?: string): Markup

  static keyboard(
    buttons: (Buttons | string)[] | (Buttons | string)[][],
    options?: object
  ): Markup & tt.ReplyKeyboardMarkup

  static inlineKeyboard(
    buttons: (CallbackButton | UrlButton)[] | (CallbackButton | UrlButton)[][],
    options?: object
  ): Markup & tt.InlineKeyboardMarkup

  static resize(value?: boolean): Markup

  static selective(value?: boolean): Markup

  static oneTime(value?: boolean): Markup

  static button(text: string, hide?: boolean): Button

  static contactRequestButton(
    text: string,
    hide?: boolean
  ): ContactRequestButton

  static locationRequestButton(
    text: string,
    hide?: boolean
  ): LocationRequestButton

  static urlButton(text: string, url: string, hide?: boolean): UrlButton

  static callbackButton(
    text: string,
    data: string,
    hide?: boolean
  ): CallbackButton

  static switchToChatButton(
    text: string,
    value: string,
    hide?: boolean
  ): SwitchToChatButton

  static switchToCurrentChatButton(
    text: string,
    value: string,
    hide?: boolean
  ): SwitchToCurrentChatButton

  static gameButton(text: string, hide?: boolean): GameButton

  static payButton(text: string, hide?: boolean): PayButton

  static formatHTML(text: string, entities: Array<tt.MessageEntity>): string
}
