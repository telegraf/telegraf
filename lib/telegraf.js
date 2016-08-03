const debug = require('debug')('telegraf:core')
const Promise = require('bluebird')
const Telegram = require('./telegram')
const https = require('https')
const http = require('http')
const Context = require('./context')
const Composer = require('./composer')

class Telegraf extends Composer {

  /**
   * Initialize a new `Telegraf` application.
   * @param {string} token - Telegram token.
   * @param {object} options - Additional options.
   * @api public
   */
  constructor (token, options) {
    super()
    this.token = token
    this.options = Object.assign({}, options)
    this.telegram = new Telegram(token, this.options.telegram)
    this.middlewares = []
    this.context = {}
    this.polling = {
      offset: 0,
      retryAfter: 1000,
      started: false
    }
  }

  /**
   * Default error handler.
   *
   * @param {Error} err
   * @api private
   */
  onError (err) {
    const msg = err.stack || err.toString()
    console.error()
    console.error(msg.replace(/^/gm, '  '))
    console.error()
    throw err
  }

  /**
   * Start polling loop.
   *
   * @param {number} timeout
   * @param {number} limit
   * @param {concurrency} concurrency
   * @return {Telegraf} self
   * @api public
   */
  startPolling (timeout, limit, concurrency) {
    this.polling = Object.assign(this.polling, {
      started: true,
      timeout: timeout || 0,
      limit: limit || 100,
      concurrency: concurrency || 1
    })
    this.pollingLoop()
    return this
  }

  /**
   * Return a callback function suitable for the http[s].createServer() method to handle a request.
   * You may also use this callback function to mount your telegraf app in a Koa/Connect/Express app.
   *
   * @param {string} webHookPath - Webhook secret path
   * @return {Function}
   * @api public
   */
  webHookCallback (webHookPath) {
    webHookPath = webHookPath || '/'
    return (req, res, next) => {
      if (req.method !== 'POST' || req.url !== `${webHookPath}`) {
        if (next && typeof next === 'function') {
          return next()
        }
        res.statusCode = 403
        return res.end()
      }
      var body = ''
      req.on('data', (chunk) => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          const update = JSON.parse(body)
          this.handleUpdate(update, res)
            .then(() => {
              if (!res.finished) {
                res.end()
              }
            })
            .catch((err) => {
              debug('webhook error', err)
              res.writeHead(500)
              res.end()
            })
        } catch (error) {
          res.writeHead(415)
          res.end()
          this.onError(error)
        }
      })
    }
  }

  /**
   * Start WebHook.
   *
   * @param {string} webHookPath - Webhook secret path
   * @param {Object} tlsOptions - TLS options
   * @param {number} port - Port number
   * @param {string} [host] - WebHook secret path
   * @return {Telegraf} self
   * @api public
   */
  startWebHook (webHookPath, tlsOptions, port, host) {
    const callback = this.webHookCallback(webHookPath)
    this.webhookServer = tlsOptions
      ? https.createServer(tlsOptions, callback)
      : http.createServer(callback)
    this.webhookServer.listen(port, host, () => {
      debug('WebHook listening on port: %s', port)
    })
    return this
  }

  /**
   * Stop WebHook/Polling.
   *
   * @return {Telegraf} self
   * @api public
   */
  stop () {
    this.polling.started = false
    if (this.webhookServer) {
      this.webhookServer.close()
    }
    return this
  }

  /**
   * Handle Telegram update
   *
   * @param {Object} update - Telegram update object
   * @param {Object} [webHookResponse] - http.ServerResponse
   * @return {Promise}
   * @api public
   */
  handleUpdate (update, webHookResponse) {
    debug('⚡ update', update.update_id)
    var ctx
    if (webHookResponse) {
      ctx = new Context(this.token, update, {telegram: Object.assign({webHookResponse: webHookResponse}, this.options.telegram)})
    } else {
      ctx = new Context(this.token, update, this.options)
    }
    for (let key in this.context) {
      ctx[key] = this.context[key]
    }
    return this.middleware()(ctx).catch(this.onError).then(() => Promise.resolve(update))
  }

  /**
   * Polling loop
   *
   * @api private
   */
  pollingLoop () {
    if (!this.polling.started) {
      return
    }
    var lastUpdateId = 0
    this.telegram.getUpdates(this.polling.timeout, this.polling.limit, this.polling.offset)
      .catch((err) => {
        console.error('Telegraf: network error', err.message)
        return Promise.delay(this.polling.retryAfter)
      })
      .then((updates) => {
        if (updates && updates.length > 0) {
          lastUpdateId = updates[updates.length - 1].update_id + 1
        }
        return Promise.resolve(updates || [])
      })
      .map((update) => this.handleUpdate(update).then((update) => {
        this.polling.offset = update.update_id + 1
      }), {concurrency: this.polling.concurrency})
      .catch((err) => {
        console.error('Telegraf: polling error', err.message)
        if (this.polling.concurrency === 1) {
          this.polling.started = false
        } else {
          this.polling.offset = lastUpdateId
        }
      })
      .then(() => {
        this.pollingLoop()
      })
  }
}

module.exports = Telegraf
