class Composer {

  /**
   * Initialize a new `Composer`.
   * @param {(Function|Function[])} handlers - middleware
   * @api public
   */
  constructor (...handlers) {
    this.handlers = handlers
  }

  /**
   * Register a middleware.
   *
   * @param {Function} fns - middleware
   * @return {Composer} self
   * @api public
   */
  use (...fns) {
    if (fns.length === 0) {
      throw new TypeError('At least one Middleware must be provided')
    }
    this.handlers = this.handlers.concat(fns)
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
    if (fns.length === 0) {
      throw new TypeError('At least one Middleware must be provided')
    }
    this.use(Composer.mount(updateTypes, Composer.compose(fns)))
    return this
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
    if (fns.length === 0) {
      throw new TypeError('At least one Middleware must be provided')
    }
    this.use(Composer.hears(triggers, Composer.compose(fns)))
    return this
  }

  /**
   * Just `hears` alias.
   *
   * @api public
   */
  command (...args) {
    return this.hears(...args)
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
    if (fns.length === 0) {
      throw new TypeError('At least one Middleware must be provided')
    }
    this.use(Composer.action(triggers, Composer.compose(fns)))
    return this
  }

  /**
   * Composed middleware.
   *
   * @api public
   */
  middleware () {
    return Composer.compose(this.handlers)
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
      try {
        fn(JSON.stringify(ctx.update, null, 2))
      } catch (err) {
        console.error('Telegraf: error in `log` handler', err)
      }
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
    if (typeof test !== 'function') {
      return test ? Composer.compose(fns) : Composer.passThru()
    }
    const middleware = Composer.compose(fns)
    return (ctx, next) => test(ctx) ? middleware(ctx, next) : next()
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
    return (ctx, next) => test(ctx) ? trueMiddleware(ctx, next) : falseMiddleware(ctx, next)
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
      middlewares = [middlewares]
    }
    if (middlewares.includes((fn) => !fn || !(typeof fn === 'function' || typeof fn.middleware === 'function'))) {
      throw new TypeError('Middleware must be composed of functions')
    }
    return (ctx, next) => {
      let index = -1
      return dispatch(0)
      function dispatch (i) {
        if (i <= index) {
          return Promise.reject(new Error('next() called multiple times'))
        }
        index = i
        let handler = middlewares[i] || next
        if (handler && handler.middleware) {
          handler = handler.middleware()
        }
        if (!handler) {
          return Promise.resolve()
        }
        try {
          return Promise.resolve(handler(ctx, () => dispatch(i + 1)))
        } catch (err) {
          return Promise.reject(err)
        }
      }
    }
  }

  /**
   * Generates `middleware` for handling provided update types.
   *
   * @param {string|string[]} updateTypes
   * @param {Function|} middleware - middleware
   * @api public
   */
  static mount (updateTypes, middleware) {
    if (!Array.isArray(updateTypes)) {
      updateTypes = [updateTypes]
    }
    return Composer.optional((ctx) => updateTypes.includes(ctx.updateType) || updateTypes.includes(ctx.updateSubType), middleware)
  }

  /**
   * Generates `middleware` for handling `text` messages with regular expressions.
   *
   * @param {(string|RegEx|Function)[]} triggers
   * @param {(Function)} middleware - middleware
   * @api public
   */
  static hears (triggers, middleware) {
    const tests = Composer.normalizeTriggers(triggers)
    return Composer.mount('text', (ctx, next) => {
      const match = Composer.testTriggers(ctx.message.text, tests, ctx)
      if (!match) {
        return next()
      }
      ctx.match = match
      return middleware(ctx, next)
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
    const tests = Composer.normalizeTriggers(triggers)
    return Composer.mount('callback_query', (ctx, next) => {
      const match = Composer.testTriggers(ctx.callbackQuery.data, tests, ctx)
      if (!match) {
        return next()
      }
      ctx.match = match
      return middleware(ctx, next)
    })
  }

  static normalizeTriggers (triggers) {
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
      const regex = trigger instanceof RegExp ? trigger : Composer.stringToRegEx(trigger + '')
      return (string) => string && regex.exec(string)
    })
  }

  static testTriggers (string, tests, ctx) {
    for (let test of tests) {
      const result = test(string, ctx)
      if (result) {
        return result
      }
    }
  }

  static stringToRegEx (string) {
    const escaped = string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    return new RegExp(`^${escaped}$`)
  }
}

module.exports = Composer
