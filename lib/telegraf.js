const debug = require('debug')('telegraf:core')
const Telegram = require('./telegram')
const generateCallback = require('./network/webhook')
const Composer = require('./core/composer')
const Context = require('./core/context')

class Telegraf extends Composer {

  constructor (token, options) {
    super()
    this.options = Object.assign({
      retryAfter: 1000,
      handlerTimeout: 0
    }, options)
    this.token = token
    this.handleError = (err) => {
      console.error()
      console.error((err.stack || err.toString()).replace(/^/gm, '  '))
      console.error()
      throw err
    }
    this.context = {}
    this.state = {
      offset: 0,
      started: false
    }
  }

  set token (token) {
    this.options.token = token
    this.telegram = new Telegram(this.options.token, this.options.telegram)
  }

  get token () {
    return this.options.token
  }

  catch (handler) {
    this.handleError = handler
    return this
  }

  webHookCallback (path = '/') {
    return generateCallback(path, (update, res) => this.handleUpdate(update, res), debug)
  }

  startPolling (timeout, limit) {
    this.state.timeout = timeout || 30
    this.state.limit = limit || 100
    if (!this.state.started) {
      this.state.started = true
      this.fetchUpdates()
    }
    return this
  }

  startWebHook (path, tlsOptions, port, host, cb) {
    const webhookCb = this.webHookCallback(path)
    const callback = cb && typeof cb === 'function'
      ? (req, res) => webhookCb(req, res, () => cb(req, res))
      : webhookCb
    this.webhookServer = tlsOptions
      ? require('https').createServer(tlsOptions, callback)
      : require('http').createServer(callback)
    this.webhookServer.listen(port, host, () => {
      debug('Webhook listening on port: %s', port)
    })
    return this
  }

  stop () {
    this.state.started = false
    if (this.webhookServer) {
      this.webhookServer.close()
    }
    return this
  }

  handleUpdates (updates) {
    if (!Array.isArray(updates)) {
      return Promise.resolve()
    }

    const processAll = Promise.all(updates.map((update) => this.handleUpdate(update)))
    if (this.options.handlerTimeout === 0) {
      return processAll
    }
    return Promise.race([
      processAll,
      new Promise((resolve) => setTimeout(resolve, this.options.handlerTimeout))
    ])
  }

  handleUpdate (update, webHookResponse) {
    debug('⚡ update', update.update_id)
    const telegram = webHookResponse
      ? new Telegram(this.token, this.options.telegram, webHookResponse)
      : this.telegram
    const ctx = new Context(update, telegram, this.options)
    Object.assign(ctx, this.context)
    return this.middleware()(ctx).catch(this.handleError)
  }

  fetchUpdates () {
    if (!this.state.started) {
      return
    }
    const state = this.state
    this.telegram.getUpdates(state.timeout, state.limit, state.offset)
      .catch((err) => {
        console.error('Failed to get updates.', err)
        const timeout = err.retryAfter || this.options.retryAfter
        return new Promise((resolve) => setTimeout(resolve, timeout, []))
      })
      .then((updates) => this.handleUpdates(updates).then(() => updates))
      .catch((err) => {
        console.error('Failed to process updates.', err)
        state.offset = 0
        state.started = false
        return []
      })
      .then((updates) => {
        if (updates.length > 0) {
          state.offset = updates[updates.length - 1].update_id + 1
        }
        this.fetchUpdates()
      })
  }
}

module.exports = Telegraf
