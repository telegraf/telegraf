/** @format */

import { TelegrafContext } from './context'
import { Middleware, Composer, MiddlewareFn } from './composer'

export interface SceneContextOptions {
  sessionName: string
  default?: string
  ttl?: number
}

export interface SceneContext<TContext extends SceneContextMessageUpdate> {
  ctx: TContext

  scenes: Map<string, Scene<TContext>>

  options: SceneContextOptions

  readonly session: {
    state?: object
    current?: string
    expires?: number
  }

  state: object

  readonly current: BaseScene<TContext> | null

  reset: () => void

  enter: (
    sceneId: string,
    initialState?: object,
    silent?: boolean
  ) => Promise<any>

  reenter: () => Promise<any>

  leave: () => Promise<any>
}

export interface SceneContextMessageUpdate extends TelegrafContext {
  scene: SceneContext<this>
}
export interface BaseSceneOptions<TContext extends SceneContextMessageUpdate> {
  handlers: Middleware<TContext>[]
  enterHandlers: Middleware<TContext>[]
  leaveHandlers: Middleware<TContext>[]
  ttl?: number
}

export class BaseScene<
  TContext extends SceneContextMessageUpdate
> extends Composer<TContext> {
  constructor(id: string, options?: Partial<BaseSceneOptions<TContext>>)

  id: string

  options: BaseSceneOptions<TContext>

  enterHandler: Middleware<TContext>

  leaveHandler: Middleware<TContext>

  ttl?: number

  enter: (...fns: Middleware<TContext>[]) => this

  leave: (...fns: Middleware<TContext>[]) => this

  enterMiddleware: () => Middleware<TContext>

  leaveMiddleware: () => Middleware<TContext>
}

export type Scene<TContext extends SceneContextMessageUpdate> = BaseScene<
  TContext
>

export type StageOptions = SceneContextOptions

export class Stage<TContext extends SceneContextMessageUpdate> extends Composer<
  TContext
> {
  constructor(scenes: Scene<TContext>[], options?: Partial<StageOptions>)

  register: (...scenes: Scene<TContext>[]) => this

  middleware: () => MiddlewareFn<TContext>

  static enter: (
    sceneId: string,
    initialState?: object,
    silent?: boolean
  ) => Middleware<SceneContextMessageUpdate>

  static reenter: () => Middleware<SceneContextMessageUpdate>

  static leave: () => Middleware<SceneContextMessageUpdate>
}
