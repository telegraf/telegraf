/** @format */

import { Extra } from './extra'
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

export declare class Markup<T extends tt.KeyboardMarkupBundle> {
  forceReply(value?: boolean): Markup<tt.ForceReply> & tt.ForceReply

  removeKeyboard(value?: boolean): Markup<tt.ReplyKeyboardRemove> & tt.ReplyKeyboardRemove

  selective<T extends tt.ReplyMarkupBundle>(this: Markup<T> & T, value?: boolean): this

  extra<T extends tt.KeyboardMarkupBundle>(this: Markup<T> & T, options?: tt.Extra): tt.ExtraReply<T> & Extra

  keyboard(
    buttons: KeyboardButton[] | KeyboardButton[][],
    options?: KeyboardOptions<KeyboardButton>
  ): Markup<tt.ReplyKeyboardMarkup> & tt.ReplyKeyboardMarkup

  resize<T extends tt.ReplyKeyboardMarkup>(this: Markup<T> & T, value?: boolean): this

  oneTime<T extends tt.ReplyKeyboardMarkup>(this: Markup<T> & T, value?: boolean): this

  inlineKeyboard(
    buttons: InlineKeyboardButton[] | InlineKeyboardButton[][],
    options?: KeyboardOptions<InlineKeyboardButton>
  ): Markup<tt.InlineKeyboardMarkup> & tt.InlineKeyboardMarkup

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

  static removeKeyboard(value?: string): Markup<tt.ReplyKeyboardRemove> & tt.ReplyKeyboardRemove

  static forceReply(value?: string): Markup<tt.ForceReply> & tt.ForceReply

  static keyboard(
    buttons: KeyboardButton[] | KeyboardButton[][],
    options?: KeyboardOptions<KeyboardButton>
  ): Markup<tt.ReplyKeyboardMarkup> & tt.ReplyKeyboardMarkup

  static inlineKeyboard(
    buttons: InlineKeyboardButton[] | InlineKeyboardButton[][],
    options?: KeyboardOptions<InlineKeyboardButton>
  ): Markup<tt.InlineKeyboardMarkup> & tt.InlineKeyboardMarkup

  static resize(value?: boolean): Markup<tt.ReplyKeyboardMarkup>

  static selective(value?: boolean): Markup<tt.ReplyMarkupBundle>

  static oneTime(value?: boolean): Markup<tt.ReplyKeyboardMarkup>

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
