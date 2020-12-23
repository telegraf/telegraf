import BaseScene, { SceneOptions } from '../base'
import { Middleware, MiddlewareFn, MiddlewareObj } from '../../middleware'
import WizardContextWizard, { WizardContext } from './context'
import Composer from '../../composer'

export class WizardScene<C extends WizardContext = WizardContext>
  extends BaseScene<C>
  implements MiddlewareObj<C> {
  steps: Array<Middleware<C>>

  constructor(id: string, ...steps: Array<Middleware<C>>)
  constructor(
    id: string,
    options: SceneOptions<C>,
    ...steps: Array<Middleware<C>>
  )
  constructor(
    id: string,
    options: SceneOptions<C> | Middleware<C>,
    ...steps: Array<Middleware<C>>
  ) {
    let opts: SceneOptions<C> | undefined
    let s: Array<Middleware<C>>
    if (typeof options === 'function' || 'middleware' in options) {
      opts = undefined
      s = [options, ...steps]
    } else {
      opts = options
      s = steps
    }
    super(id, opts)
    this.steps = s
  }

  middleware() {
    return Composer.compose<C>([
      (ctx, next) => {
        const steps = this.steps as Array<MiddlewareFn<WizardContext>>
        ctx.wizard = new WizardContextWizard<WizardContext>(ctx, steps)
        return next()
      },
      super.middleware(),
      (ctx, next) => {
        if (ctx.wizard.step === undefined) {
          ctx.wizard.selectStep(0)
          return ctx.scene.leave()
        }
        return Composer.unwrap(ctx.wizard.step)(ctx, next)
      },
    ])
  }
}
