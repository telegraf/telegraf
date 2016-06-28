const Markup = require('./reply-markup')

class Extra {

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
    if (typeof markup === 'function') {
      markup = markup(new Markup())
    }
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

Extra.inReplyTo = function (messageId) {
  return new Extra().inReplyTo(messageId)
}

Extra.notifications = function (value) {
  return new Extra().notifications(value)
}

Extra.webPreview = function (value) {
  return new Extra().webPreview(value)
}

Extra.load = function (opts) {
  return new Extra().load(opts)
}

Extra.markup = function (markup) {
  return new Extra().markup(markup)
}

Extra.HTML = function () {
  return new Extra().HTML()
}

Extra.markdown = function () {
  return new Extra().markdown()
}

Extra.Markup = Markup

module.exports = Extra
