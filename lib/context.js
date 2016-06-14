const Telegram = require('./telegram')
const platform = require('./platform')

class TelegrafContext extends Telegram {

  constructor (token, update, webHookResponse) {
    super(token, {webHookResponse: webHookResponse})
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
    var args = [].slice.call(arguments)
    args.unshift(this.callbackQuery.id)
    return Telegram.prototype.answerCallbackQuery.apply(this, args)
  }

  answerInlineQuery () {
    if (!this.inlineQuery) {
      throw new Error(`answerInlineQuery is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.inlineQuery.id)
    return Telegram.prototype.answerInlineQuery.apply(this, args)
  }

  reply () {
    if (!this.chat) {
      throw new Error(`reply is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.sendMessage.apply(this, args)
  }

  getChat () {
    if (!this.chat) {
      throw new Error(`getChat is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.getChat.apply(this, args)
  }

  leaveChat () {
    if (!this.chat) {
      throw new Error(`leaveChat is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.leaveChat.apply(this, args)
  }

  getChatAdministrators () {
    if (!this.chat) {
      throw new Error(`getChatAdministrators is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.getChatAdministrators.apply(this, args)
  }

  getChatMember () {
    if (!this.chat) {
      throw new Error(`getChatMember is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.getChatMember.apply(this, args)
  }

  getChatMembersCount () {
    if (!this.chat) {
      throw new Error(`getChatMembersCount is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.getChatMembersCount.apply(this, args)
  }

  replyWithPhoto () {
    if (!this.chat) {
      throw new Error(`replyWithPhoto is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.sendPhoto.apply(this, args)
  }

  replyWithAudio () {
    if (!this.chat) {
      throw new Error(`replyWithAudio is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.sendAudio.apply(this, args)
  }

  replyWithDocument () {
    if (!this.chat) {
      throw new Error(`replyWithDocument is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.sendDocument.apply(this, args)
  }

  replyWithSticker () {
    if (!this.chat) {
      throw new Error(`replyWithSticker is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.sendSticker.apply(this, args)
  }

  replyWithVideo () {
    if (!this.chat) {
      throw new Error(`replyWithVideo is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.sendVideo.apply(this, args)
  }

  replyWithVoice () {
    if (!this.chat) {
      throw new Error(`replyWithVoice is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.sendVoice.apply(this, args)
  }

  replyWithChatAction () {
    if (!this.chat) {
      throw new Error(`replyWithChatAction is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.sendChatAction.apply(this, args)
  }

  replyWithLocation () {
    if (!this.chat) {
      throw new Error(`replyWithLocation is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.sendLocation.apply(this, args)
  }

  replyWithVenue () {
    if (!this.chat) {
      throw new Error(`replyWithVenue is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.sendVenue.apply(this, args)
  }

  replyWithContact () {
    if (!this.chat) {
      throw new Error(`replyWithContact is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return Telegram.prototype.sendContact.apply(this, args)
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
