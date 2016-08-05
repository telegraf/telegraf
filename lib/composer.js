const { compose, mount, hears, action } = require('./utils')

class Composer {
  constructor () {
    this.handlers = []
  }

  /**
   * Register a middleware.
   *
   * @param {Function} middleware - middleware
   * @return {Telegraf} self
   * @api public
   */
  use (middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be function')
    }
    this.handlers.push(middleware)
    return this
  }

  /**
   * Use the given middleware as handler for `updateType`.
   *
   * @param {string} updateType - Update type
   * @param {(Function|Function[])} middleware - middleware
   * @return {Telegraf} self
   * @api public
   */
  on (updateTypes, ...fns) {
    if (fns.length === 0) {
      throw new TypeError('At least one Middleware must be provided')
    }
    this.use(mount(updateTypes, compose(fns)))
    return this
  }

  /**
   * Use the given middleware as handler for text messages.
   *
   * @param {(string|RegEx)} triggers - Text triggers
   * @param {(Function|Function[])} middleware - middleware
   * @return {Telegraf} self
   * @api public
   */
  hears (triggers, ...fns) {
    if (fns.length === 0) {
      throw new TypeError('At least one Middleware must be provided')
    }
    this.use(hears(triggers, compose(fns)))
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
   * @return {Telegraf} self
   * @api public
   */
  action (triggers, ...fns) {
    if (fns.length === 0) {
      throw new TypeError('At least one Middleware must be provided')
    }
    this.use(action(triggers, compose(fns)))
    return this
  }

  middleware () {
    return compose(this.handlers)
  }
}

module.exports = Composer
