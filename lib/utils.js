/**
 * PassThru `middleware` factory.
 *
 * @api public
 */
function passThru () {
  return (ctx, next) => next()
}

/**
 * Optional `middleware` factory.
 *
* @param {(bool|Function)} test
 * @api public
 */
function optional (test, ...fns) {
  if (typeof test !== 'function') {
    return test ? compose(fns) : passThru()
  }
  const middleware = compose(fns)
  return (ctx, next) => test(ctx) ? middleware(ctx, next) : next()
}

/**
 * Branch `middleware` factory.
 *
 * @param {(bool|Function)} test
 * @api public
 */
function branch (test, trueMiddleware, falseMiddleware) {
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
function compose (middlewares) {
  if (!Array.isArray(middlewares)) {
    middlewares = [middlewares]
  }
  for (const middleware of middlewares) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be composed of functions')
    }
  }
  return (ctx, next) => {
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'))
      }
      index = i
      const middleware = middlewares[i] || next
      if (!middleware) {
        return Promise.resolve()
      }
      try {
        return Promise.resolve(middleware(ctx, () => dispatch(i + 1)))
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
function mount (updateTypes, middleware) {
  if (!Array.isArray(updateTypes)) {
    updateTypes = [updateTypes]
  }
  return optional((ctx) => updateTypes.indexOf(ctx.updateType) !== -1 || updateTypes.indexOf(ctx.updateSubType) !== -1, middleware)
}

/**
 * Generates `middleware` for handling `text` messages with regular expressions.
 *
 * @param {(string|RegEx|Function)[]} triggers
 * @param {(Function)} middleware - middleware
 * @api public
 */
function hears (triggers, middleware) {
  const tests = normalizeTriggers(triggers)
  return mount('text', (ctx, next) => {
    const trigger = tests.find((f) => f(ctx.message.text, ctx), ctx)
    if (!trigger) {
      return next()
    }
    ctx.match = trigger(ctx.message.text, ctx)
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
function action (triggers, middleware) {
  const tests = normalizeTriggers(triggers)
  return mount('callback_query', (ctx, next) => {
    const trigger = tests.find((f) => f(ctx.callbackQuery.data, ctx))
    if (!trigger) {
      return next()
    }
    ctx.match = trigger(ctx.callbackQuery.data, ctx)
    return middleware(ctx, next)
  })
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
    const regex = trigger instanceof RegExp ? trigger : stringToRegEx(trigger + '')
    return (string) => string && regex.exec(string)
  })
}

function stringToRegEx (string) {
  const escaped = string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
  return new RegExp(`^${escaped}$`)
}

module.exports = {
  action: action,
  branch: branch,
  compose: compose,
  hears: hears,
  mount: mount,
  optional: optional,
  passThru: passThru
}
