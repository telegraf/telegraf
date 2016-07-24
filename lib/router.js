const { compose } = require('./utils')

class Router {
  constructor (routerFn) {
    this.routerFn = routerFn
    this.handlers = new Map()
    this.otherwiseHandler = (ctx, next) => next()
  }

  on (route, ...fns) {
    if (fns.length === 0) {
      throw new TypeError('At least one handler must be provided')
    }
    this.handlers.set(route, compose(fns))
  }

  otherwise (...fns) {
    if (fns.length === 0) {
      throw new TypeError('At least one otherwise handler must be provided')
    }
    this.otherwiseHandler = compose(fns)
  }

  middleware () {
    if (!this.routerFn) {
      return (ctx, next) => next()
    }
    return (ctx, next) => this.routerFn(ctx)
      .then((result) => {
        if (!result || !result.route || !this.handlers.has(result.route)) {
          return this.otherwiseHandler(ctx, next)
        }
        if (result.state) {
          Object.keys(result.state).forEach((key) => {
            ctx.state[key] = result.state[key]
          })
        }
        const handler = this.handlers.get(result.route)
        return handler(ctx, next)
      })
  }
}

module.exports = Router
