/** @format */

import * as tt from './telegram-types.d'

export interface Button {
  text: string

  /**
   * Keyboard builder sugar
   */
  hide?: boolean
}

export interface ContactRequestButton extends Button {
  request_contact: boolean
}

export interface LocationRequestButton extends Button {
  request_location: boolean
}

type PollType = 'poll' | 'quiz'

export interface PollRequestButton extends Button {
  request_poll: { type?: PollType }
}

export type KeyboardButton =
  | Button
  | ContactRequestButton
  | LocationRequestButton
  | PollRequestButton
  | string

export interface UrlButton extends Button {
  url: string
}

export interface CallbackButton extends Button {
  callback_data: string
}

export interface SwitchToChatButton extends Button {
  switch_inline_query: string
}

export interface SwitchToCurrentChatButton extends Button {
  switch_inline_query_current_chat: string
}

export interface GameButton extends Button {
  callback_game: tt.CallbackGame
}

export interface PayButton extends Button {
  pay: boolean
}

export interface LoginUrl {
  url: string
  forward_text?: string
  bot_username?: string
  request_write_access?: boolean
}

export interface LoginButton extends Button {
  login_url: LoginUrl
}

export type InlineKeyboardButton =
  | UrlButton
  | CallbackButton
  | SwitchToChatButton
  | SwitchToCurrentChatButton
  | GameButton
  | PayButton
  | LoginButton

export interface KeyboardOptions<TBtn> {
  columns?: number
  wrap?(btn: TBtn, index: number, currentRow: TBtn[]): boolean
}

export declare class Markup {
  forceReply(value?: boolean): this

  removeKeyboard(value?: boolean): this

  selective(value?: boolean): this

  extra(options?: tt.Extra): tt.Extra

  keyboard(
    buttons: KeyboardButton[] | KeyboardButton[][],
    options?: KeyboardOptions<KeyboardButton>
  ): this & tt.ReplyKeyboardMarkup

  resize(value?: boolean): this

  oneTime(value?: boolean): this

  inlineKeyboard(
    buttons: InlineKeyboardButton[] | InlineKeyboardButton[][],
    options: KeyboardOptions<InlineKeyboardButton>
  ): this & tt.InlineKeyboardMarkup

  button(text: string, hide?: boolean): Button

  contactRequestButton(text: string, hide?: boolean): ContactRequestButton

  locationRequestButton(text: string, hide?: boolean): LocationRequestButton

  urlButton(text: string, url: string, hide?: boolean): UrlButton

  callbackButton(text: string, data: string, hide?: boolean): CallbackButton

  switchToChatButton(
    text: string,
    value: string,
    hide?: boolean
  ): SwitchToChatButton

  switchToCurrentChatButton(
    text: string,
    value: string,
    hide?: boolean
  ): SwitchToCurrentChatButton

  gameButton(text: string, hide?: boolean): GameButton

  payButton(text: string, hide?: boolean): PayButton

  loginButton(
    text: string,
    url: string,
    opts: Omit<LoginUrl, 'url'>,
    hide?: boolean
  ): LoginButton

  static removeKeyboard(value?: string): Markup

  static forceReply(value?: string): Markup

  static keyboard(
    buttons: KeyboardButton[] | KeyboardButton[][],
    options?: KeyboardOptions<KeyboardButton>
  ): Markup & tt.ReplyKeyboardMarkup

  static inlineKeyboard(
    buttons: InlineKeyboardButton[] | InlineKeyboardButton[][],
    options?: KeyboardOptions<InlineKeyboardButton>
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

  static pollRequestButton(
    text: string,
    type: PollType,
    hide?: boolean
  ): PollRequestButton

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

  static loginButton(
    text: string,
    url: string,
    opts: Omit<LoginUrl, 'url'>,
    hide?: boolean
  ): LoginButton

  static formatHTML(text: string, entities: Array<tt.MessageEntity>): string
}
