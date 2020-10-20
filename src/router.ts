/** @format */

import { Middleware, NonemptyReadonlyArray } from './types'
import Composer from './composer'
import Context from './context'

type RouteFn<TContext extends Context> = (
  ctx: TContext
) => {
  route: string
  context?: Partial<TContext>
  state?: Partial<TContext['state']>
} | null

export class Router<TContext extends Context>
  implements Middleware.Obj<TContext> {
  private otherwiseHandler: Middleware<TContext> = Composer.passThru()

  constructor(
    private readonly routeFn: RouteFn<TContext>,
    public handlers = new Map<string, Middleware<TContext>>()
  ) {
    if (typeof routeFn !== 'function') {
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
    return Composer.lazy<TContext>(async (ctx) => {
      const result = this.routeFn(ctx)
      if (result == null) {
        return this.otherwiseHandler
      }
      Object.assign(ctx, result.context)
      Object.assign(ctx.state, result.state)
      return this.handlers.get(result.route) ?? this.otherwiseHandler
    })
  }
}
