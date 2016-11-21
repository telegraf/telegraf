require('should')
const test = require('ava')
const Telegraf = require('../')

const baseMessage = {
  chat: {
    id: 1
  }
}

const updateTypes = [
  { type: 'message', prop: 'message', update: { message: baseMessage } },
  { type: 'edited_message', prop: 'editedMessage', update: { edited_message: baseMessage } },
  { type: 'callback_query', prop: 'callbackQuery', update: { callback_query: { message: baseMessage } } },
  { type: 'inline_query', prop: 'inlineQuery', update: { inline_query: {} } },
  { type: 'channel_post', prop: 'channelPost', update: { channel_post: {} } },
  { type: 'edited_channel_post', prop: 'editedChannelPost', update: { edited_channel_post: {} } },
  { type: 'chosen_inline_result', prop: 'chosenInlineResult', update: { chosen_inline_result: {} } }
]

updateTypes.forEach((update) => {
  test.cb('should provide update payload for ' + update.type, (t) => {
    const app = new Telegraf()
    app.on(update.type, (ctx) => {
      ctx.should.have.property(update.prop)
      ctx.should.have.property('telegram')
      ctx.should.have.property('updateType')
      ctx.should.have.property('chat')
      ctx.should.have.property('from')
      ctx.should.have.property('state')
      ctx.updateType.should.be.equal(update.type)
      t.end()
    })
    app.handleUpdate(update.update)
  })
})

test.cb('should provide update payload for text', (t) => {
  const app = new Telegraf()
  app.on('text', (ctx) => {
    ctx.should.have.property('telegram')
    ctx.should.have.property('updateType')
    ctx.should.have.property('updateSubType')
    ctx.should.have.property('chat')
    ctx.should.have.property('from')
    ctx.should.have.property('state')
    ctx.updateType.should.be.equal('message')
    t.end()
  })
  app.handleUpdate({message: Object.assign({text: 'foo'}, baseMessage)})
})

test.cb('should provide shortcuts for `message` event', (t) => {
  const app = new Telegraf()
  app.on('message', (ctx) => {
    ctx.should.have.property('reply')
    ctx.should.have.property('replyWithPhoto')
    ctx.should.have.property('replyWithMarkdown')
    ctx.should.have.property('replyWithHTML')
    ctx.should.have.property('replyWithAudio')
    ctx.should.have.property('replyWithDocument')
    ctx.should.have.property('replyWithSticker')
    ctx.should.have.property('replyWithVideo')
    ctx.should.have.property('replyWithVoice')
    ctx.should.have.property('replyWithChatAction')
    ctx.should.have.property('replyWithLocation')
    ctx.should.have.property('replyWithVenue')
    ctx.should.have.property('replyWithContact')
    ctx.should.have.property('replyWithGame')
    ctx.should.have.property('getChat')
    ctx.should.have.property('leaveChat')
    ctx.should.have.property('getChatAdministrators')
    ctx.should.have.property('getChatMember')
    ctx.should.have.property('getChatMembersCount')
    t.end()
  })
  app.handleUpdate({message: baseMessage})
})

test.cb('should provide shortcuts for `callback_query` event', (t) => {
  const app = new Telegraf()
  app.on('callback_query', (ctx) => {
    ctx.should.have.property('answerCallbackQuery')
    ctx.should.have.property('reply')
    ctx.should.have.property('replyWithMarkdown')
    ctx.should.have.property('replyWithHTML')
    ctx.should.have.property('replyWithPhoto')
    ctx.should.have.property('replyWithAudio')
    ctx.should.have.property('replyWithDocument')
    ctx.should.have.property('replyWithSticker')
    ctx.should.have.property('replyWithVideo')
    ctx.should.have.property('replyWithVoice')
    ctx.should.have.property('replyWithChatAction')
    ctx.should.have.property('replyWithLocation')
    ctx.should.have.property('replyWithVenue')
    ctx.should.have.property('replyWithContact')
    ctx.should.have.property('getChat')
    ctx.should.have.property('leaveChat')
    ctx.should.have.property('getChatAdministrators')
    ctx.should.have.property('getChatMember')
    ctx.should.have.property('getChatMembersCount')
    t.end()
  })
  app.handleUpdate({callback_query: baseMessage})
})

test.cb('should provide chat and sender info', (t) => {
  const app = new Telegraf()
  app.on(['text', 'message'], (ctx) => {
    ctx.from.id.should.be.equal(42)
    ctx.chat.id.should.be.equal(1)
    t.end()
  })
  app.handleUpdate({message: Object.assign({from: {id: 42}}, baseMessage)})
})

test.cb('should provide shortcuts for `inline_query` event', (t) => {
  const app = new Telegraf()
  app.on('inline_query', (ctx) => {
    ctx.should.have.property('answerInlineQuery')
    t.end()
  })
  app.handleUpdate({inline_query: baseMessage})
})

test.cb('should share state', (t) => {
  const app = new Telegraf()
  app.on('message', (ctx, next) => {
    ctx.state.answer = 41
    return next()
  }, (ctx, next) => {
    ctx.state.answer++
    return next()
  }, (ctx) => {
    ctx.state.answer.should.be.equal(42)
    t.end()
  })
  app.handleUpdate({message: baseMessage})
})

test.cb('should work with context extensions', (t) => {
  const app = new Telegraf()
  app.context.db = {
    getUser: () => undefined
  }
  app.on('message', (ctx) => {
    ctx.should.have.property('db')
    ctx.db.should.have.property('getUser')
    t.end()
  })
  app.handleUpdate({message: baseMessage})
})

test.cb('should handle webhook response', (t) => {
  const app = new Telegraf()
  app.on('message', (ctx) => {
    ctx.reply(':)')
  })
  const res = {
    setHeader: () => undefined,
    end: () => t.end()
  }
  app.handleUpdate({message: baseMessage}, res)
})
