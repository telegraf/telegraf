import TelegrafContext from '../../context'
import { Middleware } from '../../types'

class WizardContext<TContext extends TelegrafContext> {
  ctx: TContext
  steps: Array<Middleware<TContext>>
  state: any
  cursor: number
  constructor(ctx: TContext, steps: Array<Middleware<TContext>>) {
    this.ctx = ctx
    this.steps = steps
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

export = WizardContext
