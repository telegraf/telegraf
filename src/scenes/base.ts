import Composer from '../composer'
import { Middleware } from '../types'
import TelegrafContext from '../context'
const { compose } = Composer

interface SceneOptions<TContext extends TelegrafContext> {
  ttl?: number
  enterHandler: Middleware.Fn<TContext>
  leaveHandler: Middleware.Fn<TContext>
}

export class BaseScene<
  TContext extends TelegrafContext
> extends Composer<TContext> {
  id: string
  options: SceneOptions<TContext>
  enterHandler: Middleware.Fn<TContext>
  leaveHandler: Middleware.Fn<TContext>
  constructor(id: string, options: SceneOptions<TContext>) {
    const opts = {
      handlers: [],
      enterHandlers: [],
      leaveHandlers: [],
      ...options,
    }
    super(...opts.handlers)
    this.id = id
    this.options = opts
    this.enterHandler = compose(opts.enterHandlers)
    this.leaveHandler = compose(opts.leaveHandlers)
  }

  set ttl(value: number | undefined) {
    this.options.ttl = value
  }

  get ttl() {
    return this.options.ttl
  }

  enter(...fns: Array<Middleware<TContext>>) {
    this.enterHandler = compose([this.enterHandler, ...fns])
    return this
  }

  leave(...fns: Array<Middleware<TContext>>) {
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
