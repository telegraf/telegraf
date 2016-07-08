class Router {
  constructor (routerFn) {
    this.routerFn = routerFn
    this.handlers = new Map()
  }

  on (route) {
    const fns = [].slice.call(arguments, 1)
    if (fns.length === 0) {
      throw new TypeError('At least one handler must be provided')
    }
    this.handlers.set(route, require('./telegraf').compose(fns))
  }

  middleware () {
    if (!this.routerFn) {
      return (ctx, next) => next()
    }
    return (ctx, next) => this.routerFn(ctx).then((result) => {
      if (result && result.route && this.handlers.has(result.route)) {
        const handler = this.handlers.get(result.route)
        if (result.state) {
          Object.keys(result.state).forEach((key) => {
            ctx.state[key] = result.state[key]
          })
        }
        return handler(ctx, next)
      } else {
        return next()
      }
    })
  }
}

module.exports = Router
