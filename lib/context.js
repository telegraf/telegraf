const platform = require('./platform')

class TelegrafContext {

  /**
   * Initialize a new `Application`.
   * @param {string} token - Telegram token.
   * @param {object} options - Additional options.
   * @api public
   */
  constructor (telegraf, update) {
    this.telegraf = telegraf
    this._update = update
    this._state = {}
  }

  get updateType () {
    var type = ''
    platform.updateTypes.forEach((key) => {
      if (this._update[key]) {
        type = key
      }
    })
    return type
  }

  get updateSubType () {
    var subType = ''
    if (this._update.message) {
      platform.messageSubTypes.forEach((messageType) => {
        if (this._update.message[messageType]) {
          subType = messageType
        }
      })
    }
    return subType
  }

  get message () {
    return this._update.message
  }

  get editedMessage () {
    return this._update.edited_message
  }

  get inlineQuery () {
    return this._update.inline_query
  }

  get chosenInlineResult () {
    return this._update.chosen_inline_result
  }

  get callbackQuery () {
    return this._update.callback_query
  }

  get chat () {
    return (this.message && this.message.chat) ||
    (this.callbackQuery && this.callbackQuery.message && this.callbackQuery.message.chat)
  }

  get from () {
    return (this.message && this.message.from) ||
    (this.editedMessage && this.editedMessage.from) ||
    (this.callbackQuery && this.callbackQuery.from) ||
    (this.inlineQuery && this.inlineQuery.from) ||
    (this.chosenInlineResult && this.chosenInlineResult.from)
  }

  get state () {
    return this._state
  }

  set state (val) {
    this._state = Object.assign({}, val)
  }

  answerCallbackQuery () {
    if (!this.callbackQuery) {
      throw new Error(`answerCallbackQuery is not available for ${this.updateType}`)
    }
    return this.answerCallbackQuery(this.callbackQuery.id)
  }

  answerInlineQuery () {
    if (!this.inlineQuery) {
      throw new Error(`answerInlineQuery is not available for ${this.updateType}`)
    }
    return this.answerInlineQuery(this.inlineQuery.id)
  }

  reply () {
    if (!this.chat) {
      throw new Error(`reply is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.sendMessage.apply(this.telegraf, args)
  }

  getChat () {
    if (!this.chat) {
      throw new Error(`getChat is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.getChat.apply(this.telegraf, args)
  }

  leaveChat () {
    if (!this.chat) {
      throw new Error(`leaveChat is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.leaveChat.apply(this.telegraf, args)
  }

  getChatAdministrators () {
    if (!this.chat) {
      throw new Error(`getChatAdministrators is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.getChatAdministrators.apply(this.telegraf, args)
  }

  getChatMember () {
    if (!this.chat) {
      throw new Error(`getChatMember is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.getChatMember.apply(this.telegraf, args)
  }

  getChatMembersCount () {
    if (!this.chat) {
      throw new Error(`getChatMembersCount is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.getChatMembersCount.apply(this.telegraf, args)
  }

  replyWithPhoto () {
    if (!this.chat) {
      throw new Error(`replyWithPhoto is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.sendPhoto.apply(this.telegraf, args)
  }

  replyWithAudio () {
    if (!this.chat) {
      throw new Error(`replyWithAudio is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.sendAudio.apply(this.telegraf, args)
  }

  replyWithDocument () {
    if (!this.chat) {
      throw new Error(`replyWithDocument is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.sendDocument.apply(this.telegraf, args)
  }

  replyWithSticker () {
    if (!this.chat) {
      throw new Error(`replyWithSticker is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.sendSticker.apply(this.telegraf, args)
  }

  replyWithVideo () {
    if (!this.chat) {
      throw new Error(`replyWithVideo is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.sendVideo.apply(this.telegraf, args)
  }

  replyWithVoice () {
    if (!this.chat) {
      throw new Error(`replyWithVoice is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.sendVoice.apply(this.telegraf, args)
  }

  replyWithChatAction () {
    if (!this.chat) {
      throw new Error(`replyWithChatAction is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.sendChatAction.apply(this.telegraf, args)
  }

  replyWithLocation () {
    if (!this.chat) {
      throw new Error(`replyWithLocation is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.sendLocation.apply(this.telegraf, args)
  }

  replyWithVenue () {
    if (!this.chat) {
      throw new Error(`replyWithVenue is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.sendVenue.apply(this.telegraf, args)
  }

  replyWithContact () {
    if (!this.chat) {
      throw new Error(`replyWithContact is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegraf.sendContact.apply(this.telegraf, args)
  }

  replyWithMarkdown (markdown, extra) {
    return this.reply(markdown, Object.assign({ parse_mode: 'Markdown' }, extra))
  }

  replyWithHTML (html, extra) {
    return this.reply(html, Object.assign({ parse_mode: 'HTML' }, extra))
  }
}

/**
 * Expose `TelegrafContext`.
 */
module.exports = TelegrafContext
