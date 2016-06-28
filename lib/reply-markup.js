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

  keyboard (value, options) {
    const keyboard = generateKeyboard(value, Object.assign({columns: 1}, options))
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

  inlineKeyboard (value, options) {
    const keyboard = generateKeyboard(value, Object.assign({columns: value.length}, options))
    if (keyboard && keyboard.length > 0) {
      this.inline_keyboard = keyboard
    }
    return this
  }
}

function generateKeyboard (buttons, options) {
  const opts = Object.assign({
    wrap: (btn, index, currentRow) => currentRow.length >= opts.columns
  }, options)

  const result = []
  if (!buttons) {
    return result
  }
  var currentRow = []
  var index = 0
  for (const btn of buttons) {
    if (Array.isArray(btn)) {
      return buttons
    }
    if (opts.wrap(btn, index, currentRow)) {
      if (currentRow.length > 0) {
        result.push(currentRow)
      }
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

ReplyMarkup.hideKeyboard = function (value) {
  return new ReplyMarkup().hideKeyboard(value)
}

ReplyMarkup.forceReply = function (value) {
  return new ReplyMarkup().forceReply(value)
}

ReplyMarkup.keyboard = function (value, options) {
  return new ReplyMarkup().keyboard(value, options)
}

ReplyMarkup.inlineKeyboard = function (value, options) {
  return new ReplyMarkup().inlineKeyboard(value, options)
}

module.exports = ReplyMarkup
