import SceneContextScene, { SceneSession, SceneSessionData } from '../context'
import Context from '../../context'
import { Middleware } from '../../middleware'
import { SessionContext } from '../../session'
import type { HasAllOptionalProps } from '../utilTypes'

export type WizardSessionData<
  T extends object = object,
  MustBeValid extends boolean = false
> = SceneSessionData<T> extends string
  ? MustBeValid extends true
    ? never
    : SceneSessionData<T>
  : SceneSessionData<T> & { cursor: number }

// Adding `& Cursor` guarantees that we're not getting the string case
export interface WizardContext<
  D extends WizardSessionData<object, true> = WizardSessionData<object>
> extends Context {
  session: WizardSession<D>
  scene: SceneContextScene<D>
  wizard: WizardContextWizard<D>
}

// Adding `& Cursor` guarantees that we're not getting the string case
export interface WizardSession<
  S extends WizardSessionData<object, true> = WizardSessionData<object>
> extends SceneSession<S> {}

// Adding `& Cursor` guarantees that we're not getting the string case
export default class WizardContextWizard<
  C extends WizardContext<D>,
  D extends WizardSessionData<object, true> = WizardSessionData<object>
> {
  readonly state: object
  constructor(
    private readonly ctx: C,
    private readonly steps: ReadonlyArray<Middleware<C>>
  ) {
    this.state = ctx.scene.state
    this.cursor = ctx.scene.session.cursor ?? 0
  }

  get step() {
    return this.steps[this.cursor]
  }

  get cursor() {
    return this.ctx.scene.session.cursor
  }

  set cursor(cursor: number) {
    this.ctx.scene.session.cursor = cursor
  }

  selectStep(index: number) {
    this.cursor = index
    return this
  }

  next() {
    return this.selectStep(this.cursor + 1)
  }

  back() {
    return this.selectStep(this.cursor - 1)
  }
}
