const { default: test } = require('ava')
const { Composer, Telegraf } = require('../')
const { message } = require('../filters')

function createBot(...args) {
  const bot = new Telegraf(...args)
  bot.botInfo = { id: 8, is_bot: true, username: 'bot', first_name: 'Bot' }
  return bot
}

const baseMessage = {
  chat: { id: 1, type: 'private' },
  from: { id: 42, username: 'telegraf' },
}
const baseGroupMessage = { chat: { id: 1, type: 'group' } }

const topLevelUpdates = [
  { type: 'message', update: { message: baseMessage } },
  { type: 'edited_message', update: { edited_message: baseMessage } },
  {
    type: 'callback_query',
    update: { callback_query: { message: baseMessage } },
  },
  { type: 'inline_query', update: { inline_query: {} } },
  { type: 'channel_post', update: { channel_post: {} } },
  { type: 'edited_channel_post', update: { edited_channel_post: {} } },
  { type: 'chosen_inline_result', update: { chosen_inline_result: {} } },
  { type: 'poll', update: { poll: {} } },
]

topLevelUpdates.forEach((update) =>
  test('should route ' + update.type, (t) =>
    t.notThrowsAsync(
      new Promise((resolve) => {
        const bot = createBot()
        bot.on(update.type, () => resolve())
        bot.handleUpdate(update.update)
      })
    )
  )
)

test('should route many types', async (t) => {
  t.plan(1)
  const bot = createBot()
  bot.on(['chosen_inline_result', message()], async (ctx) => {
    t.assert(ctx.message)
  })
  await bot.handleUpdate({ inline_query: baseMessage })
  await bot.handleUpdate({ message: baseMessage })
})

test('should route filters', async (t) => {
  t.plan(1)
  const bot = createBot()
  const filter = message('text')
  bot.on(filter, async (ctx) => {
    t.assert(ctx.has(filter))
  })
  await bot.handleUpdate({ message: { voice: {}, ...baseMessage } })
  await bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
})

/** @deprecated */
test('should route sub types', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.on('text', () => resolve())
      bot.handleUpdate({ message: { voice: {}, ...baseMessage } })
      bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
    })
  ))

topLevelUpdates.forEach((update) =>
  test('should guard ' + update.type, (t) =>
    t.notThrowsAsync(
      new Promise((resolve) => {
        const bot = createBot()
        bot.guard(
          (u) => update.type in u,
          () => resolve()
        )
        bot.handleUpdate(update.update)
      })
    )
  )
)

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
  'poll',
]

updateTypes.forEach((update) =>
  test('should route update type: ' + update, (t) =>
    t.notThrowsAsync(
      new Promise((resolve) => {
        const bot = createBot()
        bot.on(update, (ctx) => {
          resolve()
        })
        const message = { ...baseMessage }
        message[update] = {}
        bot.handleUpdate({ message: message })
      })
    )
  )
)

test('should route venue', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.on('venue', () => resolve())
      const message = {
        location: {},
        venue: { title: 'location', address: 'n/a' },
        ...baseMessage,
      }
      bot.handleUpdate({ message: message })
    })
  ))

test('should route location', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.on('venue', (ctx) => {
        resolve()
      })
      const message = {
        location: {},
        venue: { title: 'location', address: 'n/a' },
        ...baseMessage,
      }
      bot.handleUpdate({ message: message })
    })
  ))

test('should route forward_date', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.on('forward_date', (ctx) => {
        resolve()
      })
      const message = {
        forward_date: 1460829948,
        ...baseMessage,
      }
      bot.handleUpdate({ message: message })
    })
  ))

test('should throw error then called with undefined middleware', (t) =>
  t.throwsAsync(
    new Promise(() => {
      const composer = new Composer()
      composer.compose(() => undefined)
    })
  ))

test('should throw error then called with invalid middleware', (t) =>
  t.throwsAsync(
    new Promise(() => {
      const bot = createBot()
      bot.on('text', 'foo')
    })
  ))

test('should throw error then "next()" called twice', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.catch((e) => resolve())
      bot.use((ctx, next) => {
        next()
        return next()
      })
      bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
    })
  ))

