const { compose, passThru } = require('./utils')

class Router {
  constructor (routeFn) {
    this.routeFn = routeFn
    this.handlers = new Map()
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
    if (!this.routeFn) {
      return passThru()
    }
    return (ctx, next) => this.routeFn(ctx).then((result) => {
      if (!result || !result.route || !this.handlers.has(result.route)) {
        return this.otherwiseHandler(ctx, next)
      }
      Object.assign(ctx, result.context)
      Object.assign(ctx.state, result.state)
      return this.handlers.get(result.route)(ctx, next)
    })
  }
}

module.exports = Router
