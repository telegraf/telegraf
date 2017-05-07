const debug = require('debug')('telegraf:core')
const Telegram = require('./telegram')
const generateCallback = require('./network/webhook')
const Composer = require('./core/composer')
const Context = require('./core/context')

const DefaultOptions = {
  retryAfter: 1,
  handlerTimeout: 0
}

class Telegraf extends Composer {
  constructor (token, options) {
    super()
    this.options = Object.assign({}, DefaultOptions, options)
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
    const config = this.telegram ? this.telegram.options : this.options.telegram
    this.telegram = new Telegram(token, config)
  }

  get token () {
    return this.telegram.token
  }

  set webhookReply (webhookReply) {
    this.telegram.webhookReply = webhookReply
  }

  get webhookReply () {
    return this.telegram.webhookReply
  }/* eslint brace-style: 0 */

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
      return Promise.reject(new Error('Updates must be an array'))
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
    const telegram = webhookResponse && this.webhookReply
      ? new Telegram(this.token, this.telegram.options, webhookResponse)
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
        const wait = err.retryAfter || this.options.retryAfter
        console.error(`Failed to get updates. Waiting: ${wait}s`, err)
        return new Promise((resolve) => setTimeout(resolve, wait * 1000, []))
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

module.exports = Telegraf
