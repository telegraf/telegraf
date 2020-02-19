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
    const chars = ['', ...text.split(''), ''].map(escapeHTMLChar)
    entities.forEach(entity => {
      const tag = getHTMLTag(entity)
      const openPos = entity.offset
      const closePos = entity.offset + entity.length + 1
      chars[openPos] += tag.open
      chars[closePos] = tag.close + chars[closePos]
    })
    return chars.join('')
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

function escapeHTMLChar (c) {
  switch (c) {
    case '&': return '&amp;'
    case '"': return '&quot;'
    case '\'': return '&#39;'
    case '<': return '&lt;'
    default : return c
  }
}

function tag (name, params) {
  return {
    open: params
      ? `<${name} ${Object.entries(params).map(([key, value]) => `${key}="${value.replace(/[<&"]/g, escapeHTMLChar)}"`).join(' ')}>`
      : `<${name}>`,
    close: `</${name}>`
  }
}

const HTMLTags = new Map([
  ['bold', tag('b')],
  ['italic', tag('i')],
  ['code', tag('code')],
  ['pre', tag('pre')],
  ['strikethrough', tag('s')],
  ['underline', tag('u')],
  ['text_link', ({ url }) => tag('a', { href: url })],
  ['text_mention', ({ user }) => tag('a', { href: `tg://user?id=${user.id}` })]
])

function getHTMLTag (entity) {
  const tag = HTMLTags.get(entity.type || 'unknown')
  if (!tag) return { open: '', close: '' }
  return typeof tag === 'function' ? tag(entity) : tag
}

module.exports = Markup
