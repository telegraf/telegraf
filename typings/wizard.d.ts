/** @format */

import { TelegrafContext } from './context'
import { Middleware, Composer, MiddlewareFn } from './composer'
import { SceneContextOptions, Step } from './stage'

export interface WizardContext<TContext extends WizardContextMessageUpdate> {
  ctx: TContext

  options: SceneContextOptions

  steps: Step<TContext>[]

  cursor: number

  state: object

  step: () => number

  selectStep: (step: number) => this

  next: () => this

  back: () => this
}

export interface WizardContextMessageUpdate extends TelegrafContext {
  wizard: WizardContext<this>
}

export interface WizardSceneOptions<
  TContext extends WizardContextMessageUpdate
> {
  handlers: Middleware<TContext>[]
  leaveHandlers: Middleware<TContext>[]
  ttl?: number
}

export class WizardScene<
  TContext extends WizardContextMessageUpdate
> extends Composer<TContext> {
  constructor(
    id: string,
    options?: Partial<WizardSceneOptions<TContext>>,
    ...steps: Step<TContext>[]
  )

  id: string

  options: WizardSceneOptions<TContext>

  leaveHandler: Middleware<TContext>

  ttl?: number

  leave: (...fns: Middleware<TContext>[]) => this

  leaveMiddleware: () => Middleware<TContext>
}
