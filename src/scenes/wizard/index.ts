import Composer from '../../composer'
import Context from '../../context'
import { Middleware } from '../../types'
import SceneContext from '../context'
import WizardContext from './context'
const { compose, unwrap } = Composer

export class WizardScene<TContext extends SceneContext.Extended<Context>>
  extends Composer<TContext>
  implements Middleware.Obj<WizardContext.Extended<TContext>> {
  options: any
  leaveHandler: Middleware.Fn<TContext>
  constructor(
    readonly id: string,
    options: Middleware.Fn<TContext> | ReadonlyArray<Middleware.Fn<TContext>>,
    ...steps: Array<Middleware.Fn<TContext>>
  ) {
    super()
    this.options =
      typeof options === 'function'
        ? { steps: [options, ...steps], leaveHandlers: [] }
        : { steps: steps, leaveHandlers: [], ...options }
    this.leaveHandler = compose(this.options.leaveHandlers)
  }

  set ttl(value: number | undefined) {
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
    return Composer.compose<TContext, WizardContext.Extension<TContext>>([
      (ctx, next) => {
        const wizard = new WizardContext<TContext>(ctx, this.options.steps)
        return next(Object.assign(ctx, { wizard }))
      },
      super.middleware(),
      (ctx, next) => {
        if (ctx.wizard.step === false) {
          ctx.wizard.selectStep(0)
          return ctx.scene.leave()
        }
        return unwrap(ctx.wizard.step)(ctx, next)
      },
    ])
  }
}
