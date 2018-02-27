const test = require('ava')
const Telegraf = require('../')

const BaseTextMessage = {
  chat: { id: 1 },
  text: 'foo'
}

const UpdateTypes = [
  { type: 'shipping_query', prop: 'shippingQuery', update: { shipping_query: {} } },
  { type: 'message', prop: 'message', update: { message: BaseTextMessage } },
  { type: 'edited_message', prop: 'editedMessage', update: { edited_message: BaseTextMessage } },
  { type: 'callback_query', prop: 'callbackQuery', update: { callback_query: { message: BaseTextMessage } } },
  { type: 'inline_query', prop: 'inlineQuery', update: { inline_query: {} } },
  { type: 'channel_post', prop: 'channelPost', update: { channel_post: BaseTextMessage } },
  { type: 'pre_checkout_query', prop: 'preCheckoutQuery', update: { pre_checkout_query: {} } },
  { type: 'edited_channel_post', prop: 'editedChannelPost', update: { edited_channel_post: {} } },
  { type: 'chosen_inline_result', prop: 'chosenInlineResult', update: { chosen_inline_result: {} } }
]

UpdateTypes.forEach((update) => {
  test.cb('should provide update payload for ' + update.type, (t) => {
    const bot = new Telegraf()
    bot.on(update.type, (ctx) => {
      t.true(update.prop in ctx)
      t.true('telegram' in ctx)
      t.true('updateType' in ctx)
      t.true('chat' in ctx)
      t.true('from' in ctx)
      t.true('state' in ctx)
      t.is(ctx.updateType, update.type)
      t.end()
    })
    bot.handleUpdate(update.update)
  })
})

test.cb('should provide update payload for text', (t) => {
  const bot = new Telegraf()
  bot.on('text', (ctx) => {
    t.true('telegram' in ctx)
    t.true('updateType' in ctx)
    t.true('updateSubTypes' in ctx)
    t.true('chat' in ctx)
    t.true('from' in ctx)
    t.true('state' in ctx)
    t.is(ctx.updateType, 'message')
    t.end()
  })
  bot.handleUpdate({message: Object.assign({text: 'foo'}, BaseTextMessage)})
})

test.cb('should provide shortcuts for `message` update', (t) => {
  const bot = new Telegraf()
  bot.on('message', (ctx) => {
    t.true('reply' in ctx)
    t.true('replyWithPhoto' in ctx)
    t.true('replyWithMarkdown' in ctx)
    t.true('replyWithHTML' in ctx)
    t.true('replyWithAudio' in ctx)
    t.true('replyWithDocument' in ctx)
    t.true('replyWithInvoice' in ctx)
    t.true('replyWithSticker' in ctx)
    t.true('replyWithVideo' in ctx)
    t.true('replyWithVideoNote' in ctx)
    t.true('replyWithVoice' in ctx)
    t.true('replyWithChatAction' in ctx)
    t.true('replyWithLocation' in ctx)
    t.true('replyWithVenue' in ctx)
    t.true('replyWithContact' in ctx)
    t.true('replyWithGame' in ctx)
    t.true('replyWithMediaGroup' in ctx)
    t.true('kickChatMember' in ctx)
    t.true('promoteChatMember' in ctx)
    t.true('restrictChatMember' in ctx)
    t.true('getChat' in ctx)
    t.true('exportChatInviteLink' in ctx)
    t.true('setChatPhoto' in ctx)
    t.true('deleteChatPhoto' in ctx)
    t.true('setChatTitle' in ctx)
    t.true('setChatDescription' in ctx)
    t.true('pinChatMessage' in ctx)
    t.true('unpinChatMessage' in ctx)
    t.true('leaveChat' in ctx)
    t.true('getChatAdministrators' in ctx)
    t.true('getChatMember' in ctx)
    t.true('getChatMembersCount' in ctx)
    t.true('setChatStickerSet' in ctx)
    t.true('deleteChatStickerSet' in ctx)
    t.true('getStickerSet' in ctx)
    t.true('uploadStickerFile' in ctx)
    t.true('createNewStickerSet' in ctx)
    t.true('addStickerToSet' in ctx)
    t.true('setStickerPositionInSet' in ctx)
    t.true('deleteStickerFromSet' in ctx)
    t.true('editMessageLiveLocation' in ctx)
    t.true('stopMessageLiveLocation' in ctx)
    t.end()
  })
  bot.handleUpdate({message: BaseTextMessage})
})

