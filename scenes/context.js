const debug = require('debug')('telegraf:scenes:context')
const { safePassThru } = require('../composer')

const noop = () => Promise.resolve()
const now = () => Math.floor(new Date().getTime() / 1000)

class SceneContext {
  constructor (ctx, scenes, options) {
    this.ctx = ctx
    this.scenes = scenes
    this.options = options
  }

  get session () {
    const sessionName = this.options.sessionName
    let session = this.ctx[sessionName].__scenes || {}
    if (session.expires < now()) {
      session = {}
    }
    this.ctx[sessionName].__scenes = session
    return session
  }

  get stack () {
    this.session.stack = this.session.stack || []
    return this.session.stack
  }

  get state () {
    this.session.state = this.session.state || {}
    return this.session.state
  }

  set state (value) {
    this.session.state = { ...value }
  }

  get current () {
    const sceneId = this.session.current || this.options.default
    return (sceneId && this.scenes.has(sceneId)) ? this.scenes.get(sceneId) : null
  }

  reset (keepStack = true) {
    const sessionName = this.options.sessionName
    if (keepStack) {
      const stack = this.stack
      delete this.ctx[sessionName].__scenes
      this.session.stack = stack
    } else {
      delete this.ctx[sessionName].__scenes
    }
  }

  enter (sceneId, initialState, silent, stack = false) {
    if (!sceneId || !this.scenes.has(sceneId)) {
      throw new Error(`Can't find scene: ${sceneId}`)
    }
    const leave = silent || stack ? noop() : this.leave(false)
    return leave.then(() => {
      debug('Enter scene', sceneId, initialState, silent)
      if (this.session.current) {
        debug('Push old scene to stack', this.session.current, this.State)
        this.stack.push({ sceneId: this.session.current, state: this.State })
        debug('stack len is now', this.stack.length)
      }
      this.session.current = sceneId
      this.state = initialState
      const ttl = this.current.ttl || this.options.ttl
      if (ttl) {
        this.session.expires = now() + ttl
      }
      if (silent) {
        return Promise.resolve()
      }
      const handler = typeof this.current.enterMiddleware === 'function'
        ? this.current.enterMiddleware()
        : this.current.middleware()
      return handler(this.ctx, noop)
    })
  }

  reenter () {
    return this.enter(this.session.current, this.state)
  }

  leave (recover = true) {
    debug('Leave scene', this.session.current)
    const handler = this.current && this.current.leaveMiddleware
      ? this.current.leaveMiddleware()
      : safePassThru()
    return handler(this.ctx, noop).then(() => {
      this.reset()
      debug('stack len is', this.stack.length)
      if (recover && this.stack.length) {
        const old = this.stack.pop()
        this.session.current = old.sceneId
        this.state = old.state
        debug('Recovered session from stack', this.session.current, this.State)
      } else if (recover) {
        debug('Left with no scene to recover from stack')
      }
    })
  }
}

module.exports = SceneContext