test('should throw error then "next()" called with wrong context', (t) =>
  t.notThrowsAsync(
    new Promise((resolve, reject) => {
      const bot = createBot()
      bot.catch((e) => resolve())
      bot.use((ctx, next) => next('bad context'))
      bot.hears('hello', () => reject())
      bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
    })
  ))

test('should throw error then called with undefined trigger', (t) =>
  t.throwsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.hears(['foo', null])
    })
  ))

test('should support Composer instance as middleware', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      const composer = new Composer()
      composer.on('text', (ctx) => {
        t.is('bar', ctx.state.foo)
        resolve()
      })
      bot.use(({ state }, next) => {
        state.foo = 'bar'
        return next()
      }, composer)
      bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
    })
  ))

test('should support Composer instance as handler', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      const composer = new Composer()
      composer.on('text', () => resolve())
      bot.on('text', composer)
      bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
    })
  ))

test('should handle text triggers', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.hears('hello world', () => resolve())
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('should handle fork', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Telegraf.fork(() => resolve()))
      bot.handleUpdate({ message: { voice: {}, ...baseMessage } })
    })
  ))

test('Composer.branch should work with value', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.branch(true, () => resolve()))
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.branch should work with fn', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(
        Composer.branch(
          (ctx) => false,
          null,
          () => resolve()
        )
      )
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.branch should work with async fn', (t) =>
  t.notThrowsAsync(
    new Promise((resolve, reject) => {
      const bot = createBot()
      bot.use(
        Composer.branch(
          (ctx) => {
            return new Promise((resolve) => setTimeout(resolve, 100, false))
          },
          () => {
            reject()
            resolve()
          },
          () => resolve()
        )
      )
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.acl should work with user id', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.acl(42, () => resolve()))
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.acl should passthru', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.acl(42, Composer.passThru()))
      bot.use(() => resolve())
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.acl should not be false positive', (t) =>
  t.notThrowsAsync(
    new Promise((resolve, reject) => {
      const bot = createBot()
      bot.use(Composer.acl(999, () => reject()))
      bot.use(() => resolve())
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.acl should work with user ids', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.acl([42, 43], () => resolve()))
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.acl should work with fn', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(
        Composer.acl(
          (ctx) => ctx.from.username === 'telegraf',
          () => resolve()
        )
      )
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.acl should work with async fn', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(
        Composer.acl(
          (ctx) => new Promise((resolve) => setTimeout(resolve, 100, true)),
          () => resolve()
        )
      )
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.optional should work with truthy value', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.optional(true, () => resolve()))
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.optional should work with false value', (t) =>
  t.notThrowsAsync(
    new Promise((resolve, reject) => {
      const bot = createBot()
      bot.use(
        Composer.optional(false, () => {
          reject()
          resolve()
        })
      )
      bot.use(() => resolve())
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.optional should work with fn', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(
        Composer.optional(
          (ctx) => true,
          () => resolve()
        )
      )
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.optional should work with async fn', (t) =>
  t.notThrowsAsync(
    new Promise((resolve, reject) => {
      const bot = createBot()
      bot.use(
        Composer.optional(
          (ctx) => {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(false)
              }, 100)
            })
          },
          () => {
            reject()
            resolve()
          }
        )
      )
      bot.use(() => resolve())
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.filter should work with fn', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.filter(({ message }) => message.text.length < 2)
      bot.use(() => resolve())
      bot.handleUpdate({ message: { text: '-', ...baseMessage } })
      bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
      bot.handleUpdate({ message: { text: 'hello world ', ...baseMessage } })
    })
  ))

test('Composer.filter should work with async fn', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.filter(({ message }) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(message.text.length < 2)
          }, 100)
        })
      })
      bot.use(() => resolve())
      bot.handleUpdate({ message: { text: '-', ...baseMessage } })
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.drop should work with fn', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.drop(({ message }) => message.text.length > 2)
      bot.use(() => resolve())
      bot.handleUpdate({ message: { text: '-', ...baseMessage } })
      bot.handleUpdate({ message: { text: 'hello', ...baseMessage } })
      bot.handleUpdate({ message: { text: 'hello world ', ...baseMessage } })
    })
  ))

