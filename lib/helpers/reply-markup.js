class ReplyMarkup {

  forceReply (value = true) {
    this.force_reply = value
    return this
  }

  hideKeyboard (value = true) {
    this.hide_keyboard = value
    return this
  }

  selective (value = true) {
    this.selective = value
    return this
  }

  extra () {
    return { reply_markup: Object.assign({}, this) }
  }

  keyboard (buttons, options) {
    const keyboard = buildKeyboard(buttons, Object.assign({columns: 1}, options))
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
    const keyboard = buildKeyboard(buttons, Object.assign({columns: buttons.length}, options))
    if (keyboard && keyboard.length > 0) {
      this.inline_keyboard = keyboard
    }
    return this
  }

  button (text, hide) {
    return ReplyMarkup.button(text, hide)
  }

  contactRequestButton (text, hide) {
    return ReplyMarkup.contactRequestButton(text, hide)
  }

  locationRequestButton (text, hide) {
    return ReplyMarkup.locationRequestButton(text, hide)
  }

  urlButton (text, url, hide) {
    return ReplyMarkup.urlButton(text, url, hide)
  }

  callbackButton (text, data, switchInlineQuery, hide) {
    return ReplyMarkup.callbackButton(text, data, switchInlineQuery, hide)
  }

  gameButton (text) {
    return ReplyMarkup.gameButton(text)
  }

  static hideKeyboard (value) {
    return new ReplyMarkup().hideKeyboard(value)
  }

  static forceReply (value) {
    return new ReplyMarkup().forceReply(value)
  }

  static keyboard (buttons, options) {
    return new ReplyMarkup().keyboard(buttons, options)
  }

  static inlineKeyboard (buttons, options) {
    return new ReplyMarkup().inlineKeyboard(buttons, options)
  }

  static resize (value = true) {
    return new ReplyMarkup().resize(value)
  }

  static oneTime (value = true) {
    return new ReplyMarkup().oneTime(value)
  }

  static button (text, hide) {
    return { text: text, hide: hide }
  }

  static contactRequestButton (text, hide) {
    return { text: text, request_contact: true, hide: hide }
  }

  static locationRequestButton (text, hide) {
    return { text: text, request_location: true, hide: hide }
  }

  static urlButton (text, url, hide) {
    return { text: text, url: url, hide: hide }
  }

  static callbackButton (text, data, switchInlineQuery, hide) {
    return { text: text, callback_data: data, switch_inline_query: switchInlineQuery, hide: hide }
  }

  static gameButton (text, hide) {
    return { text: text, callback_game: {}, hide: hide }
  }

  static cbButton (...args) {
    return ReplyMarkup.urlButton(...args)
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
  const opts = Object.assign({ wrap: (btn, index, currentRow) => currentRow.length >= opts.columns }, options)
  let currentRow = []
  let index = 0
  for (const btn of buttons.filter((button) => !button.hide)) {
    if (opts.wrap(btn, index, currentRow) && currentRow.length > 0) {
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

module.exports = ReplyMarkup
