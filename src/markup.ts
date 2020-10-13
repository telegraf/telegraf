import {
  ForceReply,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  KeyboardButton,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from 'typegram'
import { is2D } from './core/helpers/check-utils'

type Hideable<B> = B & { hide?: boolean }
type HideableKBtn = Hideable<KeyboardButton>
type HideableIKBtn = Hideable<InlineKeyboardButton>

class Markup<
  T extends
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply
> {
  constructor(readonly reply_markup: T) {}

  selective<T extends ForceReply | ReplyKeyboardMarkup>(
    this: Markup<T>,
    value = true
  ): Markup<T> {
    return new Markup<T>({ ...this.reply_markup, selective: value })
  }

  resize(
    this: Markup<ReplyKeyboardMarkup>,
    value = true
  ): Markup<ReplyKeyboardMarkup> {
    return new Markup<ReplyKeyboardMarkup>({
      ...this.reply_markup,
      resize_keyboard: value,
    })
  }

  oneTime(
    this: Markup<ReplyKeyboardMarkup>,
    value = true
  ): Markup<ReplyKeyboardMarkup> {
    return new Markup<ReplyKeyboardMarkup>({
      ...this.reply_markup,
      one_time_keyboard: value,
    })
  }
}

// eslint-disable-next-line import/export
export function button(
  text: string,
  hide = false
): Hideable<KeyboardButton.CommonButton> {
  return { text, hide }
}

// eslint-disable-next-line import/export, @typescript-eslint/no-namespace
export namespace button {
  export function contactRequest(
    text: string,
    hide = false
  ): Hideable<KeyboardButton.RequestContactButton> {
    return { text, request_contact: true, hide }
  }

  export function locationRequest(
    text: string,
    hide = false
  ): Hideable<KeyboardButton.RequestLocationButton> {
    return { text, request_location: true, hide }
  }

  export function pollRequest(
    text: string,
    type?: 'quiz' | 'regular',
    hide = false
  ): Hideable<KeyboardButton.RequestPollButton> {
    return { text, request_poll: { type }, hide }
  }

  export function url(
    text: string,
    url: string,
    hide = false
  ): Hideable<InlineKeyboardButton.UrlButton> {
    return { text, url, hide }
  }

  export function callback(
    text: string,
    data: string,
    hide = false
  ): Hideable<InlineKeyboardButton.CallbackButton> {
    return { text, callback_data: data, hide }
  }

  export function switchToChat(
    text: string,
    value: string,
    hide = false
  ): Hideable<InlineKeyboardButton.SwitchInlineButton> {
    return { text, switch_inline_query: value, hide }
  }

  export function switchToCurrentChat(
    text: string,
    value: string,
    hide = false
  ): Hideable<InlineKeyboardButton.SwitchInlineCurrentChatButton> {
    return { text, switch_inline_query_current_chat: value, hide }
  }

  export function game(
    text: string,
    hide = false
  ): Hideable<InlineKeyboardButton.GameButton> {
    return { text, callback_game: {}, hide }
  }

  export function pay(
    text: string,
    hide = false
  ): Hideable<InlineKeyboardButton.PayButton> {
    return { text, pay: true, hide }
  }

  export function login(
    text: string,
    url: string,
    opts: {
      forward_text?: string
      bot_username?: string
      request_write_access?: boolean
    } = {},
    hide = false
  ): Hideable<InlineKeyboardButton.LoginButton> {
    return {
      text,
      login_url: { ...opts, url },
      hide,
    }
  }
}

export function removeKeyboard(): Markup<ReplyKeyboardRemove> {
  return new Markup<ReplyKeyboardRemove>({ remove_keyboard: true })
}

export function forceReply(): Markup<ForceReply> {
  return new Markup<ForceReply>({ force_reply: true })
}

export function keyboard(buttons: HideableKBtn[][]): Markup<ReplyKeyboardMarkup>
export function keyboard(
  buttons: HideableKBtn[],
  options?: Partial<KeyboardBuildingOptions<HideableKBtn>>
): Markup<ReplyKeyboardMarkup>
export function keyboard(
  buttons: HideableKBtn[] | HideableKBtn[][],
  options?: Partial<KeyboardBuildingOptions<HideableKBtn>>
): Markup<ReplyKeyboardMarkup> {
  const keyboard = buildKeyboard(buttons, {
    columns: 1,
    ...options,
  })
  return new Markup<ReplyKeyboardMarkup>({ keyboard })
}

export function inlineKeyboard(
  buttons: HideableIKBtn[][]
): Markup<InlineKeyboardMarkup>
export function inlineKeyboard(
  buttons: HideableIKBtn[],
  options?: Partial<KeyboardBuildingOptions<HideableIKBtn>>
): Markup<InlineKeyboardMarkup>
export function inlineKeyboard(
  buttons: HideableIKBtn[] | HideableIKBtn[][],
  options?: Partial<KeyboardBuildingOptions<HideableIKBtn>>
): Markup<InlineKeyboardMarkup> {
  const inlineKeyboard = buildKeyboard(buttons, {
    columns: buttons.length,
    ...options,
  })
  return new Markup<InlineKeyboardMarkup>({ inline_keyboard: inlineKeyboard })
}

interface KeyboardBuildingOptions<B extends HideableKBtn | HideableIKBtn> {
  wrap?: (btn: B, index: number, currentRow: B[]) => boolean
  columns: number
}

function buildKeyboard<B extends HideableKBtn | HideableIKBtn>(
  buttons: B[] | B[][],
  options: KeyboardBuildingOptions<B>
): B[][] {
  const result: B[][] = []
  if (!Array.isArray(buttons)) {
    return result
  }
  if (is2D(buttons)) {
    return buttons.map((row) => row.filter((button) => !button.hide))
  }
  const wrapFn =
    options.wrap !== undefined
      ? options.wrap
      : (_btn: B, _index: number, currentRow: B[]) =>
          currentRow.length >= options.columns
  let currentRow = []
  let index = 0
  for (const btn of buttons.filter((button) => !button.hide)) {
    if (wrapFn(btn, index, currentRow) && currentRow.length > 0) {
      result.push(currentRow)
      currentRow = []
    }
    currentRow.push(btn)
    index++
  }
  if (currentRow.length > 0) {
    result.push(currentRow)
  }
  return result
}
