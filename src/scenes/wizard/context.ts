import SceneContext from '../context'
import TelegrafContext from '../../context'
import { Middleware } from '../../types'

class WizardContext<TContext extends SceneContext.Extended<TelegrafContext>> {
  state: any
  cursor: number
  constructor(
    private readonly ctx: TContext,
    private readonly steps: Array<Middleware<TContext>>
  ) {
    this.state = ctx.scene.state
    this.cursor = ctx.scene.session.cursor || 0
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

// eslint-disable-next-line
namespace WizardContext {
  export interface Extension<
    TContext extends SceneContext.Extended<TelegrafContext>
  > {
    wizard: WizardContext<TContext>
  }
  export type Extended<
    TContext extends SceneContext.Extended<TelegrafContext>
  > = TContext & Extension<TContext>
}

export = WizardContext
