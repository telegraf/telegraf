import BaseScene, { SceneOptions } from '../base'
import { Middleware, MiddlewareObj } from '../../middleware'
import WizardContextWizard, {
  WizardSessionData,
  WizardContext,
} from './context'
import Composer from '../../composer'
import Context from '../../context'
import SceneContextScene from '../context'

type WC<
  T extends WizardSessionData<object> & object = WizardSessionData<object>
> = WizardContext<T>

export class WizardScene<
    T extends WizardSessionData<object> & object = WizardSessionData<object>
  >
  extends BaseScene<WC<T>>
  implements MiddlewareObj<WC<T>>
{
  steps: Array<Middleware<WC<T>>>

  constructor(id: string, ...steps: Array<Middleware<WC<T>>>)
  constructor(
    id: string,
    options: SceneOptions<WC<T>>,
    ...steps: Array<Middleware<WC<T>>>
  )
  constructor(
    id: string,
    options: SceneOptions<WC<T>> | Middleware<WC<T>>,
    ...steps: Array<Middleware<WC<T>>>
  ) {
    let opts: SceneOptions<WC<T>> | undefined
    let s: Array<Middleware<WC<T>>>
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
    return Composer.compose<WC<T>>([
      (ctx, next) => {
        ctx.wizard = new WizardContextWizard<WC<T>, T>(ctx, this.steps)
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

  enterMiddleware() {
    return Composer.compose([this.enterHandler, this.middleware()])
  }
}
