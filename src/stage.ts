import { isSessionContext, SessionContext } from './session'
import SceneCtx, { SceneSession, SceneSessionData } from './scenes/context'
import WizardCtx, { WizardSessionData } from './scenes/wizard/context'
import BaseScene from './scenes/base'
import Composer from './composer'
import Context from './context'
import { Middleware } from './types'

export type SceneContext<
  S extends SceneSessionData = SceneSessionData,
  C extends SessionContext<SceneSession<S>> = SessionContext<SceneSession<S>>
> = SceneCtx.Extended<S, C>
export type WizardContext<
  S extends WizardSessionData = WizardSessionData,
  C extends SceneCtx.Extended<S, Context> = SceneCtx.Extended<S, Context>
> = WizardCtx.Extended<S, C>

export class Stage<
    S extends SceneSessionData = SceneSessionData,
    C extends SessionContext<SceneSession<S>> = SessionContext<SceneSession<S>>
  >
  extends Composer<SceneCtx.Extended<S, C>>
  implements Middleware.Obj<C> {
  options: SceneCtx.Options<S>
  scenes: Map<string, BaseScene<C>>

  constructor(
    scenes: ReadonlyArray<BaseScene<C>> = [],
    options?: Partial<SceneCtx.Options<S>>
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
    const handler = Composer.compose<C, SceneCtx.Extension<S, C>>([
      (ctx, next) => {
        const scene = new SceneCtx<S, C>(ctx, this.scenes, this.options)
        return next(Object.assign(ctx, { scene }))
      },
      super.middleware(),
      Composer.lazy<SceneCtx.Extended<S, C>>(
        (ctx) => ctx.scene.current ?? Composer.passThru()
      ),
    ])
    return Composer.optional(isSessionContext, handler)
  }

  static enter<
    S extends SceneSessionData = SceneSessionData,
    C extends Context = Context
  >(...args: Parameters<SceneCtx<S, C>['enter']>) {
    return (ctx: SceneCtx.Extended<S, C>) => ctx.scene.enter(...args)
  }

  static reenter<
    S extends SceneSessionData = SceneSessionData,
    C extends Context = Context
  >(...args: Parameters<SceneCtx<S, C>['reenter']>) {
    return (ctx: SceneCtx.Extended<S, C>) => ctx.scene.reenter(...args)
  }

  static leave<
    S extends SceneSessionData = SceneSessionData,
    C extends Context = Context
  >(...args: Parameters<SceneCtx<S, C>['leave']>) {
    return (ctx: SceneCtx.Extended<S, C>) => ctx.scene.leave(...args)
  }
}
