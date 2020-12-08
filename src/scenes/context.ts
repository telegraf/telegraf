import BaseScene from './base'
import Composer from '../composer'
import Context from '../context'
import d from 'debug'
import { SessionContext } from '../session'
const debug = d('telegraf:scenes:context')

const noop = () => Promise.resolve()
const now = () => Math.floor(Date.now() / 1000)

export interface SceneSession<S extends SceneSessionData = SceneSessionData> {
  __scenes?: S
}

export interface SceneSessionData {
  current?: string
  expires?: number
  state?: object
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace SceneContext {
  export interface Options<D = {}> {
    ttl?: number
    default?: string
    defaultSession?: D
  }
  export interface Extension<S extends SceneSessionData, C extends Context> {
    scene: SceneContext<S, C>
  }
  export type Extended<S extends SceneSessionData, C extends Context> = C &
    Extension<S, C>
}

class SceneContext<
  S extends SceneSessionData = SceneSessionData,
  C extends SessionContext<SceneSession<S>> = SessionContext<SceneSession<S>>
> {
  private readonly options: SceneContext.Options<S> = {}

  constructor(
    private readonly ctx: C,
    private readonly scenes: Map<string, BaseScene<C>>,
    options: SceneContext.Options<S>
  ) {
    this.options = { ...options }
  }

  get session() {
    // @ts-expect-error S may require unknown properties but no default is given
    const defaultSession: S = this.options.defaultSession ?? {}

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
    delete this.ctx.session?.__scenes
  }

  async enter(
    sceneId: string,
    initialState: object = {},
    silent: boolean = false
  ) {
    if (!this.scenes.has(sceneId)) {
      throw new Error(`Can't find scene: ${sceneId}`)
    }
    if (!silent) {
      await this.leave()
    }
    debug('Enter scene', sceneId, initialState, silent)
    this.session.current = sceneId
    this.state = initialState
    const ttl = this.current?.ttl ?? this.options.ttl
    if (ttl !== undefined) {
      this.session.expires = now() + ttl
    }
    if (!this.current || silent) {
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
    debug('Leave scene')
    if (!this.current) {
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

export default SceneContext
