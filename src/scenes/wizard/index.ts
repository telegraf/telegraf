import Composer from '../../composer'
import TelegrafContext from '../../context'
import { Middleware } from '../../types'
import WizardContext from './context'
const { compose, unwrap } = Composer

type WizardSceneOptions<TContext extends TelegrafContext> =
  | Middleware.Fn<TContext>
  | Array<Middleware.Fn<TContext>>

class WizardScene<TContext extends TelegrafContext> extends Composer<TContext> {
  id: string
  options: any
  leaveHandler: Middleware.Fn<TContext>
  constructor(
    id: string,
    options: Middleware.Fn<TContext> | Array<Middleware.Fn<TContext>>,
    ...steps: Array<Middleware.Fn<TContext>>
  ) {
    super()
    this.id = id
    this.options =
      typeof options === 'function'
        ? { steps: [options, ...steps], leaveHandlers: [] }
        : { steps: steps, leaveHandlers: [], ...options }
    this.leaveHandler = compose(this.options.leaveHandlers)
  }

  set ttl(value) {
    this.options.ttl = value
  }

  get ttl() {
    return this.options.ttl
  }

  leave(...fns: Array<Middleware.Fn<TContext>>) {
    this.leaveHandler = compose([this.leaveHandler, ...fns])
    return this
  }

  leaveMiddleware() {
    return this.leaveHandler
  }

  middleware() {
    return compose([
      (ctx, next) => {
        const wizard = new WizardContext(ctx, this.options.steps)
        ctx.wizard = wizard
        return next()
      },
      super.middleware() as Middleware.Fn<TelegrafContext>,
      (ctx, next) => {
        if (!ctx.wizard.step) {
          ctx.wizard.selectStep(0)
          return ctx.scene.leave()
        }
        return unwrap(ctx.wizard.step)(ctx, next)
      },
    ])
  }
}

export = WizardScene
