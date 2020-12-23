import SceneContextScene, { SceneContext } from './scenes/context'
import BaseScene from './scenes/base'
import Composer from './composer'
import { isSessionContext } from './session'

export class Stage<C extends SceneContext> extends Composer<C> {
  options: SceneContextScene.Options
  scenes: Map<string, BaseScene<C>>

  constructor(
    scenes: ReadonlyArray<BaseScene<C>> = [],
    options?: SceneContextScene.Options
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
      if (scene?.id == null || typeof scene.middleware !== 'function') {
        throw new Error('telegraf: Unsupported scene')
      }
      this.scenes.set(scene.id, scene)
    })
    return this
  }

  middleware() {
    const handler = Composer.compose<C>([
      (ctx, next) => {
        ctx.scene = new SceneContextScene<C>(ctx, this.scenes, this.options)
        return next()
      },
      super.middleware(),
      Composer.lazy<C>((ctx) => ctx.scene.current ?? Composer.passThru()),
    ])
    return Composer.optional(isSessionContext, handler)
  }

  static enter<C extends SceneContext = SceneContext>(
    ...args: Parameters<SceneContextScene<C>['enter']>
  ) {
    return (ctx: SceneContext) => ctx.scene.enter(...args)
  }

  static reenter<C extends SceneContext = SceneContext>(
    ...args: Parameters<SceneContextScene<C>['reenter']>
  ) {
    return (ctx: SceneContext) => ctx.scene.reenter(...args)
  }

  static leave<C extends SceneContext>(
    ...args: Parameters<SceneContextScene<C>['leave']>
  ) {
    return (ctx: SceneContext) => ctx.scene.leave(...args)
  }
}
