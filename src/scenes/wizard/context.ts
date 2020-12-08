import SceneContext, { SceneSessionData } from '../context'
import Context from '../../context'
import { Middleware } from '../../types'

export interface WizardSessionData extends SceneSessionData {
  cursor: number
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace WizardContext {
  export interface Extension<
    S extends WizardSessionData,
    C extends SceneContext.Extended<S, Context>
  > {
    wizard: WizardContext<S, C>
  }
  export type Extended<
    S extends WizardSessionData,
    C extends SceneContext.Extended<S, Context>
  > = C & Extension<S, C>
}

class WizardContext<
  S extends WizardSessionData = WizardSessionData,
  C extends SceneContext.Extended<S, Context> = SceneContext.Extended<
    S,
    Context
  >
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

export default WizardContext
