/** @format */

import { Middleware, NonemptyReadonlyArray } from './types'
import Composer from './composer'
import Context from './context'

type RouteFn<C extends Context> = (
  ctx: C
) => {
  route: string
  context?: Partial<C>
  state?: Partial<C['state']>
} | null

export class Router<C extends Context> implements Middleware.Obj<C> {
  private otherwiseHandler: Middleware<C> = Composer.passThru()

  constructor(
    private readonly routeFn: RouteFn<C>,
    public handlers = new Map<string, Middleware<C>>()
  ) {
    if (typeof routeFn !== 'function') {
      throw new Error('Missing routing function')
    }
  }

  on(route: string, ...fns: NonemptyReadonlyArray<Middleware<C>>) {
    if (fns.length === 0) {
      throw new TypeError('At least one handler must be provided')
    }
    this.handlers.set(route, Composer.compose(fns))
    return this
  }

  otherwise(...fns: NonemptyReadonlyArray<Middleware<C>>) {
    if (fns.length === 0) {
      throw new TypeError('At least one otherwise handler must be provided')
    }
    this.otherwiseHandler = Composer.compose(fns)
    return this
  }

  middleware() {
    return Composer.lazy<C>((ctx) => {
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
