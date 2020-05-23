class Markup {
  forceReply (value = true) {
    this.force_reply = value
    return this
  }

  removeKeyboard (value = true) {
    this.remove_keyboard = value
    return this
  }

  selective (value = true) {
    this.selective = value
    return this
  }

  extra (options) {
    return {
      reply_markup: { ...this },
      ...options
    }
  }

  keyboard (buttons, options) {
    const keyboard = buildKeyboard(buttons, { columns: 1, ...options })
    if (keyboard && keyboard.length > 0) {
      this.keyboard = keyboard
    }
    return this
  }

  resize (value = true) {
    this.resize_keyboard = value
    return this
  }

  oneTime (value = true) {
    this.one_time_keyboard = value
    return this
  }

  inlineKeyboard (buttons, options) {
    const keyboard = buildKeyboard(buttons, { columns: buttons.length, ...options })
    if (keyboard && keyboard.length > 0) {
      this.inline_keyboard = keyboard
    }
    return this
  }

  button (text, hide) {
    return Markup.button(text, hide)
  }

  contactRequestButton (text, hide) {
    return Markup.contactRequestButton(text, hide)
  }

  locationRequestButton (text, hide) {
    return Markup.locationRequestButton(text, hide)
  }

  urlButton (text, url, hide) {
    return Markup.urlButton(text, url, hide)
  }

  callbackButton (text, data, hide) {
    return Markup.callbackButton(text, data, hide)
  }

  switchToChatButton (text, value, hide) {
    return Markup.switchToChatButton(text, value, hide)
  }

  switchToCurrentChatButton (text, value, hide) {
    return Markup.switchToCurrentChatButton(text, value, hide)
  }

  gameButton (text, hide) {
    return Markup.gameButton(text, hide)
  }

  payButton (text, hide) {
    return Markup.payButton(text, hide)
  }

  loginButton (text, url, opts, hide) {
    return Markup.loginButton(text, url, opts, hide)
  }

  static removeKeyboard (value) {
    return new Markup().removeKeyboard(value)
  }

  static forceReply (value) {
    return new Markup().forceReply(value)
  }

  static keyboard (buttons, options) {
    return new Markup().keyboard(buttons, options)
  }

  static inlineKeyboard (buttons, options) {
    return new Markup().inlineKeyboard(buttons, options)
  }

  static resize (value = true) {
    return new Markup().resize(value)
  }

  static selective (value = true) {
    return new Markup().selective(value)
  }

  static oneTime (value = true) {
    return new Markup().oneTime(value)
  }

  static button (text, hide = false) {
    return { text: text, hide: hide }
  }

  static contactRequestButton (text, hide = false) {
    return { text: text, request_contact: true, hide: hide }
  }

  static locationRequestButton (text, hide = false) {
    return { text: text, request_location: true, hide: hide }
  }

  static pollRequestButton (text, type, hide = false) {
    return { text: text, request_poll: { type }, hide: hide }
  }

  static urlButton (text, url, hide = false) {
    return { text: text, url: url, hide: hide }
  }

  static callbackButton (text, data, hide = false) {
    return { text: text, callback_data: data, hide: hide }
  }

  static switchToChatButton (text, value, hide = false) {
    return { text: text, switch_inline_query: value, hide: hide }
  }

  static switchToCurrentChatButton (text, value, hide = false) {
    return { text: text, switch_inline_query_current_chat: value, hide: hide }
  }

  static gameButton (text, hide = false) {
    return { text: text, callback_game: {}, hide: hide }
  }

  static payButton (text, hide = false) {
    return { text: text, pay: true, hide: hide }
  }

  static loginButton (text, url, opts = {}, hide = false) {
    return {
      text: text,
      login_url: { ...opts, url: url },
      hide: hide
    }
  }

  static formatHTML (text = '', entities = []) {
    const chars = [...text]
    const available = [...entities]
    const opened = []
    const result = []
    const config = (entity) => [
      {
        condition: { type: 'bold' },
        openTag: '<b>',
        closeTag: '</b>'
      },
      {
        condition: { type: 'italic' },
        openTag: '<i>',
        closeTag: '</i>'
      },
      {
        condition: { type: 'code' },
        openTag: '<code>',
        closeTag: '</code>'
      },
      {
        condition: { type: 'pre', language: true },
        openTag: `<pre><code class="language-${entity.language}">`,
        closeTag: '</code></pre>'
      },
      {
        condition: { type: 'pre', language: false },
        openTag: '<pre>',
        closeTag: '</pre>'
      },
      {
        condition: { type: 'strikethrough' },
        openTag: '<s>',
        closeTag: '</s>'
      },
      {
        condition: { type: 'underline' },
        openTag: '<u>',
        closeTag: '</u>'
      },
      {
        condition: { type: 'text_mention' },
        openTag: `<a href="tg://user?id=${entity.user && entity.user.id}">`,
        closeTag: '</a>'
      },
      {
        condition: { type: 'text_link' },
        openTag: `<a href="${entity.url}">`,
        closeTag: '</a>'
      }
    ].find((item) => Object.entries(item.condition)
      .every(([key, value]) => typeof value === 'boolean'
        ? Boolean(entity[key]) === value
        : entity[key] === value))

    for (let offset = 0; offset < chars.length; offset++) {
      while (true) {
        const index = available.findIndex((entity) => entity.offset === offset)
        if (index === -1) {
          break
        }
        const entity = available[index]
        const { openTag } = config(entity)
        result.push(openTag)
        opened.unshift(entity)
        available.splice(index, 1)
      }

      result.push(chars[offset])

      while (true) {
        const index = opened.findIndex((entity) => entity.offset + entity.length - 1 === offset)
        if (index === -1) {
          break
        }
        const entity = opened[index]
        const { closeTag } = config(entity)
        result.push(closeTag)
        opened.splice(index, 1)
      }
    }
    return result.join('')
  }
}

function buildKeyboard (buttons, options) {
  const result = []
  if (!Array.isArray(buttons)) {
    return result
  }
  if (buttons.find(Array.isArray)) {
    return buttons.map(row => row.filter((button) => !button.hide))
  }
  const wrapFn = options.wrap
    ? options.wrap
    : (btn, index, currentRow) => currentRow.length >= options.columns
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

module.exports = Markup
