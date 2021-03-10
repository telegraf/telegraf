import {
  ForceReply,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  KeyboardButton,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from './core/types/typegram'
import { is2D } from './core/helpers/check'

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
  ) {
    return new Markup<T>({ ...this.reply_markup, selective: value })
  }

  resize(this: Markup<ReplyKeyboardMarkup>, value = true) {
    return new Markup<ReplyKeyboardMarkup>({
      ...this.reply_markup,
      resize_keyboard: value,
    })
  }

  oneTime(this: Markup<ReplyKeyboardMarkup>, value = true) {
    return new Markup<ReplyKeyboardMarkup>({
      ...this.reply_markup,
      one_time_keyboard: value,
    })
  }
}

export * as button from './button'

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
