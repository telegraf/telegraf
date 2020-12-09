import BaseScene, { SceneOptions } from '../base'
import WizardContextWizard, { WizardContext } from './context'
import Composer from '../../composer'
import { Middleware } from '../../types'

export class WizardScene<C extends WizardContext = WizardContext>
  extends BaseScene<C>
  implements Middleware.Obj<C> {
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
    return Composer.compose<C, WizardContext>([
      (ctx, next) => {
        const wizard = new WizardContextWizard<C>(ctx, this.steps)
        return next(Object.assign(ctx, { wizard }))
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
