const { compose, lazy, passThru } = require('./composer')

class Router {
  constructor (routeFn, handlers = new Map()) {
    if (!routeFn) {
      throw new Error('Missing routing function')
    }
    this.routeFn = routeFn
    this.handlers = handlers
    this.otherwiseHandler = passThru()
  }

  on (route, ...fns) {
    if (fns.length === 0) {
      throw new TypeError('At least one handler must be provided')
    }
    this.handlers.set(route, compose(fns))
    return this
  }

  otherwise (...fns) {
    if (fns.length === 0) {
      throw new TypeError('At least one otherwise handler must be provided')
    }
    this.otherwiseHandler = compose(fns)
    return this
  }

  middleware () {
    return lazy((ctx) => {
      return Promise.resolve(this.routeFn(ctx)).then((result) => {
        if (!result || !result.route || !this.handlers.has(result.route)) {
          return this.otherwiseHandler
        }
        Object.assign(ctx, result.context)
        Object.assign(ctx.state, result.state)
        return this.handlers.get(result.route)
      })
    })
  }
}

module.exports = Router
