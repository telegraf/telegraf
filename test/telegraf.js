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
      t.true(update.prop in ctx)
      t.true('telegram' in ctx)
      t.true('updateType' in ctx)
      t.true('chat' in ctx)
      t.true('from' in ctx)
      t.true('state' in ctx)
      t.is(ctx.updateType, update.type)
      t.end()
    })
    app.handleUpdate(update.update)
  })
})

test.cb('should provide update payload for text', (t) => {
  const app = new Telegraf()
  app.on('text', (ctx) => {
    t.true('telegram' in ctx)
    t.true('updateType' in ctx)
    t.true('updateSubType' in ctx)
    t.true('chat' in ctx)
    t.true('from' in ctx)
    t.true('state' in ctx)
    t.is(ctx.updateType, 'message')
    t.end()
  })
  app.handleUpdate({message: Object.assign({text: 'foo'}, baseMessage)})
})

test.cb('should provide shortcuts for `message` event', (t) => {
  const app = new Telegraf()
  app.on('message', (ctx) => {
    t.true('reply' in ctx)
    t.true('replyWithPhoto' in ctx)
    t.true('replyWithMarkdown' in ctx)
    t.true('replyWithHTML' in ctx)
    t.true('replyWithAudio' in ctx)
    t.true('replyWithDocument' in ctx)
    t.true('replyWithSticker' in ctx)
    t.true('replyWithVideo' in ctx)
    t.true('replyWithVoice' in ctx)
    t.true('replyWithChatAction' in ctx)
    t.true('replyWithLocation' in ctx)
    t.true('replyWithVenue' in ctx)
    t.true('replyWithContact' in ctx)
    t.true('replyWithGame' in ctx)
    t.true('getChat' in ctx)
    t.true('leaveChat' in ctx)
    t.true('getChatAdministrators' in ctx)
    t.true('getChatMember' in ctx)
    t.true('getChatMembersCount' in ctx)
    t.end()
  })
  app.handleUpdate({message: baseMessage})
})

test.cb('should provide shortcuts for `callback_query` event', (t) => {
  const app = new Telegraf()
  app.on('callback_query', (ctx) => {
    t.true('answerCallbackQuery' in ctx)
    t.true('reply' in ctx)
    t.true('replyWithMarkdown' in ctx)
    t.true('replyWithHTML' in ctx)
    t.true('replyWithPhoto' in ctx)
    t.true('replyWithAudio' in ctx)
    t.true('replyWithDocument' in ctx)
    t.true('replyWithSticker' in ctx)
    t.true('replyWithVideo' in ctx)
    t.true('replyWithVoice' in ctx)
    t.true('replyWithChatAction' in ctx)
    t.true('replyWithLocation' in ctx)
    t.true('replyWithVenue' in ctx)
    t.true('replyWithContact' in ctx)
    t.true('getChat' in ctx)
    t.true('leaveChat' in ctx)
    t.true('getChatAdministrators' in ctx)
    t.true('getChatMember' in ctx)
    t.true('getChatMembersCount' in ctx)
    t.end()
  })
  app.handleUpdate({callback_query: baseMessage})
})

test.cb('should provide chat and sender info', (t) => {
  const app = new Telegraf()
  app.on(['text', 'message'], (ctx) => {
    t.is(ctx.from.id, 42)
    t.is(ctx.chat.id, 1)
    t.end()
  })
  app.handleUpdate({message: Object.assign({from: {id: 42}}, baseMessage)})
})

test.cb('should provide shortcuts for `inline_query` event', (t) => {
  const app = new Telegraf()
  app.on('inline_query', (ctx) => {
    t.true('answerInlineQuery' in ctx)
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
    t.is(ctx.state.answer, 42)
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
    t.true('db' in ctx)
    t.true('getUser' in ctx.db)
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
