class Composer {

  /**
   * Initialize a new `Composer`.
   * @param {(Function|Function[])} handlers - middleware
   * @api public
   */
  constructor (...handlers) {
    this.handler = Composer.compose(handlers)
  }

  /**
   * Register a middleware.
   *
   * @param {Function} fns - middleware
   * @return {Composer} self
   * @api public
   */
  use (...fns) {
    this.handler = Composer.compose([this.handler, ...fns])
    return this
  }

  /**
   * Use the given middleware as handler for `updateType`.
   *
   * @param {string} updateType - Update type
   * @param {(Function|Function[])} fns - middleware
   * @return {Composer} self
   * @api public
   */
  on (updateTypes, ...fns) {
    return this.use(Composer.mount(updateTypes, Composer.compose(fns)))
  }

  /**
   * Use the given middleware as handler for text messages.
   *
   * @param {(string|RegEx)} triggers - Text triggers
   * @param {(Function|Function[])} middleware - middleware
   * @return {Composer} self
   * @api public
   */
  hears (triggers, ...fns) {
    return this.use(Composer.hears(triggers, Composer.compose(fns)))
  }

  /**
   * Use the given middleware as handler for commands.
   *
   * @param {(string|RegEx)} commands - Text triggers
   * @param {(Function|Function[])} middleware - middleware
   * @return {Composer} self
   * @api public
   */
  command (commands, ...fns) {
    return this.use(Composer.command(commands, Composer.compose(fns)))
  }

  /**
   * Use the given middleware as handler for callback_query data.
   *
   * @param {(string|RegEx)} triggers - Text triggers
   * @param {(Function|Function[])} middleware - middleware
   * @return {Composer} self
   * @api public
   */
  action (triggers, ...fns) {
    return this.use(Composer.action(triggers, Composer.compose(fns)))
  }

  /**
   * Composed middleware.
   *
   * @api public
   */
  middleware () {
    return this.handler
  }

  /**
   * PassThru `middleware` factory.
   *
   * @api public
   */
  static passThru () {
    return (ctx, next) => next()
  }

  /**
   * Tap `middleware` factory.
   *
   * @param {Function} fn
   * @api public
   */
  static tap (fn) {
    return (ctx, next) => {
      setImmediate(fn, ctx)
      return next()
    }
  }

  /**
   * Log `middleware` factory.
   *
   * @param {Function} fn
   * @api public
   */
  static log (fn = console.log) {
    return (ctx, next) => {
      fn(JSON.stringify(ctx.update, null, 2))
      return next()
    }
  }

  /**
   * Optional `middleware` factory.
   *
   * @param {(bool|Function)} test
   * @api public
   */
  static optional (test, ...fns) {
    return Composer.branch(test, Composer.compose(fns), Composer.passThru())
  }

  /**
   * Branch `middleware` factory.
   *
   * @param {(bool|Function)} test
   * @api public
   */
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

  /**
   * dispatch `middleware` factory.
   *
   * @param {(any|Function)} test
   * @param {(Function[]|Object)} handlers
   * @api public
   */
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

  /**
   * Generates `middleware` for handling provided update types.
   *
   * @param {string|string[]} updateType
   * @param {Function|} middleware - middleware
   * @api public
   */
  static mount (updateType, middleware) {
    let test = Array.isArray(updateType)
      ? (ctx) => updateType.includes(ctx.updateType) || updateType.includes(ctx.updateSubType)
      : (ctx) => updateType === ctx.updateType || updateType === ctx.updateSubType
    return Composer.optional(test, middleware)
  }

  /**
   * Generates `middleware` for handling `text` messages with regular expressions.
   *
   * @param {(string|RegEx|Function)[]} triggers
   * @param {(Function)} middleware - middleware
   * @api public
   */
  static hears (triggers, middleware) {
    const tests = normalizeTextTriggers(triggers)
    return Composer.mount('text', (ctx, next) => {
      const match = runTriggers(ctx.message.text, tests, ctx)
      if (!match) {
        return next()
      }
      ctx.match = match
      return middleware(ctx, next)
    })
  }

  /**
   * Generates `middleware` for command handling.
   *
   * @param {(string)[]} commands
   * @param {(Function)} middleware - middleware
   * @api public
   */
  static command (triggers, middleware) {
    let commands = Array.isArray(triggers) ? triggers : [triggers]
    commands = commands.map((command) => {
      return command.startsWith('/') ? command : `/${command}`
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

  /**
   * Generates `middleware` for handling `callbackQuery` actions with regular expressions.
   *
   * @param {(string|RegEx|Function)[]} triggers
   * @param {(Function)} middleware - middleware
   * @api public
   */
  static action (triggers, middleware) {
    const tests = normalizeTextTriggers(triggers)
    return Composer.mount('callback_query', (ctx, next) => {
      const match = runTriggers(ctx.callbackQuery.data, tests, ctx)
      if (!match) {
        return next()
      }
      ctx.match = match
      return middleware(ctx, next)
    })
  }

  /**
  * Compose `middlewares` returning
  * a fully valid middleware comprised
  * of all those which are passed.
  *
  * @param {Function[]} middlewares
  * @return {Function}
  * @api public
  */
  static compose (middlewares) {
    if (!Array.isArray(middlewares)) {
      throw new Error('Middleware must be composed of functions')
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

function normalizeTextTriggers (triggers) {
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
      : (value) => value === trigger
  })
}

function runTriggers (value, tests, ctx) {
  for (let test of tests) {
    const result = test(value, ctx)
    if (result) {
      return result
    }
  }
}

module.exports = Composer
