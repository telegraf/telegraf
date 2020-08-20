import BaseScene from './base'
import Composer from '../composer'
import Context from '../context'
import d from 'debug'
import { hasPropType } from '../util'
import { SceneContextOptions } from '../types'
const debug = d('telegraf:scenes:context')

const noop = () => Promise.resolve()
const now = () => Math.floor(Date.now() / 1000)

class SceneContext<TContext extends Context> {
  constructor(
    private readonly ctx: TContext,
    private readonly scenes: Map<string, BaseScene<TContext>>,
    private readonly options: SceneContextOptions
  ) {}

  get session() {
    const sessionName = this.options.sessionName
    let session = (this.ctx as any)[sessionName].__scenes ?? {}
    if (session.expires < now()) {
      session = {}
    }
    ;(this.ctx as any)[sessionName].__scenes = session
    return session
  }

  get state() {
    this.session.state = this.session.state || {}
    return this.session.state
  }

  set state(value) {
    this.session.state = { ...value }
  }

  get current() {
    const sceneId = this.session.current || this.options.default
    return sceneId && this.scenes.has(sceneId) ? this.scenes.get(sceneId) : null
  }

  reset() {
    const sessionName = this.options.sessionName
    delete (this.ctx as any)[sessionName].__scenes
  }

  enter(sceneId: string, initialState: any, silent?: boolean) {
    if (!this.scenes.has(sceneId)) {
      throw new Error(`Can't find scene: ${sceneId}`)
    }
    const leave = silent ? noop() : this.leave()
    return leave.then(() => {
      debug('Enter scene', sceneId, initialState, silent)
      this.session.current = sceneId
      this.state = initialState
      const ttl = this.current.ttl ?? this.options.ttl
      if (ttl) {
        this.session.expires = now() + ttl
      }
      if (silent) {
        return Promise.resolve()
      }
      const handler = hasPropType(this.current, 'enterMiddleware', 'function')
        ? this.current.enterMiddleware()
        : this.current.middleware()
      return handler(this.ctx, noop)
    })
  }

  reenter() {
    return this.enter(this.session.current, this.state)
  }

  async leave() {
    debug('Leave scene')
    const handler =
      this.current?.leaveMiddleware != null
        ? this.current.leaveMiddleware()
        : Composer.passThru()
    await handler(this.ctx, noop)
    return this.reset()
  }
}

// eslint-disable-next-line
namespace SceneContext {
  export interface Extension<TContext extends Context> {
    scene: SceneContext<TContext>
  }
  export type Extended<TContext extends Context> = TContext &
    Extension<TContext>
}

export = SceneContext
