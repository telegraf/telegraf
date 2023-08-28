import { isSessionContext, SessionContext } from '../session'
import SceneContextScene, {
  DefaultSceneSessionData,
  SceneContextSceneOptions,
  SceneSession,
  SceneContext,
  SceneSessionData,
} from './context'
import { BaseScene } from './base'
import { Composer } from '../composer'
import { Context } from '../context'
import { Modify } from './utilTypes'

type D = DefaultSceneSessionData

export class Stage<
  C extends SessionContext<SceneSession<D>> & {
    scene: SceneContextScene<D>
  }
> extends Composer<C> {
  options: Partial<SceneContextSceneOptions<D>>
  scenes: Map<string, BaseScene<C>>

  constructor(
    scenes: ReadonlyArray<BaseScene<C>> = [],
    options?: Partial<SceneContextSceneOptions<D>>
  ) {
    super()
    this.options = { ...options }
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
        const scenes: Map<string, BaseScene<C>> = this.scenes
        const scene = new SceneContextScene<object>(ctx, scenes, this.options)
        ctx.scene = scene
        return next()
      },
      super.middleware(),
      Composer.lazy<C>((ctx) => ctx.scene.current ?? Composer.passThru()),
    ])
    return Composer.optional(isSessionContext, handler)
  }

  static enter<D extends SceneSessionData<object, true>, C>(
    ...args: Parameters<SceneContext<D>['scene']['enter']>
  ) {
    return (ctx: Modify<C, SceneContext<D>>) => ctx.scene.enter(...args)
  }

  static reenter<D extends SceneSessionData<object, true>, C>(
    ...args: Parameters<SceneContext<D>['scene']['reenter']>
  ) {
    return (ctx: Modify<C, SceneContext<D>>) => ctx.scene.reenter(...args)
  }

  static leave<D extends SceneSessionData<object, true>, C>(
    ...args: Parameters<SceneContext<D>['scene']['leave']>
  ) {
    return (ctx: Modify<C, SceneContext<D>>) => ctx.scene.leave(...args)
  }
}
