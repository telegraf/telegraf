const SceneContext = require('./scenes/context')
const Composer = require('./composer')
const { compose, optional, lazy, safePassThru } = Composer

class Stage extends Composer {
  constructor (scenes = [], options) {
    super()
    this.options = {
      sessionName: 'session',
      ...options
    }
    this.scenes = new Map()
    scenes.forEach((scene) => this.register(scene))
  }

  register (...scenes) {
    scenes.forEach((scene) => {
      if (!scene || !scene.id || typeof scene.middleware !== 'function') {
        throw new Error('telegraf: Unsupported scene')
      }
      this.scenes.set(scene.id, scene)
    })
    return this
  }

  middleware () {
    const handler = compose([
      (ctx, next) => {
        ctx.scene = new SceneContext(ctx, this.scenes, this.options)
        return next()
      },
      super.middleware(),
      lazy((ctx) => ctx.scene.current || safePassThru())
    ])
    return optional((ctx) => ctx[this.options.sessionName], handler)
  }

  static enter (...args) {
    return (ctx) => ctx.scene.enter(...args)
  }

  static reenter (...args) {
    return (ctx) => ctx.scene.reenter(...args)
  }

  static leave (...args) {
    return (ctx) => ctx.scene.leave(...args)
  }
}

module.exports = Stage
