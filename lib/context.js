const Telegram = require('./telegram')
const platform = require('./platform')
const Extra = require('./extra')

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
      (this.editedMessage && this.editedMessage.chat) ||
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

  answerCallbackQuery (...args) {
    if (!this.callbackQuery) {
      throw new Error(`answerCallbackQuery is not available for ${this.updateType}`)
    }
    return this.telegram.answerCallbackQuery(this.callbackQuery.id, ...args)
  }

  answerInlineQuery (...args) {
    if (!this.inlineQuery) {
      throw new Error(`answerInlineQuery is not available for ${this.updateType}`)
    }
    return this.telegram.answerInlineQuery(this.inlineQuery.id, ...args)
  }

  editMessageText (text, extra) {
    if (!this.callbackQuery) {
      throw new Error(`editMessageText is not available for ${this.updateType}`)
    }
    return this.callbackQuery.message
      ? this.telegram.editMessageText(this.chat.id, this.callbackQuery.message.message_id, undefined, text, extra)
      : this.telegram.editMessageText(undefined, undefined, this.callbackQuery.inline_message_id, text, extra)
  }

  editMessageCaption (caption, markup) {
    if (!this.callbackQuery) {
      throw new Error(`editMessageCaption is not available for ${this.updateType}`)
    }
    return this.callbackQuery.message
      ? this.telegram.editMessageCaption(this.chat.id, this.callbackQuery.message.message_id, undefined, caption, markup)
      : this.telegram.editMessageCaption(undefined, undefined, this.callbackQuery.inline_message_id, caption, markup)
  }

  editMessageReplyMarkup (markup) {
    if (!this.callbackQuery) {
      throw new Error(`editMessageReplyMarkup is not available for ${this.updateType}`)
    }
    return this.callbackQuery.message
      ? this.telegram.editMessageReplyMarkup(this.chat.id, this.callbackQuery.message.message_id, undefined, markup)
      : this.telegram.editMessageReplyMarkup(undefined, undefined, this.callbackQuery.inline_message_id, markup)
  }

  reply (...args) {
    if (!this.chat) {
      throw new Error(`reply is not available for ${this.updateType}`)
    }
    return this.telegram.sendMessage(this.chat.id, ...args)
  }

  getChat (...args) {
    if (!this.chat) {
      throw new Error(`getChat is not available for ${this.updateType}`)
    }
    return this.telegram.getChat(this.chat.id, ...args)
  }

  leaveChat (...args) {
    if (!this.chat) {
      throw new Error(`leaveChat is not available for ${this.updateType}`)
    }
    return this.telegram.leaveChat(this.chat.id, ...args)
  }

  getChatAdministrators (...args) {
    if (!this.chat) {
      throw new Error(`getChatAdministrators is not available for ${this.updateType}`)
    }
    return this.telegram.getChatAdministrators(this.chat.id, ...args)
  }

  getChatMember (...args) {
    if (!this.chat) {
      throw new Error(`getChatMember is not available for ${this.updateType}`)
    }
    return this.telegram.getChatMember(this.chat.id, ...args)
  }

  getChatMembersCount (...args) {
    if (!this.chat) {
      throw new Error(`getChatMembersCount is not available for ${this.updateType}`)
    }
    return this.telegram.getChatMembersCount(this.chat.id, ...args)
  }

  replyWithPhoto (...args) {
    if (!this.chat) {
      throw new Error(`replyWithPhoto is not available for ${this.updateType}`)
    }
    return this.telegram.sendPhoto(this.chat.id, ...args)
  }

  replyWithAudio (...args) {
    if (!this.chat) {
      throw new Error(`replyWithAudio is not available for ${this.updateType}`)
    }
    return this.telegram.sendAudio(this.chat.id, ...args)
  }

  replyWithDocument (...args) {
    if (!this.chat) {
      throw new Error(`replyWithDocument is not available for ${this.updateType}`)
    }
    return this.telegram.sendDocument(this.chat.id, ...args)
  }

  replyWithSticker (...args) {
    if (!this.chat) {
      throw new Error(`replyWithSticker is not available for ${this.updateType}`)
    }
    return this.telegram.sendSticker(this.chat.id, ...args)
  }

  replyWithVideo (...args) {
    if (!this.chat) {
      throw new Error(`replyWithVideo is not available for ${this.updateType}`)
    }
    return this.telegram.sendVideo(this.chat.id, ...args)
  }

  replyWithVoice (...args) {
    if (!this.chat) {
      throw new Error(`replyWithVoice is not available for ${this.updateType}`)
    }
    return this.telegram.sendVoice(this.chat.id, ...args)
  }

  replyWithChatAction (...args) {
    if (!this.chat) {
      throw new Error(`replyWithChatAction is not available for ${this.updateType}`)
    }
    return this.telegram.sendChatAction(this.chat.id, ...args)
  }

  replyWithLocation (...args) {
    if (!this.chat) {
      throw new Error(`replyWithLocation is not available for ${this.updateType}`)
    }
    return this.telegram.sendLocation(this.chat.id, ...args)
  }

  replyWithVenue (...args) {
    if (!this.chat) {
      throw new Error(`replyWithVenue is not available for ${this.updateType}`)
    }
    return this.telegram.sendVenue(this.chat.id, ...args)
  }

  replyWithContact (...args) {
    if (!this.chat) {
      throw new Error(`replyWithContact is not available for ${this.updateType}`)
    }
    return this.telegram.sendContact(this.chat.id, ...args)
  }

  replyWithMarkdown (markdown, extra) {
    return this.reply(markdown, Extra.load(extra).markdown())
  }

  replyWithHTML (html, extra) {
    return this.reply(html, Extra.load(extra).HTML())
  }
}

module.exports = TelegrafContext
