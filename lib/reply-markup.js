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
    this.keyboard = generateKeyboard(value, Object.assign({columns: 1}, options))
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
    this.inline_keyboard = generateKeyboard(value, Object.assign({columns: value.length}, options))
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