test('Composer.drop should work with async fn', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.drop(({ message }) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(message.text.length > 2)
          }, 100)
        })
      })
      bot.use(() => resolve())
      bot.handleUpdate({ message: { text: '-', ...baseMessage } })
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.lazy should work with fn', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.lazy((ctx) => () => resolve()))
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.lazy should support middlewares', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.lazy((ctx) => (_, next) => next()))
      bot.use(() => resolve())
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.dispatch should work with handlers array', (t) =>
  t.notThrowsAsync(
    new Promise((resolve, reject) => {
      const bot = createBot()
      bot.use(
        Composer.dispatch(() => 1, [
          () => {
            reject()
            resolve()
          },
          () => resolve(),
        ])
      )
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.dispatch should work', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(
        Composer.dispatch(() => 'b', {
          b: () => resolve(),
        })
      )
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.dispatch should work with async fn', (t) =>
  t.notThrowsAsync(
    new Promise((resolve, reject) => {
      const bot = createBot()
      bot.use(
        Composer.dispatch(
          (ctx) => {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(1)
              }, 300)
            })
          },
          [
            () => {
              reject()
              resolve()
            },
            () => resolve(),
          ]
        )
      )
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.log should just work', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.log(() => resolve()))
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))

test('Composer.entity should work', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.entity('hashtag', () => resolve()))
      bot.handleUpdate({
        message: {
          text: '#foo',
          entities: [{ type: 'hashtag', offset: 0, length: 4 }],
        },
      })
    })
  ))

test('Composer.entity should not infer', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.entity('command', () => resolve()))
      bot.use(() => resolve())
      bot.handleUpdate({
        message: {
          text: '#foo',
          entities: [{ type: 'hashtag', offset: 0, length: 4 }],
        },
      })
    })
  ))

test('Composer.entity should work with arrays', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.entity(['command', 'hashtag'], () => resolve()))
      bot.handleUpdate({
        message: {
          text: '#foo',
          entities: [{ type: 'hashtag', offset: 0, length: 4 }],
        },
      })
    })
  ))

test('Composer.entity should work with predicate', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(
        Composer.entity(
          (entity, value) => entity.type === 'hashtag' && value === '#foo',
          () => resolve()
        )
      )
      bot.handleUpdate({
        message: {
          text: '#foo',
          entities: [{ type: 'hashtag', offset: 0, length: 4 }],
        },
      })
    })
  ))

test('Composer.mention should work', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.mention(() => resolve()))
      bot.handleUpdate({
        message: {
          text: 'bar @foo',
          entities: [{ type: 'mention', offset: 4, length: 4 }],
        },
      })
    })
  ))

test('Composer.mention should work with pattern', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.mention('foo', () => resolve()))
      bot.handleUpdate({
        message: {
          text: 'bar @foo',
          entities: [{ type: 'mention', offset: 4, length: 4 }],
        },
      })
    })
  ))

test('Composer.hashtag should work', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.hashtag(() => resolve()))
      bot.handleUpdate({
        message: {
          text: '#foo',
          entities: [{ type: 'hashtag', offset: 0, length: 4 }],
        },
      })
    })
  ))

test('Composer.hashtag should work with pattern', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.hashtag('foo', () => resolve()))
      bot.handleUpdate({
        message: {
          text: 'bar #foo',
          entities: [{ type: 'hashtag', offset: 4, length: 4 }],
        },
      })
    })
  ))

test('Composer.hashtag should work with hash pattern', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.hashtag('#foo', () => resolve()))
      bot.handleUpdate({
        message: {
          text: 'bar #foo',
          entities: [{ type: 'hashtag', offset: 4, length: 4 }],
        },
      })
    })
  ))

test('Composer.hashtag should work with patterns array', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.use(Composer.hashtag(['news', 'foo'], () => resolve()))
      bot.handleUpdate({
        message: {
          text: 'bar #foo',
          entities: [{ type: 'hashtag', offset: 4, length: 4 }],
        },
      })
    })
  ))

test('should handle text triggers via functions', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.hears(
        (text) => text.startsWith('Hi'),
        () => resolve()
      )
      bot.handleUpdate({ message: { text: 'Hi there!', ...baseMessage } })
    })
  ))

