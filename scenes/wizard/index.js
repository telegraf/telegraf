const WizardContext = require('./context')

class WizardScene {
  constructor (id, ...steps) {
    this.id = id
    this.steps = steps
  }

  middleware () {
    return (ctx, next) => {
      const wizard = new WizardContext(ctx, this.steps)
      if (!wizard.step) {
        wizard.selectStep(0)
        return ctx.scene.leave()
      }
      ctx.wizard = wizard
      return wizard.step(ctx, next)
    }
  }
}

module.exports = WizardScene
