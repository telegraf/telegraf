const Composer = require('../composer')

class BaseScene extends Composer {
  constructor (id, options) {
    const opts = Object.assign({
      handlers: [],
      enterHandlers: [],
      leaveHandlers: []
    }, options)
    super(...opts.handlers)
    this.id = id
    this.options = opts
    this.enterHandler = Composer.compose(opts.enterHandlers)
    this.leaveHandler = Composer.compose(opts.leaveHandlers)
  }

  get ttl () {
    return this.options.ttl
  }

  enter (...fns) {
    this.enterHandler = Composer.compose([this.enterHandler, ...fns])
    return this
  }

  leave (...fns) {
    this.leaveHandler = Composer.compose([this.leaveHandler, ...fns])
    return this
  }

  enterMiddleware () {
    return this.enterHandler
  }

  leaveMiddleware () {
    return this.leaveHandler
  }
}

module.exports = BaseScene
