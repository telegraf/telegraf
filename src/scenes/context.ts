import BaseScene from './base'
import Composer from '../composer'
import Context from '../context'
import d from 'debug'
const debug = d('telegraf:scenes:context')

const noop = () => Promise.resolve()
const now = () => Math.floor(Date.now() / 1000)

export interface SceneSession {
  current?: string
  expires?: number
  state?: object
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace SceneContext {
  export interface Options<D = {}> {
    sessionName: string
    ttl?: number
    default?: string
    defaultSession?: D
  }
  export interface Extension<S extends SceneSession, C extends Context> {
    scene: SceneContext<S, C>
  }
  export type Extended<S extends SceneSession, C extends Context> = C &
    Extension<S, C>
}

class SceneContext<S extends SceneSession, C extends Context> {
  private readonly options: SceneContext.Options<S> = {
    sessionName: 'session',
  }

  constructor(
    private readonly ctx: C,
    private readonly scenes: Map<string, BaseScene<C>>,
    options: Partial<SceneContext.Options<S>>
  ) {
    this.options = { sessionName: 'session', ...options }
  }

  get session() {
    const sessionName = this.options.sessionName
    let session: S = (this.ctx as any)[sessionName].__scenes ?? {}
    if (session.expires !== undefined && session.expires < now()) {
      // @ts-expect-error the default session object may not be given
      session = this.options.defaultSession ?? {}
    }
    ;(this.ctx as any)[sessionName].__scenes = session
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
    const sessionName = this.options.sessionName
    delete (this.ctx as any)[sessionName].__scenes
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
