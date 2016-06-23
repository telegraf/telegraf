const Telegram = require('./telegram')
const platform = require('./platform')

class TelegrafContext {

  constructor (token, update, options) {
    this.telegramInstance = new Telegram(token, options.telegram)
    this.update = update
    this.contextState = {}
  }

  get telegram () {
    return this.telegramInstance
  }

  get updateType () {
    var type = ''
    platform.updateTypes.forEach((key) => {
      if (this.update[key]) {
        type = key
      }
    })
    return type
  }

  get updateSubType () {
    var subType = ''
    if (this.update.message) {
      platform.messageSubTypes.forEach((messageType) => {
        if (this.update.message[messageType]) {
          subType = messageType
        }
      })
    }
    return subType
  }

  get message () {
    return this.update.message
  }

  get editedMessage () {
    return this.update.edited_message
  }

  get inlineQuery () {
    return this.update.inline_query
  }

  get chosenInlineResult () {
    return this.update.chosen_inline_result
  }

  get callbackQuery () {
    return this.update.callback_query
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
    return this.contextState
  }

  set state (val) {
    this.contextState = Object.assign({}, val)
  }

  answerCallbackQuery () {
    if (!this.callbackQuery) {
      throw new Error(`answerCallbackQuery is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.callbackQuery.id)
    return this.telegram.answerCallbackQuery.apply(this.telegram, args)
  }

  answerInlineQuery () {
    if (!this.inlineQuery) {
      throw new Error(`answerInlineQuery is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.inlineQuery.id)
    return this.telegram.answerInlineQuery.apply(this.telegram, args)
  }

  reply () {
    if (!this.chat) {
      throw new Error(`reply is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.sendMessage.apply(this.telegram, args)
  }

  getChat () {
    if (!this.chat) {
      throw new Error(`getChat is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.getChat.apply(this.telegram, args)
  }

  leaveChat () {
    if (!this.chat) {
      throw new Error(`leaveChat is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.leaveChat.apply(this.telegram, args)
  }

  getChatAdministrators () {
    if (!this.chat) {
      throw new Error(`getChatAdministrators is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.getChatAdministrators.apply(this.telegram, args)
  }

  getChatMember () {
    if (!this.chat) {
      throw new Error(`getChatMember is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.getChatMember.apply(this.telegram, args)
  }

  getChatMembersCount () {
    if (!this.chat) {
      throw new Error(`getChatMembersCount is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.getChatMembersCount.apply(this.telegram, args)
  }

  replyWithPhoto () {
    if (!this.chat) {
      throw new Error(`replyWithPhoto is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.sendPhoto.apply(this.telegram, args)
  }

  replyWithAudio () {
    if (!this.chat) {
      throw new Error(`replyWithAudio is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.sendAudio.apply(this.telegram, args)
  }

  replyWithDocument () {
    if (!this.chat) {
      throw new Error(`replyWithDocument is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.sendDocument.apply(this.telegram, args)
  }

  replyWithSticker () {
    if (!this.chat) {
      throw new Error(`replyWithSticker is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.sendSticker.apply(this.telegram, args)
  }

  replyWithVideo () {
    if (!this.chat) {
      throw new Error(`replyWithVideo is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.sendVideo.apply(this.telegram, args)
  }

  replyWithVoice () {
    if (!this.chat) {
      throw new Error(`replyWithVoice is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.sendVoice.apply(this.telegram, args)
  }

  replyWithChatAction () {
    if (!this.chat) {
      throw new Error(`replyWithChatAction is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.sendChatAction.apply(this.telegram, args)
  }

  replyWithLocation () {
    if (!this.chat) {
      throw new Error(`replyWithLocation is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.sendLocation.apply(this.telegram, args)
  }

  replyWithVenue () {
    if (!this.chat) {
      throw new Error(`replyWithVenue is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.sendVenue.apply(this.telegram, args)
  }

  replyWithContact () {
    if (!this.chat) {
      throw new Error(`replyWithContact is not available for ${this.updateType}`)
    }
    var args = [].slice.call(arguments)
    args.unshift(this.chat.id)
    return this.telegram.sendContact.apply(this.telegram, args)
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
