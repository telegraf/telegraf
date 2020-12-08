import SceneCxt, { SceneSessionData } from './scenes/context'
import WizardCxt, { WizardSessionData } from './scenes/wizard/context'
import BaseScene from './scenes/base'
import Composer from './composer'
import Context from './context'
import { isSessionContext } from './session'
import { Middleware } from './types'

export type SceneContext<
  S extends SceneSessionData = SceneSessionData,
  C extends Context = Context
> = SceneCxt.Extended<S, C>
export type WizardContext<
  S extends WizardSessionData = WizardSessionData,
  C extends SceneCxt.Extended<S, Context> = SceneCxt.Extended<S, Context>
> = WizardCtx.Extended<S, C>

export class Stage<
    S extends SceneSessionData = SceneSessionData,
    C extends Context = Context
  >
  extends Composer<SceneCxt.Extended<S, C>>
  implements Middleware.Obj<C> {
  options: SceneCxt.Options<S>
  scenes: Map<string, BaseScene<C>>

  constructor(
    scenes: ReadonlyArray<BaseScene<C>> = [],
    options?: Partial<SceneCxt.Options<S>>
  ) {
    super()
    this.options = {
      ...options,
    }
    this.scenes = new Map<string, BaseScene<C>>()
    scenes.forEach((scene) => this.register(scene))
  }

  register(...scenes: ReadonlyArray<BaseScene<C>>) {
    scenes.forEach((scene) => {
      if (!scene?.id || typeof scene.middleware !== 'function') {
        throw new Error('telegraf: Unsupported scene')
      }
      this.scenes.set(scene.id, scene)
    })
    return this
  }

  middleware() {
    const handler = Composer.compose<C, SceneCxt.Extension<S, C>>([
      (ctx, next) => {
        const scene = new SceneCxt<S, C>(ctx, this.scenes, this.options)
        return next(Object.assign(ctx, { scene }))
      },
      super.middleware(),
      Composer.lazy<SceneCxt.Extended<S, C>>(
        (ctx) => ctx.scene.current ?? Composer.passThru()
      ),
    ])
    return Composer.optional(isSessionContext, handler)
  }

  static enter<
    S extends SceneSessionData = SceneSessionData,
    C extends Context = Context
  >(...args: Parameters<SceneCxt<S, C>['enter']>) {
    return (ctx: SceneCxt.Extended<S, C>) => ctx.scene.enter(...args)
  }

  static reenter<
    S extends SceneSessionData = SceneSessionData,
    C extends Context = Context
  >(...args: Parameters<SceneCxt<S, C>['reenter']>) {
    return (ctx: SceneCxt.Extended<S, C>) => ctx.scene.reenter(...args)
  }

  static leave<
    S extends SceneSessionData = SceneSessionData,
    C extends Context = Context
  >(...args: Parameters<SceneCxt<S, C>['leave']>) {
    return (ctx: SceneCxt.Extended<S, C>) => ctx.scene.leave(...args)
  }
}
