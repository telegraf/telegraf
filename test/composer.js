const test = require('ava')
const { Composer, Telegraf } = require('../')

function createBot (...args) {
  const bot = new Telegraf(...args)
  bot.botInfo = { id: 8, is_bot: true, username: 'bot', first_name: 'Bot' }
  return bot
}

const baseMessage = { chat: { id: 1, type: 'private' }, from: { id: 42, username: 'telegraf' } }
const baseGroupMessage = { chat: { id: 1, type: 'group' } }

const topLevelUpdates = [
  { type: 'message', update: { message: baseMessage } },
  { type: 'edited_message', update: { edited_message: baseMessage } },
  { type: 'callback_query', update: { callback_query: { message: baseMessage } } },
  { type: 'inline_query', update: { inline_query: {} } },
  { type: 'channel_post', update: { channel_post: {} } },
  { type: 'edited_channel_post', update: { edited_channel_post: {} } },
  { type: 'chosen_inline_result', update: { chosen_inline_result: {} } },
  { type: 'poll', update: { poll: {} } }
]

topLevelUpdates.forEach((update) => {
  test.cb('should route ' + update.type, (t) => {
    const bot = createBot()
    bot.on(update.type, () => t.end())
    bot.handleUpdate(update.update)
  })
})

test.cb('should route many types', (t) => {
  const bot = createBot()
  bot.on(['chosen_inline_result', 'message'], () => t.end())
  bot.handleUpdate({ inline_query: baseMessage })
  bot.handleUpdate({ message: baseMessage })
})

test.cb('should route sub types', (t) => {
  const bot = createBot()
  bot.on('text', () => t.end())
  bot.handleUpdate({ message: { voice: {}, ...baseMessage } })
  bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
})

const updateTypes = [
  'voice',
  'video_note',
  'video',
  'animation',
  'venue',
  'text',
  'supergroup_chat_created',
  'successful_payment',
  'sticker',
  'pinned_message',
  'photo',
  'new_chat_title',
  'new_chat_photo',
  'new_chat_members',
  'migrate_to_chat_id',
  'migrate_from_chat_id',
  'location',
  'left_chat_member',
  'invoice',
  'group_chat_created',
  'game',
  'dice',
  'document',
  'delete_chat_photo',
  'contact',
  'channel_chat_created',
  'audio',
  'poll'
]

updateTypes.forEach((update) => {
  test.cb('should route update type: ' + update, (t) => {
    const bot = createBot()
    bot.on(update, (ctx) => {
      t.end()
    })
    const message = { ...baseMessage }
    message[update] = {}
    bot.handleUpdate({ message: message })
  })
})

test.cb('should route venue', (t) => {
  const bot = createBot()
  bot.on('venue', () => t.end())
  const message = { location: {}, venue: { title: 'location', address: 'n/a' }, ...baseMessage }
  bot.handleUpdate({ message: message })
})

test.cb('should route location', (t) => {
  const bot = createBot()
  bot.on('venue', (ctx) => {
    t.true(ctx.updateSubTypes.includes('venue'))
    t.true(ctx.updateSubTypes.includes('location'))
    t.end()
  })
  const message = { location: {}, venue: { title: 'location', address: 'n/a' }, ...baseMessage }
  bot.handleUpdate({ message: message })
})

test.cb('should route forward', (t) => {
  const bot = createBot()
  bot.on('forward', (ctx) => {
    t.true(ctx.updateSubTypes.includes('forward'))
    t.end()
  })
  const message = {
    forward_date: 1460829948,
    ...baseMessage
  }
  bot.handleUpdate({ message: message })
})

test('should throw error then called with undefined middleware', (t) => {
  const composer = new Composer()
  t.throws(() => {
    composer.compose(() => undefined)
  })
})

test('should throw error then called with invalid middleware', (t) => {
  const bot = createBot()
  t.throws(() => {
    bot.on('text', 'foo')
  })
})

test.cb('should throw error then "next()" called twice', (t) => {
  const bot = createBot()
  bot.catch((e) => t.end())
  bot.use((ctx, next) => {
    next()
    return next()
  })
  bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
})

test.cb('should throw error then "next()" called with wrong context', (t) => {
  const bot = createBot()
  bot.catch((e) => t.end())
  bot.use((ctx, next) => next('bad context'))
  bot.hears('hello', () => t.fail())
  bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
})