test('should handle regex triggers', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.hears(/hello (.+)/, (ctx) => {
        t.is('world', ctx.match[1])
        resolve()
      })
      bot.handleUpdate({ message: { text: 'Ola!', ...baseMessage } })
      bot.handleUpdate({ message: { text: 'hello world', ...baseMessage } })
    })
  ))
test('should handle command', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.command('foo', () => resolve())
      bot.handleUpdate({
        message: {
          text: '/foo',
          entities: [{ type: 'bot_command', offset: 0, length: 4 }],
          ...baseMessage,
        },
      })
    })
  ))

test('should handle start command', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.start(() => resolve())
      bot.handleUpdate({
        message: {
          text: '/start',
          entities: [{ type: 'bot_command', offset: 0, length: 6 }],
          ...baseMessage,
        },
      })
    })
  ))

test('should handle help command', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.help(() => resolve())
      bot.handleUpdate({
        message: {
          text: '/help',
          entities: [{ type: 'bot_command', offset: 0, length: 5 }],
          ...baseMessage,
        },
      })
    })
  ))

test('should handle settings command', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.settings(() => resolve())
      bot.handleUpdate({
        message: {
          text: '/settings',
          entities: [{ type: 'bot_command', offset: 0, length: 9 }],
          ...baseMessage,
        },
      })
    })
  ))

test('should handle group command', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot(null)
      bot.botInfo = { username: 'bot' }
      bot.start(() => resolve())
      bot.handleUpdate({
        message: {
          text: '/start@bot',
          entities: [{ type: 'bot_command', offset: 0, length: 10 }],
          ...baseGroupMessage,
        },
      })
    })
  ))

test('should handle game query', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.gameQuery(() => resolve())
      bot.handleUpdate({ callback_query: { game_short_name: 'foo' } })
    })
  ))

test('should handle action', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.action('foo', () => resolve())
      bot.handleUpdate({ callback_query: { data: 'foo' } })
    })
  ))

test('should handle regex action', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.action(/foo (\d+)/, (ctx) => {
        t.true('match' in ctx)
        t.is('42', ctx.match[1])
        resolve()
      })
      bot.handleUpdate({ callback_query: { data: 'foo 42' } })
    })
  ))

test('should handle inline query', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.inlineQuery('foo', () => resolve())
      bot.handleUpdate({ inline_query: { query: 'foo' } })
    })
  ))

test('should handle regex inline query', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.inlineQuery(/foo (\d+)/, (ctx) => {
        t.true('match' in ctx)
        t.is('42', ctx.match[1])
        resolve()
      })
      bot.handleUpdate({ inline_query: { query: 'foo 42' } })
    })
  ))

test('should support middlewares', (t) =>
  t.notThrowsAsync(
    new Promise((resolve, reject) => {
      const bot = createBot()
      bot.action('bar', (ctx) => {
        reject()
      })
      bot.use(() => resolve())
      bot.handleUpdate({ callback_query: { data: 'foo' } })
    })
  ))

test('should handle short command', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot()
      bot.start(() => resolve())
      bot.handleUpdate({
        message: {
          text: '/start',
          entities: [{ type: 'bot_command', offset: 0, length: 6 }],
          ...baseMessage,
        },
      })
    })
  ))

test('should handle command in group', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot(null)
      bot.botInfo = { username: 'bot' }
      bot.start(() => resolve())
      bot.handleUpdate({
        message: {
          text: '/start@bot',
          entities: [{ type: 'bot_command', offset: 0, length: 10 }],
          chat: { id: 2, type: 'group' },
        },
      })
    })
  ))

test('should handle command in supergroup', (t) =>
  t.notThrowsAsync(
    new Promise((resolve) => {
      const bot = createBot(null)
      bot.botInfo = { username: 'bot' }
      bot.start(() => resolve())
      bot.handleUpdate({
        message: {
          text: '/start@bot',
          entities: [{ type: 'bot_command', offset: 0, length: 10 }],
          chat: { id: 2, type: 'supergroup' },
        },
      })
    })
  ))
