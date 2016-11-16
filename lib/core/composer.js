class Composer {

  constructor (...handlers) {
    this.handler = Composer.compose(handlers)
  }

  use (...fns) {
    this.handler = Composer.compose([this.handler, ...fns])
    return this
  }

  on (updateTypes, ...fns) {
    return this.use(Composer.mount(updateTypes, Composer.compose(fns)))
  }

  hears (triggers, ...fns) {
    return this.use(Composer.hears(triggers, Composer.compose(fns)))
  }

  command (commands, ...fns) {
    return this.use(Composer.command(commands, Composer.compose(fns)))
  }

  action (triggers, ...fns) {
    return this.use(Composer.action(triggers, Composer.compose(fns)))
  }

  gameQuery (...fns) {
    return this.use(Composer.gameQuery(Composer.compose(fns)))
  }

  middleware () {
    return this.handler
  }

  static reply (...args) {
    return (ctx) => ctx.reply(...args)
  }

  static fork (middleware) {
    return (ctx, next) => {
      setImmediate(unwrap(middleware), ctx)
      return next()
    }
  }

  static passThru () {
    return (ctx, next) => next()
  }

  static lazy (fn) {
    if (typeof fn !== 'function') {
      throw new Error('Argument must be a function')
    }
    return (ctx, next) => Promise.resolve(fn(ctx))
      .then((middleware) => {
        const handler = unwrap(middleware)
        return handler(ctx, next)
      })
  }

  static log (logFn = console.log) {
    return Composer.fork((ctx) => logFn(JSON.stringify(ctx.update, null, 2)))
  }

  static branch (test, trueMiddleware, falseMiddleware) {
    if (typeof test !== 'function') {
      return test ? trueMiddleware : falseMiddleware
    }
    return Composer.lazy((ctx) => Promise.resolve(test(ctx)).then((value) => value ? trueMiddleware : falseMiddleware))
  }

  static optional (test, ...fns) {
    return Composer.branch(test, Composer.compose(fns), Composer.passThru())
  }

  static dispatch (test, handlers) {
    if (typeof test !== 'function') {
      return handlers[test] || Composer.passThru()
    }
    return Composer.lazy((ctx) => Promise.resolve(test(ctx)).then((value) => handlers[value]))
  }

  static mount (updateType, middleware) {
    let test = Array.isArray(updateType)
      ? (ctx) => updateType.includes(ctx.updateType) || updateType.includes(ctx.updateSubType)
      : (ctx) => updateType === ctx.updateType || updateType === ctx.updateSubType
    return Composer.optional(test, middleware)
  }

  static hears (triggers, middleware) {
    const tests = makeTests(triggers)
    return Composer.mount('text', Composer.match(tests, middleware))
  }

  static action (triggers, middleware) {
    const tests = makeTests(triggers)
    return Composer.mount('callback_query', Composer.match(tests, middleware))
  }

  static match (tests, middleware) {
    return Composer.lazy((ctx) => {
      const text = (ctx.message && (ctx.message.caption || ctx.message.text)) || (ctx.callbackQuery && ctx.callbackQuery.data)
      for (let test of tests) {
        const result = test(text, ctx)
        if (!result) {
          continue
        }
        ctx.match = result
        return middleware
      }
      return Composer.passThru()
    })
  }

  static acl (userId, middleware) {
    let whitelistFn = userId
    if (typeof whitelistFn !== 'function') {
      const allowed = Array.isArray(userId) ? userId : [userId]
      whitelistFn = (ctx) => allowed.includes(ctx.from.id) || (ctx.from.username && allowed.includes(ctx.from.username))
    }
    return Composer.optional(whitelistFn, middleware)
  }

  static gameQuery (middleware) {
    return Composer.mount('callback_query', Composer.optional((ctx) => ctx.callbackQuery.game_short_name, middleware))
  }

  static command (command, middleware) {
    let commands = Array.isArray(command) ? command : [command]
    commands = commands.map((cmd) => cmd.startsWith('/') ? cmd : `/${cmd}`)
    return Composer.mount('text', Composer.lazy((ctx) => {
      const text = ctx.message.text
      const groupCommands = ctx.me && (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup')
        ? commands.map((command) => `${command}@${ctx.me}`)
        : []
      const hasMatch = ctx.message.entities && ctx.message.entities.find((entity) => {
        const command = text.substring(entity.offset, entity.offset + entity.length)
        return entity.type === 'bot_command' && commands.includes(command) || groupCommands.includes(command)
      })
      return hasMatch ? middleware : Composer.passThru()
    }))
  }

  static compose (middlewares) {
    if (!Array.isArray(middlewares)) {
      throw new Error('Middlewares must be an array')
    }
    return (ctx, next) => {
      let index = -1
      return execute(0)
      function execute (i) {
        if (i <= index) {
          return Promise.reject(new Error('next() called multiple times'))
        }
        index = i
        let handler = unwrap(middlewares[i]) || next
        if (!handler) {
          return Promise.resolve()
        }
        try {
          return Promise.resolve(handler(ctx, () => execute(i + 1)))
        } catch (err) {
          return Promise.reject(err)
        }
      }
    }
  }
}

function unwrap (handler) {
  return handler && typeof handler.middleware === 'function'
    ? handler.middleware()
    : handler
}

function makeTests (triggers) {
  if (!Array.isArray(triggers)) {
    triggers = [triggers]
  }
  return triggers.map((trigger) => {
    if (!trigger) {
      throw new Error('Invalid trigger')
    }
    if (typeof trigger === 'function') {
      return trigger
    }
    return trigger instanceof RegExp
      ? (value) => trigger.exec(value || '')
      : (value) => trigger === value ? value : null
  })
}

module.exports = Composer
