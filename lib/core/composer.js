const TelegrafContext = require('./context')

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

  drop (predicate) {
    return this.use(Composer.drop(predicate))
  }

  filter (predicate) {
    return this.use(Composer.filter(predicate))
  }

  middleware () {
    return this.handler
  }

  static reply (...args) {
    return (ctx) => ctx.reply(...args)
  }

  static fork (middleware) {
    return (ctx, next) => {
      setImmediate(Composer.unwrap(middleware), ctx, Composer.safePassThru())
      return next(ctx)
    }
  }

  static passThru () {
    return (ctx, next) => next(ctx)
  }

  static safePassThru () {
    return (ctx, next) => typeof next === 'function' ? next(ctx) : Promise.resolve()
  }

  static lazy (factoryFn) {
    if (typeof factoryFn !== 'function') {
      throw new Error('Argument must be a function')
    }
    return (ctx, next) => Promise.resolve(factoryFn(ctx))
      .then((middleware) => Composer.unwrap(middleware)(ctx, next))
  }

  static log (logFn = console.log) {
    return Composer.fork((ctx) => logFn(JSON.stringify(ctx.update, null, 2)))
  }

  static branch (predicate, trueMiddleware, falseMiddleware) {
    if (typeof predicate !== 'function') {
      return predicate ? trueMiddleware : falseMiddleware
    }
    return Composer.lazy((ctx) => Promise.resolve(predicate(ctx))
      .then((value) => value ? trueMiddleware : falseMiddleware))
  }

  static optional (predicate, ...fns) {
    return Composer.branch(predicate, Composer.compose(fns), Composer.safePassThru())
  }

  static filter (predicate) {
    return Composer.branch(predicate, Composer.safePassThru(), () => {})
  }

  static drop (predicate) {
    return Composer.branch(predicate, () => {}, Composer.safePassThru())
  }

  static dispatch (routeFn, handlers) {
    return typeof routeFn === 'function'
      ? Composer.lazy((ctx) => Promise.resolve(routeFn(ctx)).then((value) => handlers[value]))
      : handlers[routeFn]
  }

  static mount (updateType, middleware) {
    const predicate = Array.isArray(updateType)
      ? (ctx) => updateType.includes(ctx.updateType) || updateType.some(type => ctx.updateSubTypes.includes(type))
      : (ctx) => updateType === ctx.updateType || ctx.updateSubTypes.includes(updateType)
    return Composer.optional(predicate, middleware)
  }

  static hears (triggers, middleware) {
    return Composer.mount('text', Composer.match(normalizeTriggers(triggers), middleware))
  }

  static action (triggers, middleware) {
    return Composer.mount('callback_query', Composer.match(normalizeTriggers(triggers), middleware))
  }

  static match (triggers, middleware) {
    return Composer.lazy((ctx) => {
      const text = (
        (ctx.message && (ctx.message.caption || ctx.message.text)) ||
        (ctx.callbackQuery && ctx.callbackQuery.data)
      )
      for (let trigger of triggers) {
        ctx.match = trigger(text, ctx)
        if (ctx.match) {
          return middleware
        }
      }
      return Composer.safePassThru()
    })
  }

  static acl (userId, middleware) {
    if (typeof userId === 'function') {
      return Composer.optional(userId, middleware)
    }
    const allowed = Array.isArray(userId) ? userId : [userId]
    return Composer.optional((ctx) => !ctx.from || allowed.includes(ctx.from.id), middleware)
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
        return entity.type === 'bot_command' && entity.offset === 0 && (commands.includes(command) || groupCommands.includes(command))
      })
      return hasMatch ? middleware : Composer.safePassThru()
    }))
  }

  static unwrap (handler) {
    return handler && typeof handler.middleware === 'function'
      ? handler.middleware()
      : handler
  }

  static compose (middlewares) {
    if (!Array.isArray(middlewares)) {
      throw new Error('Middlewares must be an array')
    }
    if (middlewares.length === 0) {
      return Composer.safePassThru()
    }
    if (middlewares.length === 1) {
      return Composer.unwrap(middlewares[0])
    }
    return (ctx, next) => {
      let index = -1
      return execute(0, ctx)
      function execute (i, context) {
        if (!(context instanceof TelegrafContext)) {
          return Promise.reject(new Error('next(ctx) called with invalid context'))
        }
        if (i <= index) {
          return Promise.reject(new Error('next() called multiple times'))
        }
        index = i
        const handler = Composer.unwrap(middlewares[i]) || next
        if (!handler) {
          return Promise.resolve()
        }
        try {
          return Promise.resolve(
            handler(context, (ctx = context) => execute(i + 1, ctx))
          )
        } catch (err) {
          return Promise.reject(err)
        }
      }
    }
  }
}

function normalizeTriggers (triggers) {
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
    if (trigger instanceof RegExp) {
      return (value) => {
        trigger.lastIndex = 0
        return trigger.exec(value || '')
      }
    }
    return (value) => trigger === value ? value : null
  })
}

module.exports = Composer
