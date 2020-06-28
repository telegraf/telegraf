/** @format */

import { TelegrafContext } from './context'
import { Middleware, Composer, MiddlewareFn } from './composer'
import {
  WizardScene,
  WizardContextMessageUpdate,
  WizardContext,
} from './wizard'

export interface SceneContextOptions {
  sessionName: string
  default?: string
  ttl?: number
}

export interface SceneContext<TContext extends SceneContextMessageUpdate> {
  ctx: TContext

  scenes: Map<string, Scene>

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

export type Scene =
  | BaseScene<SceneContextMessageUpdate>
  | WizardScene<WizardContextMessageUpdate>

export type StageOptions = SceneContextOptions

declare class Context extends TelegrafContext {
  scene?: SceneContext<SceneContextMessageUpdate>
  wizard?: WizardContext<WizardContextMessageUpdate>
}

export declare class Stage extends Composer<Context> {
  constructor(scenes: Scene[], options?: Partial<StageOptions>)

  register: (...scenes: Scene[]) => this

  middleware: () => MiddlewareFn<Context>

  static enter: (
    sceneId: string,
    initialState?: object,
    silent?: boolean
  ) => Middleware<Context>

  static reenter: () => Middleware<Context>

  static leave: () => Middleware<Context>
}
