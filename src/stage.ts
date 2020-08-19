import { Middleware, SceneContextOptions } from './types'
import BaseScene from './scenes/base'
import Composer from './composer'
import SceneContext from './scenes/context'
import TelegrafContext from './context'
const { compose, optional, lazy, passThru } = Composer

class Stage<TContext extends TelegrafContext> extends Composer<TContext> {
  options: SceneContextOptions
  scenes: Map<string, BaseScene<TContext>>
  constructor(
    scenes: Array<BaseScene<TContext>> = [],
    options?: SceneContextOptions
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

  middleware(): Middleware.Fn<TContext> {
    const handler = compose([
      (ctx: TContext, next) => {
        ctx.scene = new SceneContext<TContext>(ctx, this.scenes, this.options)
        return next()
      },
      super.middleware() as Middleware.Fn<TelegrafContext>,
      lazy((ctx) => ctx.scene.current || passThru()),
    ])
    return optional(
      (ctx: { [key: string]: any }) => ctx[this.options.sessionName],
      handler
    ) as Middleware.Fn<TContext>
  }

  static enter<TContext extends TelegrafContext>(
    ...args: Parameters<SceneContext<TContext>['enter']>
  ) {
    return (ctx: TContext) => ctx.scene.enter(...args)
  }

  static reenter<TContext extends TelegrafContext>(
    ...args: Parameters<SceneContext<TContext>['reenter']>
  ) {
    return (ctx: TContext) => ctx.scene.reenter(...args)
  }

  static leave<TContext extends TelegrafContext>(
    ...args: Parameters<SceneContext<TContext>['leave']>
  ) {
    return (ctx: TContext) => ctx.scene.leave(...args)
  }
}

export = Stage
