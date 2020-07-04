/** @format */

import Composer from './composer'
import type Context from './context'
import type { Middleware, NonemptyReadonlyArray } from './types'

type RouteFn<TContext extends Context> = (
  ctx: TContext
) => {
  route: string
  context?: Partial<TContext>
  state?: Partial<TContext['state']>
} | null

class Router<TContext extends Context> implements Middleware.Obj<TContext> {
  private otherwiseHandler: Middleware<TContext> = Composer.passThru()

  constructor(
    private readonly routeFn: RouteFn<TContext>,
    public handlers = new Map<string, Middleware<TContext>>()
  ) {
    if (!routeFn) {
      throw new Error('Missing routing function')
    }
  }

  on(route: string, ...fns: NonemptyReadonlyArray<Middleware<TContext>>) {
    if (fns.length === 0) {
      throw new TypeError('At least one handler must be provided')
    }
    this.handlers.set(route, Composer.compose(fns))
    return this
  }

  otherwise(...fns: NonemptyReadonlyArray<Middleware<TContext>>) {
    if (fns.length === 0) {
      throw new TypeError('At least one otherwise handler must be provided')
    }
    this.otherwiseHandler = Composer.compose(fns)
    return this
  }

  middleware() {
    return Composer.lazy<TContext>((ctx) => {
      return Promise.resolve(this.routeFn(ctx)).then((result) => {
        if (!result || !result.route || !this.handlers.has(result.route)) {
          return this.otherwiseHandler
        }
        Object.assign(ctx, result.context)
        Object.assign(ctx.state, result.state)
        return this.handlers.get(result.route) ?? this.otherwiseHandler
      })
    })
  }
}

export = Router