test('should throw error then called with undefined trigger', (t) => {
  const bot = createBot()
  t.throws(() => {
    bot.hears(['foo', null])
  })
})

test.cb('should support Composer instance as middleware', (t) => {
  const bot = createBot()
  const composer = new Composer()
  composer.on('text', (ctx) => {
    t.is('bar', ctx.state.foo)
    t.end()
  })
  bot.use(({ state }, next) => {
    state.foo = 'bar'
    return next()
  }, composer)
  bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
})

test.cb('should support Composer instance as handler', (t) => {
  const bot = createBot()
  const composer = new Composer()
  composer.on('text', () => t.end())
  bot.on('text', composer)
  bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
})

test.cb('should handle text triggers', (t) => {
  const bot = createBot()
  bot.hears('hello world', () => t.end())
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('should handle fork', (t) => {
  const bot = createBot()
  bot.use(Telegraf.fork(() => t.end()))
  bot.handleUpdate({ message: { voice: {}, ...baseMessage } })
})

test.cb('Composer.branch should work with value', (t) => {
  const bot = createBot()
  bot.use(Composer.branch(true, () => t.end()))
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.branch should work with fn', (t) => {
  const bot = createBot()
  bot.use(Composer.branch((ctx) => false, null, () => t.end()))
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.branch should work with async fn', (t) => {
  const bot = createBot()
  bot.use(Composer.branch(
    (ctx) => {
      return new Promise((resolve) => setTimeout(resolve, 100, false))
    },
    () => {
      t.fail()
      t.end()
    },
    () => t.end())
  )
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.acl should work with user id', (t) => {
  const bot = createBot()
  bot.use(Composer.acl(42, () => t.end()))
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.acl should passthru', (t) => {
  const bot = createBot()
  bot.use(Composer.acl(42, Composer.passThru()))
  bot.use(() => t.end())
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.acl should not be false positive', (t) => {
  const bot = createBot()
  bot.use(Composer.acl(999, () => t.fail()))
  bot.use(() => t.end())
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.acl should work with user ids', (t) => {
  const bot = createBot()
  bot.use(Composer.acl([42, 43], () => t.end()))
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.acl should work with fn', (t) => {
  const bot = createBot()
  bot.use(Composer.acl((ctx) => ctx.from.username === 'telegraf', () => t.end()))
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.acl should work with async fn', (t) => {
  const bot = createBot()
  bot.use(Composer.acl((ctx) => new Promise((resolve) => setTimeout(resolve, 100, true)), () => t.end()))
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.optional should work with truthy value', (t) => {
  const bot = createBot()
  bot.use(Composer.optional(true, () => t.end()))
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.optional should work with false value', (t) => {
  const bot = createBot()
  bot.use(Composer.optional(false, () => {
    t.fail()
    t.end()
  }))
  bot.use(() => t.end())
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.optional should work with fn', (t) => {
  const bot = createBot()
  bot.use(Composer.optional((ctx) => true, () => t.end()))
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.optional should work with async fn', (t) => {
  const bot = createBot()
  bot.use(Composer.optional(
    (ctx) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(false)
        }, 100)
      })
    },
    () => {
      t.fail()
      t.end()
    }
  ))
  bot.use(() => t.end())
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.filter should work with fn', (t) => {
  const bot = createBot()
  bot.filter(({ message }) => message.text.length < 2)
  bot.use(() => t.end())
  bot.handleUpdate({ message: { text: '-', ...baseMessage } })
  bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
  bot.handleUpdate({ message: { text: 'hello world ', ...baseMessage } })
})

test.cb('Composer.filter should work with async fn', (t) => {
  const bot = createBot()
  bot.filter(({ message }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(message.text.length < 2)
      }, 100)
    })
  })
  bot.use(() => t.end())
  bot.handleUpdate({ message: { text: '-', ...baseMessage } })
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.drop should work with fn', (t) => {
  const bot = createBot()
  bot.drop(({ message }) => message.text.length > 2)
  bot.use(() => t.end())
  bot.handleUpdate({ message: { text: '-', ...baseMessage } })
  bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
  bot.handleUpdate({ message: { text: 'hello world ', ...baseMessage } })
})

