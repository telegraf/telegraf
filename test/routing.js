require('should')
const test = require('ava')
const Telegraf = require('../')
const { Composer } = Telegraf

const baseMessage = { chat: { id: 1 } }

const topLevelUpdates = [
  { type: 'message', update: { message: baseMessage } },
  { type: 'edited_message', update: { edited_message: baseMessage } },
  { type: 'callback_query', update: { callback_query: { message: baseMessage } } },
  { type: 'inline_query', update: { inline_query: {} } },
  { type: 'chosen_inline_result', update: { chosen_inline_result: {} } }
]

topLevelUpdates.forEach((update) => {
  test.cb('should route ' + update.type, (t) => {
    const app = new Telegraf()
    app.on(update.type, (ctx) => {
      t.end()
    })
    app.handleUpdate(update.update)
  })
})

test.cb('should route many types', (t) => {
  const app = new Telegraf()
  app.on(['chosen_inline_result', 'message'], (ctx) => {
    t.end()
  })
  app.handleUpdate({inline_query: baseMessage})
  app.handleUpdate({message: baseMessage})
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

test.cb('should route sub types', (t) => {
  const app = new Telegraf()
  app.on('text', (ctx) => {
    t.end()
  })
  app.handleUpdate({message: Object.assign({voice: {}}, baseMessage)})
  app.handleUpdate({message: Object.assign({text: 'hello'}, baseMessage)})
})

test.cb('should handle tap', (t) => {
  const app = new Telegraf()
  app.use(Telegraf.tap(() => {
    t.end()
  }))
  app.handleUpdate({message: Object.assign({voice: {}}, baseMessage)})
})

const updateTypes = [
  'text',
  'audio',
  'document',
  'photo',
  'sticker',
  'video',
  'voice',
  'contact',
  'location',
  'venue',
  'new_chat_member',
  'left_chat_member',
  'new_chat_title',
  'new_chat_photo',
  'delete_chat_photo',
  'group_chat_created',
  'supergroup_chat_created',
  'channel_chat_created',
  'migrate_to_chat_id',
  'migrate_from_chat_id',
  'pinned_message'
]

updateTypes.forEach((update) => {
  test.cb('should route ' + update, (t) => {
    const app = new Telegraf()
    app.on(update, (ctx) => {
      t.end()
    })
    const message = Object.assign({}, baseMessage)
    message[update] = {}
    app.handleUpdate({message: message})
  })
})

test.cb('should support Composer instance as middleware', (t) => {
  const app = new Telegraf()
  const composer = new Composer()
  composer.on('text', (ctx) => {
    ctx.state.foo.should.be.equal('bar')
    t.end()
  })
  app.use((ctx, next) => {
    ctx.state.foo = 'bar'
    return next()
  }, composer)
  app.handleUpdate({message: Object.assign({text: 'hello'}, baseMessage)})
})

test.cb('should support Composer instance as handler', (t) => {
  const app = new Telegraf()
  const composer = new Composer()
  composer.on('text', (ctx) => {
    t.end()
  })
  app.on('text', composer)
  app.handleUpdate({message: Object.assign({text: 'hello'}, baseMessage)})
})
