import BaseScene from './scenes/base'
import Composer from './composer'
import Context from './context'
import { Middleware } from './types'
import SceneContext from './scenes/context'

class Stage<TContext extends Context>
  extends Composer<SceneContext.Extended<TContext>>
  implements Middleware.Obj<TContext> {
  options: SceneContext.Options
  scenes: Map<string, BaseScene<TContext>>
  constructor(
    scenes: ReadonlyArray<BaseScene<TContext>> = [],
    options?: SceneContext.Options
  ) {
    super()
    this.options = {
      sessionName: 'session',
      ...options,
    }
    this.scenes = new Map()
    scenes.forEach((scene) => this.register(scene))
  }

  register(...scenes: Array<BaseScene<TContext>>) {
    scenes.forEach((scene) => {
      if (!scene || !scene.id || typeof scene.middleware !== 'function') {
        throw new Error('telegraf: Unsupported scene')
      }
      this.scenes.set(scene.id, scene)
    })
    return this
  }

  middleware() {
    const handler = Composer.compose<
      TContext,
      SceneContext.Extension<TContext>
    >([
      (ctx, next) => {
        const scene = new SceneContext(ctx, this.scenes, this.options)
        return next(Object.assign(ctx, { scene }))
      },
      super.middleware(),
      Composer.lazy((ctx) => ctx.scene.current ?? Composer.passThru()),
    ])
    return Composer.optional(
      (ctx: any) => ctx[this.options.sessionName],
      handler
    )
  }

  static enter(...args: Parameters<SceneContext<Context>['enter']>) {
    return (ctx: SceneContext.Extended<Context>) => ctx.scene.enter(...args)
  }

  static reenter(...args: Parameters<SceneContext<Context>['reenter']>) {
    return (ctx: SceneContext.Extended<Context>) => ctx.scene.reenter(...args)
  }

  static leave(...args: Parameters<SceneContext<Context>['leave']>) {
    return (ctx: SceneContext.Extended<Context>) => ctx.scene.leave(...args)
  }
}

export = Stage