test.cb('Composer.drop should work with async fn', (t) => {
  const bot = createBot()
  bot.drop(({ message }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(message.text.length > 2)
      }, 100)
    })
  })
  bot.use(() => t.end())
  bot.handleUpdate({ message: { text: '-', ...baseMessage } })
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.lazy should work with fn', (t) => {
  const bot = createBot()
  bot.use(Composer.lazy((ctx) => () => t.end()))
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.lazy should support middlewares', (t) => {
  const bot = createBot()
  bot.use(Composer.lazy((ctx) => (_, next) => next()))
  bot.use(() => t.end())
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.dispatch should work with handlers array', (t) => {
  const bot = createBot()
  bot.use(Composer.dispatch(1, [
    () => {
      t.fail()
      t.end()
    },
    () => t.end()
  ]))
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.dispatch should work', (t) => {
  const bot = createBot()
  bot.use(Composer.dispatch('b', {
    b: () => t.end()
  }))
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.dispatch should work with async fn', (t) => {
  const bot = createBot()
  bot.use(Composer.dispatch(
    (ctx) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(1)
        }, 300)
      })
    }, [
      () => {
        t.fail()
        t.end()
      },
      () => t.end()
    ]))
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.log should just work', (t) => {
  const bot = createBot()
  bot.use(Composer.log(() => t.end()))
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('Composer.entity should work', (t) => {
  const bot = createBot()
  bot.use(Composer.entity('hashtag', () => t.end()))
  bot.handleUpdate({ message: { text: '#foo', entities: [{ type: 'hashtag', offset: 0, length: 4 }] } })
})

test.cb('Composer.entity should not infer', (t) => {
  const bot = createBot()
  bot.use(Composer.entity('command', () => t.end()))
  bot.use(() => t.end())
  bot.handleUpdate({ message: { text: '#foo', entities: [{ type: 'hashtag', offset: 0, length: 4 }] } })
})

test.cb('Composer.entity should work with arrays', (t) => {
  const bot = createBot()
  bot.use(Composer.entity(['command', 'hashtag'], () => t.end()))
  bot.handleUpdate({ message: { text: '#foo', entities: [{ type: 'hashtag', offset: 0, length: 4 }] } })
})

test.cb('Composer.entity should work with predicate', (t) => {
  const bot = createBot()
  bot.use(Composer.entity((entity, value) => entity.type === 'hashtag' && value === '#foo', () => t.end()))
  bot.handleUpdate({ message: { text: '#foo', entities: [{ type: 'hashtag', offset: 0, length: 4 }] } })
})

test.cb('Composer.mention should work', (t) => {
  const bot = createBot()
  bot.use(Composer.mention(() => t.end()))
  bot.handleUpdate({ message: { text: 'bar @foo', entities: [{ type: 'mention', offset: 4, length: 4 }] } })
})

test.cb('Composer.mention should work with pattern', (t) => {
  const bot = createBot()
  bot.use(Composer.mention('foo', () => t.end()))
  bot.handleUpdate({ message: { text: 'bar @foo', entities: [{ type: 'mention', offset: 4, length: 4 }] } })
})

test.cb('Composer.hashtag should work', (t) => {
  const bot = createBot()
  bot.use(Composer.hashtag(() => t.end()))
  bot.handleUpdate({ message: { text: '#foo', entities: [{ type: 'hashtag', offset: 0, length: 4 }] } })
})

test.cb('Composer.hashtag should work with pattern', (t) => {
  const bot = createBot()
  bot.use(Composer.hashtag('foo', () => t.end()))
  bot.handleUpdate({ message: { text: 'bar #foo', entities: [{ type: 'hashtag', offset: 4, length: 4 }] } })
})

test.cb('Composer.hashtag should work with hash pattern', (t) => {
  const bot = createBot()
  bot.use(Composer.hashtag('#foo', () => t.end()))
  bot.handleUpdate({ message: { text: 'bar #foo', entities: [{ type: 'hashtag', offset: 4, length: 4 }] } })
})

test.cb('Composer.hashtag should work with patterns array', (t) => {
  const bot = createBot()
  bot.use(Composer.hashtag(['news', 'foo'], () => t.end()))
  bot.handleUpdate({ message: { text: 'bar #foo', entities: [{ type: 'hashtag', offset: 4, length: 4 }] } })
})

