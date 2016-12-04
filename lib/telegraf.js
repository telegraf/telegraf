const debug = require('debug')('telegraf:core')
const util = require('util')
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

  webhookCallback (path = '/') {
    return generateCallback(path, (update, res) => this.handleUpdate(update, res), debug)
  }

  startPolling (timeout = 30, limit = 100, allowedUpdates) {
    this.state.timeout = timeout
    this.state.limit = limit
    this.state.allowedUpdates = allowedUpdates
      ? Array.isArray(allowedUpdates) ? allowedUpdates : [`${allowedUpdates}`]
      : null
    if (!this.state.started) {
      this.state.started = true
      this.fetchUpdates()
    }
    return this
  }

  startWebhook (path, tlsOptions, port, host, cb) {
    const webhookCb = this.webhookCallback(path)
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
      return Promise.reject('Updates must be an array')
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

  handleUpdate (update, webhookResponse) {
    debug('⚡ update', update.update_id)
    const telegram = webhookResponse
      ? new Telegram(this.token, this.options.telegram, webhookResponse)
      : this.telegram
    const ctx = new Context(update, telegram, this.options)
    Object.assign(ctx, this.context)
    return this.middleware()(ctx).catch(this.handleError)
  }

  fetchUpdates () {
    const { timeout, limit, offset, started, allowedUpdates } = this.state
    if (!started) {
      return
    }
    this.telegram.getUpdates(timeout, limit, offset, allowedUpdates)
      .catch((err) => {
        console.error('Failed to get updates.', err)
        const wait = err.retryAfter || this.options.retryAfter
        return new Promise((resolve) => setTimeout(resolve, wait, []))
      })
      .then((updates) => this.handleUpdates(updates).then(() => updates))
      .catch((err) => {
        console.error('Failed to process updates.', err)
        this.state.offset = 0
        this.state.started = false
        return []
      })
      .then((updates) => {
        if (updates.length > 0) {
          this.state.offset = updates[updates.length - 1].update_id + 1
        }
        this.fetchUpdates()
      })
  }
}

Telegraf.prototype.webHookCallback = util.deprecate(Telegraf.prototype.webhookCallback, 'telegraf: `webHookCallback` is deprecated. Use `webhookCallback` instead.')
Telegraf.prototype.startWebHook = util.deprecate(Telegraf.prototype.startWebhook, 'telegraf: `startWebHook` is deprecated. Use `startWebhook` instead.')

module.exports = Telegraf
