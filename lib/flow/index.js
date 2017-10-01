const debug = require('debug')('telegraf:flow')
const Composer = require('../core/composer.js')
const { compose, optional, lazy, safePassThru } = Composer

const noop = () => Promise.resolve()
const now = () => Math.floor(new Date().getTime() / 1000)

class FlowContext {
  constructor (ctx, scenes, options) {
    this.ctx = ctx
    this.scenes = scenes
    this.options = options
  }

  get session () {
    const sessionName = this.options.sessionName
    let session = this.ctx[sessionName].__flow || {}
    if (session.expires < now()) {
      session = {}
    }
    this.ctx[sessionName].__flow = session
    return session
  }

  get state () {
    this.session.state = this.session.state || {}
    return this.session.state
  }

  set state (value) {
    this.session.state = Object.assign({}, value)
  }

  get current () {
    const sceneId = this.session.current || this.options.defaultScene
    return (sceneId && this.scenes.has(sceneId)) ? this.scenes.get(sceneId) : null
  }

  reset () {
    const sessionName = this.options.sessionName
    delete this.ctx[sessionName].__flow
  }

  enter (sceneId, initialState, silent) {
    if (!sceneId || !this.scenes.has(sceneId)) {
      throw new Error(`Can't find scene: ${sceneId}`)
    }
    debug('enter', sceneId, initialState, silent)
    this.session.current = sceneId
    this.state = initialState
    const ttl = this.current.ttl || this.options.ttl
    if (ttl) {
      this.session.expires = now() + ttl
    }
    if (silent) {
      return
    }
    const handler = this.current.enterMiddleware
      ? this.current.enterMiddleware()
      : this.current.middleware()
    return handler(this.ctx, noop)
  }

  reenter () {
    return this.enter(this.session.current, this.state)
  }

  leave () {
    debug('leave')
    const handler = this.current && this.current.leaveMiddleware
      ? this.current.leaveMiddleware()
      : safePassThru()
    return handler(this.ctx, noop).then(() => this.reset())
  }
}

class Flow extends Composer {
  constructor (scenes, options) {
    super()
    this.options = Object.assign({
      sessionName: 'session'
    }, options)
    this.scenes = new Map()
    if (scenes) {
      scenes.forEach((scene) => this.register(scene))
    }
  }

  register (...scenes) {
    scenes.forEach((scene) => {
      if (!scene || !scene.id || !scene.middleware) {
        throw new Error('telegraf: Unsupported scene')
      }
      this.scenes.set(scene.id, scene)
    })
    return this
  }

  middleware () {
    const handler = compose([
      (ctx, next) => {
        ctx.flow = new FlowContext(ctx, this.scenes, this.options)
        return next()
      },
      super.middleware(),
      lazy((ctx) => ctx.flow.current || safePassThru())
    ])
    return optional((ctx) => ctx[this.options.sessionName], handler)
  }

  static enter (...args) {
    return (ctx) => ctx.flow.enter(...args)
  }

  static reenter (...args) {
    return (ctx) => ctx.flow.reenter(...args)
  }

  static leave (...args) {
    return (ctx) => ctx.flow.leave(...args)
  }
}

module.exports = Flow
module.exports.Scene = require('./scenes/generic')
module.exports.WizardScene = require('./scenes/wizard')
