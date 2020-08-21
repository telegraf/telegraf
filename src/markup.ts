import * as tt from '../typings/telegram-types'

interface SelectivedMarkup extends Omit<Markup, 'selective'> {
  selective: boolean
}

class Markup {
  force_reply?: boolean
  remove_keyboard?: boolean
  resize_keyboard?: boolean
  one_time_keyboard?: boolean
  inline_keyboard?: tt.InlineKeyboardButton[]
  forceReply(value = true) {
    this.force_reply = value
    return this
  }

  removeKeyboard(value = true) {
    this.remove_keyboard = value
    return this
  }

  selective(value = true) {
    const me = (this as unknown) as SelectivedMarkup
    me.selective = value
    return me
  }

  extra(options: Partial<tt.ExtraReplyMessage['reply_markup']> = {}) {
    return {
      reply_markup: { ...this },
      ...options,
    }
  }

  // confer https://github.com/telegraf/telegraf/issues/1076
  keyboard(buttons, options) {
    const keyboard = buildKeyboard(buttons, { columns: 1, ...options })
    if (keyboard && keyboard.length > 0) {
      this.keyboard = keyboard
    }
    return this
  }

  resize(value = true) {
    this.resize_keyboard = value
    return this
  }

  oneTime(value = true) {
    this.one_time_keyboard = value
    return this
  }

  // confer https://github.com/telegraf/telegraf/issues/1076
  inlineKeyboard(buttons, options) {
    const keyboard = buildKeyboard(buttons, {
      columns: buttons.length,
      ...options,
    })
    if (keyboard && keyboard.length > 0) {
      this.inline_keyboard = keyboard
    }
    return this
  }

  button(text: string, hide?: boolean) {
    return Markup.button(text, hide)
  }

  contactRequestButton(text: string, hide?: boolean) {
    return Markup.contactRequestButton(text, hide)
  }

  locationRequestButton(text: string, hide?: boolean) {
    return Markup.locationRequestButton(text, hide)
  }

  urlButton(text: string, url: string, hide?: boolean) {
    return Markup.urlButton(text, url, hide)
  }

  callbackButton(text: string, data: string, hide?: boolean) {
    return Markup.callbackButton(text, data, hide)
  }

  switchToChatButton(text: string, value: string, hide?: boolean) {
    return Markup.switchToChatButton(text, value, hide)
  }

  switchToCurrentChatButton(text: string, value: string, hide?: boolean) {
    return Markup.switchToCurrentChatButton(text, value, hide)
  }

  gameButton(text: string, hide?: boolean) {
    return Markup.gameButton(text, hide)
  }

  payButton(text: string, hide?: boolean) {
    return Markup.payButton(text, hide)
  }

  loginButton(
    text: string,
    url: string,
    opts?: {
      forward_text?: string
      bot_username?: string
      request_write_access?: boolean
    },
    hide?: boolean
  ) {
    return Markup.loginButton(text, url, opts, hide)
  }

  static removeKeyboard(value?: boolean) {
    return new Markup().removeKeyboard(value)
  }

  static forceReply(value?: boolean) {
    return new Markup().forceReply(value)
  }

  static keyboard(buttons, options) {
    return new Markup().keyboard(buttons, options)
  }

  static inlineKeyboard(buttons, options) {
    return new Markup().inlineKeyboard(buttons, options)
  }

  static resize(value = true) {
    return new Markup().resize(value)
  }

  static selective(value = true) {
    return new Markup().selective(value)
  }

  static oneTime(value = true) {
    return new Markup().oneTime(value)
  }

  static button(text: string, hide = false) {
    return { text: text, hide: hide }
  }

  static contactRequestButton(text: string, hide = false) {
    return { text: text, request_contact: true, hide: hide }
  }

  static locationRequestButton(text: string, hide = false) {
    return { text: text, request_location: true, hide: hide }
  }

  static pollRequestButton(
    text: string,
    type?: 'quiz' | 'regular',
    hide = false
  ) {
    return { text: text, request_poll: { type }, hide: hide }
  }

  static urlButton(text: string, url: string, hide = false) {
    return { text: text, url: url, hide: hide }
  }

  static callbackButton(text: string, data: string, hide = false) {
    return { text: text, callback_data: data, hide: hide }
  }

  static switchToChatButton(text: string, value: string, hide = false) {
    return { text: text, switch_inline_query: value, hide: hide }
  }

  static switchToCurrentChatButton(text: string, value: string, hide = false) {
    return { text: text, switch_inline_query_current_chat: value, hide: hide }
  }

  static gameButton(text: string, hide = false) {
    return { text: text, callback_game: {}, hide: hide }
  }

  static payButton(text: string, hide = false) {
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
  ) {
    return {
      text: text,
      login_url: { ...opts, url: url },
      hide: hide,
    }
  }

  static formatHTML(text = '', entities: tt.MessageEntity[] = []) {
    const chars = text
    const available = [...entities]
    const opened: tt.MessageEntity[] = []
    const result: string[] = []
    for (let offset = 0; offset < chars.length; offset++) {
      while (true) {
        const index = available.findIndex((entity) => entity.offset === offset)
        if (index === -1) {
          break
        }
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
            if (entity.language) {
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

      result.push(chars[offset])

      while (true) {
        const index = opened.findIndex(
          (entity) => entity.offset + entity.length - 1 === offset
        )
        if (index === -1) {
          break
        }
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
            if (entity.language) {
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

function buildKeyboard(
  buttons: any,
  options: any
): tt.InlineKeyboardButton[][] {
  const result: any = []
  if (!Array.isArray(buttons)) {
    return result
  }
  if (buttons.find(Array.isArray)) {
    return buttons.map((row) => row.filter((button) => !button.hide))
  }
  const wrapFn = options.wrap
    ? options.wrap
    : (
        btn: tt.InlineKeyboardButton,
        index: number,
        currentRow: tt.InlineKeyboardButton[]
      ) => currentRow.length >= options.columns
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

export = Markup
