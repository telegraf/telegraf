class ReplyMarkup {

  static inlineKeyboard (value, options) {
    return new ReplyMarkup().inlineKeyboard(value, options)
  }

  static hideKeyboard (value) {
    return new ReplyMarkup().hideKeyboard(value)
  }

  static forceReply (value) {
    return new ReplyMarkup().forceReply(value)
  }

  static keyboard (value, options) {
    return new ReplyMarkup().keyboard(value, options)
  }

  static button (text, hide) {
    return {
      text: text,
      hide: hide
    }
  }

  static contactRequestButton (text, hide) {
    return {
      text: text,
      request_contact: true,
      hide: hide
    }
  }

  static locationRequestButton (text, hide) {
    return {
      text: text,
      request_location: true,
      hide: hide
    }
  }

  static urlButton (text, url, hide) {
    return {
      text: text,
      url: url,
      hide: hide
    }
  }

  static callbackButton (text, data, switchInlineQuery, hide) {
    return {
      text: text,
      callback_data: data,
      switch_inline_query: switchInlineQuery,
      hide: hide
    }
  }

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

  keyboard (buttons, options) {
    const keyboard = generateKeyboard(buttons, Object.assign({columns: 1}, options))
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
    const keyboard = generateKeyboard(buttons, Object.assign({columns: buttons.length}, options))
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
}

function generateKeyboard (buttons, options) {
  const opts = Object.assign({
    wrap: (btn, index, currentRow) => currentRow.length >= opts.columns
  }, options)

  const result = []
  if (!buttons || !Array.isArray(buttons)) {
    return result
  }

  if (buttons.find((btn) => Array.isArray(btn))) {
    for (const group of buttons) {
      if (!Array.isArray(group)) {
        throw new Error('Invalid keyboard defifnition')
      }
      for (var i = group.length - 1; i >= 0; i--) {
        if (group[i].hide) {
          group.splice(i, 1)
        }
      }
    }
    return buttons
  }

  var currentRow = []
  var index = 0
  for (const btn of buttons) {
    if (btn.hide) {
      continue
    }
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
