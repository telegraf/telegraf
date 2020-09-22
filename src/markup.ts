import {
  ForceReply,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  KeyboardButton,
  MessageEntity,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from 'typegram'
import { is2D } from './util'

// functions for HTML tag escaping based on https://stackoverflow.com/a/5499821/
const tagsToEscape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
}
function escapeTag(tag: string): string {
  return tagsToEscape[tag as '&' | '<' | '>'] ?? tag
}
function escapeHTML(str: string): string {
  return str.replace(/[&<>]/g, escapeTag)
}

type Hideable<B> = B & { hide: boolean }
type HideableKBtn = Hideable<KeyboardButton>
type HideableIKBtn = Hideable<InlineKeyboardButton>

export class Markup<
  TMarkup extends
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply
> {
  private constructor(readonly reply_markup: TMarkup) {}

  selective<TMarkup extends ForceReply | ReplyKeyboardMarkup>(
    this: Markup<TMarkup>,
    value = true
  ) {
    this.reply_markup.selective = value
    return this
  }

  resize(this: Markup<ReplyKeyboardMarkup>, value = true) {
    this.reply_markup.resize_keyboard = value
    return this
  }

  oneTime(this: Markup<ReplyKeyboardMarkup>, value = true) {
    this.reply_markup.one_time_keyboard = value
    return this
  }

  static removeKeyboard() {
    return new Markup({ remove_keyboard: true })
  }

  static forceReply() {
    return new Markup({ force_reply: true })
  }

  static keyboard(
    buttons: HideableKBtn[] | HideableKBtn[][],
    options?: Partial<KeyboardBuildingOptions<HideableKBtn>>
  ) {
    const keyboard = buildKeyboard(buttons, {
      columns: 1,
      ...options,
    })
    return new Markup({ keyboard })
  }

  static inlineKeyboard(
    buttons: HideableIKBtn[] | HideableIKBtn[][],
    options?: Partial<KeyboardBuildingOptions<HideableIKBtn>>
  ) {
    const inlineKeyboard = buildKeyboard(buttons, {
      columns: buttons.length,
      ...options,
    })
    return new Markup({ inline_keyboard: inlineKeyboard })
  }

  static button(
    text: string,
    hide = false
  ): Hideable<KeyboardButton.CommonButton> {
    return { text: text, hide: hide }
  }

  static contactRequestButton(
    text: string,
    hide = false
  ): Hideable<KeyboardButton.RequestContactButton> {
    return { text: text, request_contact: true, hide: hide }
  }

  static locationRequestButton(
    text: string,
    hide = false
  ): Hideable<KeyboardButton.RequestLocationButton> {
    return { text: text, request_location: true, hide: hide }
  }

  static pollRequestButton(
    text: string,
    type?: 'quiz' | 'regular',
    hide = false
  ): Hideable<KeyboardButton.RequestPollButton> {
    return { text: text, request_poll: { type }, hide: hide }
  }

  static urlButton(
    text: string,
    url: string,
    hide = false
  ): Hideable<InlineKeyboardButton.UrlButton> {
    return { text: text, url: url, hide: hide }
  }

  static callbackButton(
    text: string,
    data: string,
    hide = false
  ): Hideable<InlineKeyboardButton.CallbackButton> {
    return { text: text, callback_data: data, hide: hide }
  }

  static switchToChatButton(
    text: string,
    value: string,
    hide = false
  ): Hideable<InlineKeyboardButton.SwitchInlineButton> {
    return { text: text, switch_inline_query: value, hide: hide }
  }

  static switchToCurrentChatButton(
    text: string,
    value: string,
    hide = false
  ): Hideable<InlineKeyboardButton.SwitchInlineCurrentChatButton> {
    return { text: text, switch_inline_query_current_chat: value, hide: hide }
  }

  static gameButton(
    text: string,
    hide = false
  ): Hideable<InlineKeyboardButton.GameButton> {
    return { text: text, callback_game: {}, hide: hide }
  }

  static payButton(
    text: string,
    hide = false
  ): Hideable<InlineKeyboardButton.PayButton> {
    return { text: text, pay: true, hide: hide }
  }

  static loginButton(
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
      text: text,
      login_url: { ...opts, url: url },
      hide: hide,
    }
  }

  static formatHTML(text = '', entities: MessageEntity[] = []) {
    const chars = text
    const available = [...entities]
    const opened: MessageEntity[] = []
    const result: string[] = []
    for (let offset = 0; offset < chars.length; offset++) {
      let index: number
      while (
        (index = available.findIndex((entity) => entity.offset === offset)) >= 0
      ) {
        const entity = available[index]
        switch (entity.type) {
          case 'bold':
            result.push('<b>')
            break
          case 'italic':
            result.push('<i>')
            break
          case 'code':
            result.push('<code>')
            break
          case 'pre':
            if (entity.language !== undefined) {
              result.push(`<pre><code class="language-${entity.language}">`)
            } else {
              result.push('<pre>')
            }
            break
          case 'strikethrough':
            result.push('<s>')
            break
          case 'underline':
            result.push('<u>')
            break
          case 'text_mention':
            result.push(`<a href="tg://user?id=${entity.user.id}">`)
            break
          case 'text_link':
            result.push(`<a href="${entity.url}">`)
            break
        }
        opened.unshift(entity)
        available.splice(index, 1)
      }

      result.push(escapeHTML(chars[offset]))

      while (
        (index = opened.findIndex(
          (entity) => entity.offset + entity.length - 1 === offset
        )) >= 0
      ) {
        const entity = opened[index]
        switch (entity.type) {
          case 'bold':
            result.push('</b>')
            break
          case 'italic':
            result.push('</i>')
            break
          case 'code':
            result.push('</code>')
            break
          case 'pre':
            if (entity.language !== undefined) {
              result.push('</code></pre>')
            } else {
              result.push('</pre>')
            }
            break
          case 'strikethrough':
            result.push('</s>')
            break
          case 'underline':
            result.push('</u>')
            break
          case 'text_mention':
          case 'text_link':
            result.push('</a>')
            break
        }
        opened.splice(index, 1)
      }
    }
    return result.join('')
  }
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
      : (btn: B, index: number, currentRow: B[]) =>
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

export default Markup
