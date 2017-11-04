class WizardContext {
  constructor (ctx, steps) {
    this.ctx = ctx
    this.steps = steps
    this.state = ctx.scene.state
    this.cursor = ctx.scene.session.cursor || 0
  }

  get step () {
    return this.cursor >= 0 && this.steps[this.cursor]
  }

  selectStep (index) {
    this.cursor = index
    this.ctx.scene.session.cursor = index
    return this
  }

  next () {
    return this.selectStep(this.cursor + 1)
  }

  back () {
    return this.selectStep(this.cursor - 1)
  }
}

module.exports = WizardContext
