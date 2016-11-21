require('should')
const test = require('ava')
const Telegraf = require('../')
const { Composer } = Telegraf

const baseMessage = { chat: { id: 1 }, from: { id: 42, username: 'telegraf' } }
const baseGroupMessage = { chat: { id: 1, type: 'group' } }

const topLevelUpdates = [
  { type: 'message', update: { message: baseMessage } },
  { type: 'edited_message', update: { edited_message: baseMessage } },
  { type: 'callback_query', update: { callback_query: { message: baseMessage } } },
  { type: 'inline_query', update: { inline_query: {} } },
  { type: 'channel_post', update: { channel_post: {} } },
  { type: 'edited_channel_post', update: { edited_channel_post: {} } },
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

test.cb('should route sub types', (t) => {
  const app = new Telegraf()
  app.on('text', (ctx) => {
    t.end()
  })
  app.handleUpdate({message: Object.assign({voice: {}}, baseMessage)})
  app.handleUpdate({message: Object.assign({text: 'hello'}, baseMessage)})
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
  'pinned_message',
  'game'
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

test('should throw error then called with invalid middleware', (t) => {
  const composer = new Composer()
  t.throws(() => {
    composer.compose(() => undefined)
  })
})

test.cb('should throw error then called with invalid middleware', (t) => {
  const app = new Telegraf()
  app.catch((e) => {
    t.end()
  })
  app.on('text', 'foo')
  app.handleUpdate({message: Object.assign({text: 'hello'}, baseMessage)})
})

test.cb('should throw error then "next()" called twice', (t) => {
  const app = new Telegraf()
  app.catch((e) => {
    t.end()
  })
  app.use((ctx, next) => {
    next()
    return next()
  })
  app.handleUpdate({message: Object.assign({text: 'hello'}, baseMessage)})
})

test('should throw error then called with undefined trigger', (t) => {
  const app = new Telegraf()
  t.throws(() => {
    app.hears(['foo', null])
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

test.cb('should handle text triggers', (t) => {
  const app = new Telegraf()
  app.hears('hello world', (ctx) => {
    t.end()
  })
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('should handle fork', (t) => {
  const app = new Telegraf()
  app.use(Telegraf.fork(() => {
    t.end()
  }))
  app.handleUpdate({message: Object.assign({voice: {}}, baseMessage)})
})

test.cb('Composer.branch should work with value', (t) => {
  const app = new Telegraf()
  app.use(Composer.branch(true, () => {
    t.end()
  }))
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.branch should work with fn', (t) => {
  const app = new Telegraf()
  app.use(Composer.branch((ctx) => false, null, () => {
    t.end()
  }))
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.branch should work with async fn', (t) => {
  const app = new Telegraf()
  app.use(Composer.branch(
    (ctx) => {
      return new Promise((resolve) => setTimeout(resolve, 100, false))
    },
    () => {
      t.fail()
      t.end()
    },
    () => {
      t.end()
    })
  )
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.acl should work with user id', (t) => {
  const app = new Telegraf()
  app.use(Composer.acl(42, () => t.end()))
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.acl should work with user id', (t) => {
  const app = new Telegraf()
  app.use(Composer.acl(42, Composer.passThru()))
  app.use(() => t.end())
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.acl should work with user id', (t) => {
  const app = new Telegraf()
  app.use(Composer.acl(999, () => t.fail()))
  app.use(() => t.end())
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.acl should work with user ids', (t) => {
  const app = new Telegraf()
  app.use(Composer.acl([42, 43], () => t.end()))
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.acl should work with fn', (t) => {
  const app = new Telegraf()
  app.use(Composer.acl((ctx) => ctx.from.username === 'telegraf', () => t.end()))
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.acl should work with async fn', (t) => {
  const app = new Telegraf()
  app.use(Composer.acl((ctx) => new Promise((resolve) => setTimeout(resolve, 100, true)), () => t.end()))
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.optional should work with truthy value', (t) => {
  const app = new Telegraf()
  app.use(Composer.optional(true, () => {
    t.end()
  }))
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.optional should work with false value', (t) => {
  const app = new Telegraf()
  app.use(Composer.optional(false, () => {
    t.fail()
    t.end()
  }))
  app.use(() => t.end())
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.optional should work with fn', (t) => {
  const app = new Telegraf()
  app.use(Composer.optional((ctx) => true, () => {
    t.end()
  }))
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.optional should work with async fn', (t) => {
  const app = new Telegraf()
  app.use(Composer.optional(
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
  app.use(() => t.end())
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.lazy should work with fn', (t) => {
  const app = new Telegraf()
  app.use(Composer.lazy((ctx) => () => t.end()))
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.lazy should work with fn', (t) => {
  const app = new Telegraf()
  app.use(Composer.lazy((ctx) => (_, next) => next()))
  app.use((ctx) => t.end())
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.dispatch should work with handlers array', (t) => {
  const app = new Telegraf()
  app.use(Composer.dispatch(1, [
    () => {
      t.fail()
      t.end()
    },
    () => {
      t.end()
    }
  ]))
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.dispatch should work', (t) => {
  const app = new Telegraf()
  app.use(Composer.dispatch('b', {
    b: () => {
      t.end()
    }
  }))
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.dispatch should work with async fn', (t) => {
  const app = new Telegraf()
  app.use(Composer.dispatch(
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
      () => {
        t.end()
      }
    ]))
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('Composer.log should just work', (t) => {
  const app = new Telegraf()
  app.use(Composer.log(() => {
    t.end()
  }))
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('should handle text triggers via functions', (t) => {
  const app = new Telegraf()
  app.hears((text) => text.startsWith('Hi'), (ctx) => {
    t.end()
  })
  app.handleUpdate({message: Object.assign({text: 'Hi there!'}, baseMessage)})
})

test.cb('should handle regex triggers', (t) => {
  const app = new Telegraf()
  app.hears(/hello (.+)/, (ctx) => {
    ctx.match[1].should.be.equal('world')
    t.end()
  })
  app.handleUpdate({message: Object.assign({text: 'Ola!'}, baseMessage)})
  app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
})

test.cb('should handle command', (t) => {
  const app = new Telegraf()
  app.command('/start', (ctx) => {
    t.end()
  })
  app.handleUpdate({message: Object.assign({text: '/start', entities: [{type: 'bot_command', offset: 0, length: 6}]}, baseMessage)})
})

test.cb('should handle short command', (t) => {
  const app = new Telegraf()
  app.command('start', (ctx) => {
    t.end()
  })
  app.handleUpdate({message: Object.assign({text: '/start', entities: [{type: 'bot_command', offset: 0, length: 6}]}, baseMessage)})
})

test.cb('should handle group command', (t) => {
  const app = new Telegraf(null, {username: 'bot'})
  app.command('start', (ctx) => {
    t.end()
  })
  app.handleUpdate({message: Object.assign({text: '/start@bot', entities: [{type: 'bot_command', offset: 0, length: 10}]}, baseGroupMessage)})
})

test.cb('should handle game query', (t) => {
  const app = new Telegraf()
  app.gameQuery((ctx) => {
    t.end()
  })
  app.handleUpdate({callback_query: {game_short_name: 'foo'}})
})

test.cb('should handle action', (t) => {
  const app = new Telegraf()
  app.action('foo', (ctx) => {
    t.end()
  })
  app.handleUpdate({callback_query: {data: 'foo'}})
})

test.cb('should handle regex action', (t) => {
  const app = new Telegraf()
  app.action(/foo (\d+)/, (ctx) => {
    ctx.should.have.property('match')
    ctx.match[1].should.be.equal('42')
    t.end()
  })
  app.handleUpdate({callback_query: {data: 'foo 42'}})
})

test.cb('should handle action', (t) => {
  const app = new Telegraf()
  app.action('bar', (ctx, next) => {
    t.fail()
  })
  app.use((ctx) => {
    t.end()
  })
  app.handleUpdate({callback_query: {data: 'foo'}})
})

test.cb('should handle short command', (t) => {
  const app = new Telegraf()
  app.command('start', (ctx) => {
    t.end()
  })
  app.handleUpdate({message: Object.assign({text: '/start', entities: [{type: 'bot_command', offset: 0, length: 6}]}, baseMessage)})
})

test.cb('should handle short command with offset', (t) => {
  const app = new Telegraf()
  app.command('start', (ctx) => {
    t.end()
  })
  app.handleUpdate({message: Object.assign({text: 'Hey /start', entities: [{type: 'bot_command', offset: 4, length: 6}]}, baseMessage)})
})

test.cb('should handle command in group', (t) => {
  const app = new Telegraf('---', {username: 'bot'})
  app.command('start', (ctx) => {
    t.end()
  })
  app.handleUpdate({message: {text: '/start@bot', entities: [{type: 'bot_command', offset: 0, length: 10}], chat: {id: 2, type: 'group'}}})
})

test.cb('should handle command in supergroup', (t) => {
  const app = new Telegraf()
  app.options.username = 'bot'
  app.command('start', (ctx) => {
    t.end()
  })
  app.handleUpdate({message: {text: '/start@bot', entities: [{type: 'bot_command', offset: 0, length: 10}], chat: {id: 2, type: 'supergroup'}}})
})
