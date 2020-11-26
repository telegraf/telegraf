import Composer from '../composer'
import Context from '../context'
import { Middleware } from '../types'
const { compose } = Composer

export interface SceneOptions<C extends Context> {
  ttl?: number
  handlers: ReadonlyArray<Middleware.Fn<C>>
  enterHandlers: ReadonlyArray<Middleware.Fn<C>>
  leaveHandlers: ReadonlyArray<Middleware.Fn<C>>
}

export class BaseScene<C extends Context> extends Composer<C> {
  id: string
  ttl?: number
  enterHandler: Middleware.Fn<C>
  leaveHandler: Middleware.Fn<C>
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
