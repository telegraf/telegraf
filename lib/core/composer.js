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

  static passThru () {
    return (ctx, next) => next()
  }

  static fork (fn) {
    return (ctx, next) => {
      setImmediate(fn, ctx)
      return next()
    }
  }

  static log (fn = console.log) {
    return (ctx, next) => {
      fn(JSON.stringify(ctx.update, null, 2))
      return next()
    }
  }

  static optional (test, ...fns) {
    return Composer.branch(test, Composer.compose(fns), Composer.passThru())
  }

  static branch (test, trueMiddleware, falseMiddleware) {
    if (typeof test !== 'function') {
      return test ? trueMiddleware : falseMiddleware
    }
    return (ctx, next) => Promise.resolve(test(ctx))
      .then((value) => {
        const handler = value ? trueMiddleware : falseMiddleware
        return handler(ctx, next)
      })
  }

  static dispatch (test, handlers) {
    if (typeof test !== 'function') {
      return handlers[test] || Composer.passThru()
    }
    return (ctx, next) => Promise.resolve(test(ctx))
      .then((value) => {
        const handler = handlers[value] || Composer.passThru()
        return handler(ctx, next)
      })
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
    return (ctx, next) => {
      const text = (ctx.message && (ctx.message.caption || ctx.message.text)) || (ctx.callbackQuery && ctx.callbackQuery.data)
      for (let test of tests) {
        const result = test(text, ctx)
        if (!result) {
          continue
        }
        ctx.match = result
        return middleware(ctx, next)
      }
      return next()
    }
  }

  static gameQuery (middleware) {
    return Composer.mount('callback_query', Composer.optional((ctx) => ctx.callbackQuery.game_short_name, middleware))
  }

  static command (command, middleware) {
    let commands = Array.isArray(command) ? command : [command]
    commands = commands.map((cmd) => {
      return cmd.startsWith('/') ? cmd : `/${cmd}`
    })
    return Composer.mount('text', (ctx, next) => {
      const text = ctx.message.text
      const groupCommands = ctx.me && (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup')
        ? commands.map((command) => `${command}@${ctx.me}`)
        : []
      const hasMatch = ctx.message.entities && ctx.message.entities.find((entity) => {
        if (entity.type !== 'bot_command') {
          return false
        }
        const command = text.substring(entity.offset, entity.offset + entity.length)
        return commands.includes(command) || groupCommands.includes(command)
      })
      return hasMatch ? middleware(ctx, next) : next()
    })
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
        let handler = middlewares[i] || next
        if (handler && typeof handler.middleware === 'function') {
          handler = handler.middleware()
        }
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
