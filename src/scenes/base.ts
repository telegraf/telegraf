import { Middleware, MiddlewareFn } from '../middleware'
import Composer from '../composer'
import Context from '../context'

const { compose } = Composer

export interface SceneOptions<C extends Context> {
  ttl?: number
  handlers: ReadonlyArray<MiddlewareFn<C>>
  enterHandlers: ReadonlyArray<MiddlewareFn<C>>
  leaveHandlers: ReadonlyArray<MiddlewareFn<C>>
}

export class BaseScene<C extends Context = Context> extends Composer<C> {
  id: string
  ttl?: number
  enterHandler: MiddlewareFn<C>
  leaveHandler: MiddlewareFn<C>
  constructor(id: string, options?: SceneOptions<C>) {
    const opts: SceneOptions<C> = {
      handlers: [],
      enterHandlers: [],
      leaveHandlers: [],
      ...options,
    }
    super(...opts.handlers)
    this.id = id
    this.ttl = opts.ttl
    this.enterHandler = compose(opts.enterHandlers)
    this.leaveHandler = compose(opts.leaveHandlers)
  }

  enter(...fns: Array<Middleware<C>>) {
    this.enterHandler = compose([this.enterHandler, ...fns])
    return this
  }

  leave(...fns: Array<Middleware<C>>) {
    this.leaveHandler = compose([this.leaveHandler, ...fns])
    return this
  }

  enterMiddleware() {
    return this.enterHandler
  }

  leaveMiddleware() {
    return this.leaveHandler
  }
}

export default BaseScene
