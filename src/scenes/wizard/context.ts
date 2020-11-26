import SceneContext, { SceneSession } from '../context'
import Context from '../../context'
import { Middleware } from '../../types'

export interface WizardSession extends SceneSession {
  cursor: number
}

// eslint-disable-next-line
namespace WizardContext {
  export interface Extension<
    S extends WizardSession,
    C extends SceneContext.Extended<S, Context>
  > {
    wizard: WizardContext<S, C>
  }
  export type Extended<
    S extends WizardSession,
    C extends SceneContext.Extended<S, Context>
  > = C & Extension<S, C>
}

class WizardContext<
  S extends WizardSession,
  C extends SceneContext.Extended<S, Context>
> {
  readonly state: object
  cursor: number
  constructor(
    private readonly ctx: C,
    private readonly steps: ReadonlyArray<Middleware<C>>
  ) {
    this.state = ctx.scene.state
    this.cursor = ctx.scene.session.cursor ?? 0
  }

  get step() {
    return this.cursor >= 0 && this.steps[this.cursor]
  }

  selectStep(index: number) {
    this.cursor = index
    this.ctx.scene.session.cursor = index
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