test.cb('should provide shortcuts for `callback_query` update', (t) => {
  const bot = new Telegraf()
  bot.on('callback_query', (ctx) => {
    t.true('answerCbQuery' in ctx)
    t.true('reply' in ctx)
    t.true('replyWithMarkdown' in ctx)
    t.true('replyWithHTML' in ctx)
    t.true('replyWithPhoto' in ctx)
    t.true('replyWithAudio' in ctx)
    t.true('replyWithMediaGroup' in ctx)
    t.true('replyWithDocument' in ctx)
    t.true('replyWithInvoice' in ctx)
    t.true('replyWithSticker' in ctx)
    t.true('replyWithVideo' in ctx)
    t.true('replyWithVideoNote' in ctx)
    t.true('replyWithVoice' in ctx)
    t.true('replyWithChatAction' in ctx)
    t.true('replyWithLocation' in ctx)
    t.true('replyWithVenue' in ctx)
    t.true('replyWithContact' in ctx)
    t.true('kickChatMember' in ctx)
    t.true('promoteChatMember' in ctx)
    t.true('restrictChatMember' in ctx)
    t.true('getChat' in ctx)
    t.true('exportChatInviteLink' in ctx)
    t.true('setChatPhoto' in ctx)
    t.true('deleteChatPhoto' in ctx)
    t.true('setChatTitle' in ctx)
    t.true('setChatDescription' in ctx)
    t.true('pinChatMessage' in ctx)
    t.true('unpinChatMessage' in ctx)
    t.true('leaveChat' in ctx)
    t.true('getChatAdministrators' in ctx)
    t.true('getChatMember' in ctx)
    t.true('getChatMembersCount' in ctx)
    t.true('setChatStickerSet' in ctx)
    t.true('deleteChatStickerSet' in ctx)
    t.true('deleteMessage' in ctx)
    t.true('uploadStickerFile' in ctx)
    t.true('createNewStickerSet' in ctx)
    t.true('addStickerToSet' in ctx)
    t.true('setStickerPositionInSet' in ctx)
    t.true('deleteStickerFromSet' in ctx)
    t.true('editMessageLiveLocation' in ctx)
    t.true('stopMessageLiveLocation' in ctx)
    t.end()
  })
  bot.handleUpdate({callback_query: BaseTextMessage})
})

test.cb('should provide shortcuts for `shipping_query` update', (t) => {
  const bot = new Telegraf()
  bot.on('shipping_query', (ctx) => {
    t.true('answerShippingQuery' in ctx)
    t.end()
  })
  bot.handleUpdate({shipping_query: BaseTextMessage})
})

test.cb('should provide shortcuts for `pre_checkout_query` update', (t) => {
  const bot = new Telegraf()
  bot.on('pre_checkout_query', (ctx) => {
    t.true('answerPreCheckoutQuery' in ctx)
    t.end()
  })
  bot.handleUpdate({pre_checkout_query: BaseTextMessage})
})

test.cb('should provide chat and sender info', (t) => {
  const bot = new Telegraf()
  bot.on(['text', 'message'], (ctx) => {
    t.is(ctx.from.id, 42)
    t.is(ctx.chat.id, 1)
    t.end()
  })
  bot.handleUpdate({message: Object.assign({from: {id: 42}}, BaseTextMessage)})
})

test.cb('should provide shortcuts for `inline_query` update', (t) => {
  const bot = new Telegraf()
  bot.on('inline_query', (ctx) => {
    t.true('answerInlineQuery' in ctx)
    t.end()
  })
  bot.handleUpdate({inline_query: BaseTextMessage})
})

test.cb('should provide subtype for `channel_post` update', (t) => {
  const bot = new Telegraf('', { channelMode: true })
  bot.on('text', (ctx) => {
    t.is(ctx.channelPost.text, 'foo')
    t.end()
  })
  bot.handleUpdate({channel_post: BaseTextMessage})
})

test.cb('should share state', (t) => {
  const bot = new Telegraf()
  bot.on('message', (ctx, next) => {
    ctx.state.answer = 41
    return next()
  }, (ctx, next) => {
    ctx.state.answer++
    return next()
  }, (ctx) => {
    t.is(ctx.state.answer, 42)
    t.end()
  })
  bot.handleUpdate({message: BaseTextMessage})
})

test.cb('should work with context extensions', (t) => {
  const bot = new Telegraf()
  bot.context.db = {
    getUser: () => undefined
  }
  bot.on('message', (ctx) => {
    t.true('db' in ctx)
    t.true('getUser' in ctx.db)
    t.end()
  })
  bot.handleUpdate({message: BaseTextMessage})
})

test.cb('should handle webhook response', (t) => {
  const bot = new Telegraf()
  bot.on('message', async ({reply}) => {
    const result = await reply(':)')
    t.deepEqual(result, { webhook: true })
  })
  const res = {
    setHeader: () => undefined,
    end: () => t.end()
  }
  bot.handleUpdate({message: BaseTextMessage}, res)
})

const resStub = {
  setHeader: () => undefined,
  end: () => undefined
}

test.cb('should respect webhookReply option', (t) => {
  const bot = new Telegraf(null, {telegram: {webhookReply: false}})
  bot.catch((err) => { throw err }) // Disable log
  bot.on('message', ({ reply }) => reply(':)'))
  t.throws(bot.handleUpdate({message: BaseTextMessage}, resStub)).then(() => t.end())
})

test.cb('should respect webhookReply runtime change', (t) => {
  const bot = new Telegraf()
  bot.webhookReply = false
  bot.catch((err) => { throw err }) // Disable log
  bot.on('message', (ctx) => ctx.reply(':)'))

  // Throws cause Bot Token is required for http call'
  t.throws(bot.handleUpdate({message: BaseTextMessage}, resStub)).then(() => t.end())
})

test.cb('should respect webhookReply runtime change (per request)', (t) => {
  const bot = new Telegraf()
  bot.catch((err) => { throw err }) // Disable log
  bot.on('message', async (ctx) => {
    ctx.webhookReply = false
    return ctx.reply(':)')
  })
  t.throws(bot.handleUpdate({ message: BaseTextMessage }, resStub)).then(() => t.end())
})
