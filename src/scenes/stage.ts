import { isSessionContext, SessionContext } from '../session'
import SceneContextScene, {
  SceneContextSceneOptions,
  SceneSession,
  SceneSessionData,
} from './context'
import { BaseScene } from './base'
import { Composer } from '../composer'
import { Context } from '../context'

export class Stage<
  C extends SessionContext<SceneSession<D>> & {
    scene: SceneContextScene<C, D>
  },
  D extends SceneSessionData = SceneSessionData,
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
        const scene = new SceneContextScene<C, D>(ctx, scenes, this.options)
        ctx.scene = scene
        return next()
      },
      super.middleware(),
      Composer.lazy<C>((ctx) => ctx.scene.current ?? Composer.passThru()),
    ])
    return Composer.optional(isSessionContext, handler)
  }

  static enter<C extends Context & { scene: SceneContextScene<C> }>(
    ...args: Parameters<SceneContextScene<C>['enter']>
  ) {
    return (ctx: C) => ctx.scene.enter(...args)
  }

  static reenter<C extends Context & { scene: SceneContextScene<C> }>(
    ...args: Parameters<SceneContextScene<C>['reenter']>
  ) {
    return (ctx: C) => ctx.scene.reenter(...args)
  }

  static leave<C extends Context & { scene: SceneContextScene<C> }>(
    ...args: Parameters<SceneContextScene<C>['leave']>
  ) {
    return (ctx: C) => ctx.scene.leave(...args)
  }
}
