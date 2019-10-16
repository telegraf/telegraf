const Composer = require('../../composer')
const WizardContext = require('./context')
const { compose, unwrap } = Composer

class WizardScene extends Composer {
  constructor (id, options, ...steps) {
    super()
    this.id = id
    this.options = typeof options === 'function'
      ? { steps: [options, ...steps], leaveHandlers: [] }
      : { steps: steps, leaveHandlers: [], ...options }
    this.leaveHandler = compose(this.options.leaveHandlers)
  }

  set ttl (value) {
    this.options.ttl = value
  }

  get ttl () {
    return this.options.ttl
  }

  leave (...fns) {
    this.leaveHandler = compose([this.leaveHandler, ...fns])
    return this
  }

  leaveMiddleware () {
    return this.leaveHandler
  }

  middleware () {
    return compose([
      (ctx, next) => {
        const wizard = new WizardContext(ctx, this.options.steps)
        ctx.wizard = wizard
        return next()
      },
      super.middleware(),
      (ctx, next) => {
        if (!ctx.wizard.step) {
          ctx.wizard.selectStep(0)
          return ctx.scene.leave()
        }
        return unwrap(ctx.wizard.step)(ctx, next)
      }
    ])
  }
}

module.exports = WizardScene
