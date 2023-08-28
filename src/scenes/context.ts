import BaseScene from './base'
import Composer from '../composer'
import Context from '../context'
import d from 'debug'
import { SessionContext } from '../session'
import type { HasAllOptionalProps } from './utilTypes'
const debug = d('telegraf:scenes:context')

const noop = () => Promise.resolve()
const now = () => Math.floor(Date.now() / 1000)

export type DefaultSceneSessionData = {
  current?: string
  expires?: number
  state?: object
}

export type SceneSessionData<
  S extends object,
  MustBeValid extends boolean = false
> = HasAllOptionalProps<S> extends never
  ? MustBeValid extends true
    ? never
    : // This is needed to give the developer some info about what's wrong
      'Error: All state properties must be optional.'
  : {
      current?: string
      expires?: number
      state?: S
    }

export interface SceneSession<
  S extends SceneSessionData<object, true> = SceneSessionData<object>
> {
  __scenes?: S
}

export interface SceneContext<
  D extends SceneSessionData<object, true> = SceneSessionData<object>
> {
  session: SceneSession<D>
  scene: SceneContextScene<D>
}

export interface SceneContextSceneOptions<
  D extends SceneSessionData<object, true>
> {
  ttl?: number
  default?: string
  defaultSession: D
}

type RS<SD extends SceneSessionData<object, true>> = NonNullable<
  NonNullable<SessionContext<SceneSession<SD>>['session']>['__scenes']
>

type D<SD extends SceneSessionData<object, true>> = NonNullable<RS<SD>['state']>

type C<SD extends SceneSessionData<object, true>> = SessionContext<
  SceneSession<SD>
>

export default class SceneContextScene<
  SD extends SceneSessionData<object, true>,
  CC extends C<SD> = C<SD>
> {
  private readonly options: SceneContextSceneOptions<SD>

  constructor(
    private readonly ctx: C<SD>,
    private readonly scenes: Map<string, BaseScene<C<DefaultSceneSessionData>>>,
    options: Partial<SceneContextSceneOptions<SD>>
  ) {
    const fallbackSessionDefault = {} as SD

    this.options = { defaultSession: fallbackSessionDefault, ...options }
  }

  get session(): RS<SD> {
    const defaultSession = { ...this.options.defaultSession }

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

  get state(): D<SD> {
    return (this.session.state ??= {})
  }

  set state(value: D<SD>) {
    this.session.state = { ...value }
  }

  get current() {
    const sceneId = this.session.current ?? this.options.default
    return sceneId === undefined || !this.scenes.has(sceneId)
      ? undefined
      : this.scenes.get(sceneId)
  }

  reset() {
    if (this.ctx.session !== undefined)
      this.ctx.session.__scenes = Object.assign({}, this.options.defaultSession)
  }

  async enter(sceneId: string, initialState: D<SD> = {}, silent = false) {
    if (!this.scenes.has(sceneId)) {
      throw new Error(`Can't find scene: ${sceneId}`)
    }
    if (!silent) {
      await this.leave()
    }
    debug('Entering scene', sceneId, initialState, silent)
    this.session.current = sceneId
    this.state = initialState
    const ttl = this.current?.ttl ?? this.options.ttl
    if (ttl !== undefined) {
      this.session.expires = now() + ttl
    }
    if (this.current === undefined || silent) {
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

  private leaving = false
  async leave() {
    if (this.leaving) return
    debug('Leaving scene')
    try {
      this.leaving = true
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
    } finally {
      this.leaving = false
    }
  }
}
