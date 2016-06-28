const ReplyMarkup = require('./reply-markup')

class SendOptions {

  load (opts) {
    if (!opts) {
      return
    }
    for (var key of Object.keys(opts)) {
      this[key] = opts[key]
    }
    return this
  }

  inReplyTo (messageId) {
    this.reply_to_message_id = messageId
    return this
  }

  notifications (value = true) {
    this.disable_notification = !value
    return this
  }

  webPreview (value = true) {
    this.disable_web_page_preview = !value
    return this
  }

  markup (markup) {
    this.reply_markup = Object.assign({}, markup)
    return this
  }

  HTML () {
    this.parse_mode = 'HTML'
    return this
  }

  markdown () {
    this.parse_mode = 'Markdown'
    return this
  }
}

SendOptions.inReplyTo = function (messageId) {
  return new SendOptions().inReplyTo(messageId)
}

SendOptions.notifications = function (value) {
  return new SendOptions().notifications(value)
}

SendOptions.webPreview = function (value) {
  return new SendOptions().webPreview(value)
}

SendOptions.load = function (opts) {
  return new SendOptions().load(opts)
}

SendOptions.markup = function (markup) {
  return new SendOptions().markup(markup)
}

SendOptions.HTML = function () {
  return new SendOptions().HTML()
}

SendOptions.markdown = function () {
  return new SendOptions().markdown()
}

SendOptions.ReplyMarkup = ReplyMarkup

module.exports = SendOptions