test.cb('should handle text triggers via functions', (t) => {
  const bot = createBot()
  bot.hears((text) => text.startsWith('Hi'), () => t.end())
  bot.handleUpdate({ message: { text: 'Hi there!', ...baseMessage } })
})

test.cb('should handle regex triggers', (t) => {
  const bot = createBot()
  bot.hears(/hello (.+)/, (ctx) => {
    t.is('world', ctx.match[1])
    t.end()
  })
  bot.handleUpdate({ message: { text: 'Ola!', ...baseMessage } })
  bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
})

test.cb('should handle command', (t) => {
  const bot = createBot()
  bot.command('foo', () => t.end())
  bot.handleUpdate({ message: { text: '/foo', entities: [{ type: 'bot_command', offset: 0, length: 4 }], ...baseMessage } })
})

test.cb('should handle start command', (t) => {
  const bot = createBot()
  bot.start(() => t.end())
  bot.handleUpdate({ message: { text: '/start', entities: [{ type: 'bot_command', offset: 0, length: 6 }], ...baseMessage } })
})

test.cb('should handle help command', (t) => {
  const bot = createBot()
  bot.help(() => t.end())
  bot.handleUpdate({ message: { text: '/help', entities: [{ type: 'bot_command', offset: 0, length: 5 }], ...baseMessage } })
})

test.cb('should handle settings command', (t) => {
  const bot = createBot()
  bot.settings(() => t.end())
  bot.handleUpdate({ message: { text: '/settings', entities: [{ type: 'bot_command', offset: 0, length: 9 }], ...baseMessage } })
})

test.cb('should handle group command', (t) => {
  const bot = createBot(null)
  bot.botInfo = { username: 'bot' }
  bot.start(() => t.end())
  bot.handleUpdate({ message: { text: '/start@bot', entities: [{ type: 'bot_command', offset: 0, length: 10 }], ...baseGroupMessage } })
})

test.cb('should handle game query', (t) => {
  const bot = createBot()
  bot.gameQuery(() => t.end())
  bot.handleUpdate({ callback_query: { game_short_name: 'foo' } })
})

test.cb('should handle action', (t) => {
  const bot = createBot()
  bot.action('foo', () => t.end())
  bot.handleUpdate({ callback_query: { data: 'foo' } })
})

test.cb('should handle regex action', (t) => {
  const bot = createBot()
  bot.action(/foo (\d+)/, (ctx) => {
    t.true('match' in ctx)
    t.is('42', ctx.match[1])
    t.end()
  })
  bot.handleUpdate({ callback_query: { data: 'foo 42' } })
})

test.cb('should handle inline query', (t) => {
  const bot = createBot()
  bot.inlineQuery('foo', () => t.end())
  bot.handleUpdate({ inline_query: { query: 'foo' } })
})

test.cb('should handle regex inline query', (t) => {
  const bot = createBot()
  bot.inlineQuery(/foo (\d+)/, (ctx) => {
    t.true('match' in ctx)
    t.is('42', ctx.match[1])
    t.end()
  })
  bot.handleUpdate({ inline_query: { query: 'foo 42' } })
})

test.cb('should support middlewares', (t) => {
  const bot = createBot()
  bot.action('bar', (ctx) => {
    t.fail()
  })
  bot.use(() => t.end())
  bot.handleUpdate({ callback_query: { data: 'foo' } })
})

test.cb('should handle short command', (t) => {
  const bot = createBot()
  bot.start(() => t.end())
  bot.handleUpdate({ message: { text: '/start', entities: [{ type: 'bot_command', offset: 0, length: 6 }], ...baseMessage } })
})

test.cb('should handle command in group', (t) => {
  const bot = createBot(null)
  bot.botInfo = { username: 'bot' }
  bot.start(() => t.end())
  bot.handleUpdate({ message: { text: '/start@bot', entities: [{ type: 'bot_command', offset: 0, length: 10 }], chat: { id: 2, type: 'group' } } })
})

test.cb('should handle command in supergroup', (t) => {
  const bot = createBot(null)
  bot.botInfo = { username: 'bot' }
  bot.start(() => t.end())
  bot.handleUpdate({ message: { text: '/start@bot', entities: [{ type: 'bot_command', offset: 0, length: 10 }], chat: { id: 2, type: 'supergroup' } } })
})
