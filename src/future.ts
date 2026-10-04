import { ReplyParameters } from '@telegraf/types'
import Context from './context'
import { Middleware } from './middleware'

type ReplyContext = { [key in keyof Context & `reply${string}`]: Context[key] }

function makeReply<
  C extends Context,
  E extends { reply_parameters?: ReplyParameters },
>(ctx: C, extra?: E) {
  if (ctx.msgId)
    return {
      // overrides in this order so user can override all properties
      reply_parameters: {
        message_id: ctx.msgId,
        ...extra?.reply_parameters,
      },
      ...extra,
    }
  else return extra
}

const replyContext: ReplyContext = {
  replyWithChatAction: function () {
    throw new TypeError(
      'ctx.replyWithChatAction has been removed, use ctx.sendChatAction instead'
    )
  },
  reply(this: Context, text, extra) {
    this.assert(this.chat, 'reply')
    return this.sendMessage(text, makeReply(this, extra))
  },
  replyWithAnimation(this: Context, animation, extra) {
    this.assert(this.chat, 'replyWithAnimation')
    return this.sendAnimation(animation, makeReply(this, extra))
  },
  replyWithAudio(this: Context, audio, extra) {
    this.assert(this.chat, 'replyWithAudio')
    return this.sendAudio(audio, makeReply(this, extra))
  },
  replyWithContact(this: Context, phoneNumber, firstName, extra) {
    this.assert(this.chat, 'replyWithContact')
    return this.sendContact(phoneNumber, firstName, makeReply(this, extra))
  },
  replyWithDice(this: Context, extra) {
    this.assert(this.chat, 'replyWithDice')
    return this.sendDice(makeReply(this, extra))
  },
  replyWithDocument(this: Context, document, extra) {
    this.assert(this.chat, 'replyWithDocument')
    return this.sendDocument(document, makeReply(this, extra))
  },
  replyWithGame(this: Context, gameName, extra) {
    this.assert(this.chat, 'replyWithGame')
    return this.sendGame(gameName, makeReply(this, extra))
  },
  replyWithHTML(this: Context, html, extra) {
    this.assert(this.chat, 'replyWithHTML')
    return this.sendMessage(html, {
      parse_mode: 'HTML',
      ...makeReply(this, extra),
    })
  },
  replyWithInvoice(this: Context, invoice, extra) {
    this.assert(this.chat, 'replyWithInvoice')
    return this.sendInvoice(invoice, makeReply(this, extra))
  },
  replyWithLocation(this: Context, latitude, longitude, extra) {
    this.assert(this.chat, 'replyWithLocation')
    return this.sendLocation(latitude, longitude, makeReply(this, extra))
  },
  replyWithMarkdown(this: Context, markdown, extra) {
    this.assert(this.chat, 'replyWithMarkdown')
    return this.sendMessage(markdown, {
      parse_mode: 'Markdown',
      ...makeReply(this, extra),
    })
  },
  replyWithMarkdownV2(this: Context, markdown, extra) {
    this.assert(this.chat, 'replyWithMarkdownV2')
    return this.sendMessage(markdown, {
      parse_mode: 'MarkdownV2',
      ...makeReply(this, extra),
    })
  },
  replyWithMediaGroup(this: Context, media, extra) {
    this.assert(this.chat, 'replyWithMediaGroup')
    return this.sendMediaGroup(media, makeReply(this, extra))
  },
  replyWithPhoto(this: Context, photo, extra) {
    this.assert(this.chat, 'replyWithPhoto')
    return this.sendPhoto(photo, makeReply(this, extra))
  },
  replyWithPoll(this: Context, question, options, extra) {
    this.assert(this.chat, 'replyWithPoll')
    return this.sendPoll(question, options, makeReply(this, extra))
  },
  replyWithRichMessage(this: Context, richMessage, extra) {
    this.assert(this.chat, 'replyWithRichMessage')
    return this.sendRichMessage(richMessage, makeReply(this, extra))
  },
  replyWithLivePhoto(this: Context, photo, livePhoto, extra) {
    this.assert(this.chat, 'replyWithLivePhoto')
    return this.sendLivePhoto(photo, livePhoto, makeReply(this, extra))
  },
  replyWithQuiz(this: Context, question, options, extra) {
    this.assert(this.chat, 'replyWithQuiz')
    return this.sendQuiz(question, options, makeReply(this, extra))
  },
  replyWithSticker(this: Context, sticker, extra) {
    this.assert(this.chat, 'replyWithSticker')
    return this.sendSticker(sticker, makeReply(this, extra))
  },
  replyWithVenue(this: Context, latitude, longitude, title, address, extra) {
    this.assert(this.chat, 'replyWithVenue')
    return this.sendVenue(
      latitude,
      longitude,
      title,
      address,
      makeReply(this, extra)
    )
  },
  replyWithVideo(this: Context, video, extra) {
    this.assert(this.chat, 'replyWithVideo')
    return this.sendVideo(video, makeReply(this, extra))
  },
  replyWithVideoNote(this: Context, videoNote, extra) {
    this.assert(this.chat, 'replyWithVideoNote')
    return this.sendVideoNote(videoNote, makeReply(this, extra))
  },
  replyWithVoice(this: Context, voice, extra) {
    this.assert(this.chat, 'replyWithVoice')
    return this.sendVoice(voice, makeReply(this, extra))
  },
}

/**
 * Sets up Context to use the new reply methods.
 * This middleware makes `ctx.reply()` and `ctx.replyWith*()` methods will actually reply to the message they are replying to.
 * Use `ctx.sendMessage()` to send a message in chat without replying to it.
 *
 * If the message to reply is deleted, `reply()` will send a normal message.
 * If the update is not a message and we are unable to reply, `reply()` will send a normal message.
 */
export function useNewReplies<C extends Context>(): Middleware<C> {
  return (ctx, next) => {
    ctx.reply = replyContext.reply
    ctx.replyWithPhoto = replyContext.replyWithPhoto
    ctx.replyWithLivePhoto = replyContext.replyWithLivePhoto
    ctx.replyWithMediaGroup = replyContext.replyWithMediaGroup
    ctx.replyWithAudio = replyContext.replyWithAudio
    ctx.replyWithDice = replyContext.replyWithDice
    ctx.replyWithDocument = replyContext.replyWithDocument
    ctx.replyWithSticker = replyContext.replyWithSticker
    ctx.replyWithVideo = replyContext.replyWithVideo
    ctx.replyWithAnimation = replyContext.replyWithAnimation
    ctx.replyWithVideoNote = replyContext.replyWithVideoNote
    ctx.replyWithInvoice = replyContext.replyWithInvoice
    ctx.replyWithGame = replyContext.replyWithGame
    ctx.replyWithVoice = replyContext.replyWithVoice
    ctx.replyWithPoll = replyContext.replyWithPoll
    ctx.replyWithQuiz = replyContext.replyWithQuiz
    ctx.replyWithRichMessage = replyContext.replyWithRichMessage
    ctx.replyWithChatAction = replyContext.replyWithChatAction
    ctx.replyWithLocation = replyContext.replyWithLocation
    ctx.replyWithVenue = replyContext.replyWithVenue
    ctx.replyWithContact = replyContext.replyWithContact
    ctx.replyWithMarkdown = replyContext.replyWithMarkdown
    ctx.replyWithMarkdownV2 = replyContext.replyWithMarkdownV2
    ctx.replyWithHTML = replyContext.replyWithHTML
    return next()
  }
}
