import BaseScene from './base'
import Composer from '../composer'
import d from 'debug'
import { SessionContext } from '../session'
const debug = d('telegraf:scenes:context')

const noop = () => Promise.resolve()
const now = () => Math.floor(Date.now() / 1000)

type Z0 = SceneContextScene<SceneContext>
type S0 = SceneSessionData

export interface SceneSessionData {
  current?: string
  expires?: number
  state?: object
}

export interface SceneSession<S extends S0 = S0> {
  __scenes: S
}

export type SceneContext<Z extends Z0 = Z0, S extends S0 = S0> = SessionContext<
  SceneSession<S>
> & {
  scene: Z
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace SceneContextScene {
  export interface Options {
    ttl?: number
    default?: string
    defaultSession?: SceneSessionData
  }
}

class SceneContextScene<C extends SceneContext> {
  private readonly options: SceneContextScene.Options = {}

  constructor(
    private readonly ctx: C,
    private readonly scenes: Map<string, BaseScene<C>>,
    options: SceneContextScene.Options
  ) {
    this.options = { ...options }
  }

  get session(): C['session']['__scenes'] {
    const defaultSession = this.options.defaultSession ?? {}

    let session = this.ctx.session?.__scenes ?? defaultSession
    if (session.expires !== undefined && session.expires < now()) {
      session = defaultSession
    }
    if (this.ctx.session === undefined) {
      this.ctx.session = { __scenes: session }
    } else {
      this.ctx.session.__scenes = session
    }
    return session
  }

  get state() {
    return (this.session.state ??= {})
  }

  set state(value) {
    this.session.state = { ...value }
  }

  get current() {
    const sceneId = this.session.current ?? this.options.default
    return sceneId === undefined || !this.scenes.has(sceneId)
      ? undefined
      : this.scenes.get(sceneId)
  }

  reset() {
    this.ctx.session.__scenes = {}
  }

  async enter(sceneId: string, initialState = {}) {
    if (!this.scenes.has(sceneId)) {
      throw new Error(`Can't find scene: ${sceneId}`)
    }
    await this.leave()
    debug('Entering scene', sceneId, initialState)
    this.session.current = sceneId
    this.state = initialState
    const ttl = this.current?.ttl ?? this.options.ttl
    if (ttl !== undefined) {
      this.session.expires = now() + ttl
    }
    if (this.current === undefined) {
      return
    }
    const handler =
      'enterMiddleware' in this.current &&
      typeof this.current.enterMiddleware === 'function'
        ? this.current.enterMiddleware()
        : this.current.middleware()
    return await handler(this.ctx, noop)
  }

  reenter() {
    return this.session.current === undefined
      ? undefined
      : this.enter(this.session.current, this.state)
  }

  async leave() {
    debug('Leaving scene')
    if (this.current === undefined) {
      return
    }
    const handler =
      'leaveMiddleware' in this.current &&
      typeof this.current.leaveMiddleware === 'function'
        ? this.current.leaveMiddleware()
        : Composer.passThru()
    await handler(this.ctx, noop)
    return this.reset()
  }
}

export default SceneContextScene
