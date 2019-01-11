const debug = require('debug')('telegraf:core')
const Telegram = require('./telegram')
const Extra = require('./extra')
const Composer = require('./composer')
const Markup = require('./markup')
const session = require('./session')
const Router = require('./router')
const Context = require('./core/context')
const generateCallback = require('./core/network/webhook')
const crypto = require('crypto')
const { URL } = require('url')

const DefaultOptions = {
  retryAfter: 1,
  handlerTimeout: 0
}

const noop = () => { }

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
    this.polling = {
      offset: 0,
      started: false
    }
  }

  set token (token) {
    this.telegram = new Telegram(token, this.telegram
      ? this.telegram.options
      : this.options.telegram
    )
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

  startPolling (timeout = 30, limit = 100, allowedUpdates, stopCallback = noop) {
    this.polling.timeout = timeout
    this.polling.limit = limit
    this.polling.allowedUpdates = allowedUpdates
      ? Array.isArray(allowedUpdates) ? allowedUpdates : [`${allowedUpdates}`]
      : null
    this.polling.stopCallback = stopCallback
    if (!this.polling.started) {
      this.polling.started = true
      this.fetchUpdates()
    }
    return this
  }

  startWebhook (hookPath, tlsOptions, port, host, cb) {
    const webhookCb = this.webhookCallback(hookPath)
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

  launch (config = {}) {
    return this.telegram.getMe()
      .then((botInfo) => {
        debug(`Launching @${botInfo.username}`)
        this.options.username = botInfo.username
        this.context.botInfo = botInfo
        if (!config.webhook) {
          const { timeout, limit, allowedUpdates, stopCallback } = config.polling || {}
          return this.telegram.deleteWebhook()
            .then(() => this.startPolling(timeout, limit, allowedUpdates, stopCallback))
            .then(() => debug(`Bot started with long-polling`))
        }
        if (typeof config.webhook.domain !== 'string' && typeof config.webhook.hookPath !== 'string') {
          throw new Error('Webhook domain or webhook path is required')
        }
        let domain = config.webhook.domain || ''
        if (domain.startsWith('https://') || domain.startsWith('http://')) {
          domain = new URL(domain).host
        }
        const hookPath = config.webhook.hookPath || `/telegraf/${crypto.randomBytes(32).toString('hex')}`
        const { port, host, tlsOptions, cb } = config.webhook
        this.startWebhook(hookPath, tlsOptions, port, host, cb)
        if (!domain) {
          debug(`Bot started with webhook`)
          return
        }
        return this.telegram
          .setWebhook(`https://${domain}${hookPath}`)
          .then(() => debug(`Bot started with webhook @ https://${domain}`))
      })
  }

  stop (cb = noop) {
    this.polling.started = false
    if (this.webhookServer) {
      this.webhookServer.close(cb)
    } else {
      cb()
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
    debug('Processing update', update.update_id)
    const tg = new Telegram(this.token, this.telegram.options, webhookResponse)
    const ctx = new Context(update, tg, this.options)
    Object.assign(ctx, this.context)
    return this.middleware()(ctx).catch(this.handleError)
  }

  fetchUpdates () {
    const { timeout, limit, offset, started, allowedUpdates } = this.polling
    if (!started) {
      return
    }
    this.telegram.getUpdates(timeout, limit, offset, allowedUpdates)
      .catch((err) => {
        if (err.code === 401 || err.code === 409) {
          throw err
        }
        const wait = (err.parameters && err.parameters.retry_after) || this.options.retryAfter
        console.error(`Failed to fetch updates. Waiting: ${wait}s`, err.message)
        return new Promise((resolve) => setTimeout(resolve, wait * 1000, []))
      })
      .then((updates) => this.handleUpdates(updates).then(() => updates))
      .catch((err) => {
        console.error('Failed to process updates.', err)
        this.polling.started = false
        this.polling.offset = 0
        this.polling.stopCallback && this.polling.stopCallback()
        return []
      })
      .then((updates) => {
        if (updates.length > 0) {
          this.polling.offset = updates[updates.length - 1].update_id + 1
        }
        this.fetchUpdates()
      })
  }
}

module.exports = Object.assign(Telegraf, {
  Composer,
  Extra,
  Markup,
  Router,
  Telegram,
  session
})

module.exports.default = Object.assign(Telegraf, {
  Composer,
  Extra,
  Markup,
  Router,
  Telegram,
  session
})
