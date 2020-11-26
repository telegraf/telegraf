import BaseScene, { SceneOptions } from '../base'
import WizardContext, { WizardSession } from './context'
import Composer from '../../composer'
import Context from '../../context'
import { Middleware } from '../../types'
import SceneContext from '../context'

export class WizardScene<
    S extends WizardSession = WizardSession,
    C extends WizardContext.Extended<
      S,
      SceneContext.Extended<S, Context>
    > = WizardContext.Extended<S, SceneContext.Extended<S, Context>>
  >
  extends BaseScene<C>
  implements Middleware.Obj<WizardContext.Extended<S, C>> {
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
    return Composer.compose<C, WizardContext.Extension<S, C>>([
      (ctx, next) => {
        const wizard = new WizardContext<S, C>(ctx, this.steps)
        return next(Object.assign(ctx, { wizard }))
      },
      super.middleware(),
      (ctx, next) => {
        if (ctx.wizard.step === false) {
          ctx.wizard.selectStep(0)
          return ctx.scene.leave()
        }
        return Composer.unwrap(ctx.wizard.step)(ctx, next)
      },
    ])
  }
}
