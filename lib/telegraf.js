const debug = require('debug')('telegraf:core')
const Telegram = require('./telegram/client')
const Composer = require('./composer')
const Context = require('./context')

class Telegraf extends Composer {

  /**
   * Initialize a new `Telegraf` application.
   * @param {string} token - Telegram token.
   * @param {object} options - Additional options.
   * @api public
   */
  constructor (token, options) {
    super()
    this.options = Object.assign({}, options)
    this.token = token
    this.polling = {
      offset: 0,
      retryAfter: 1000,
      started: false
    }
    this.onError = handleError
    this.context = {}
  }

  set token (token) {
    this.options.token = token
    this.telegram = new Telegram(this.options.token, this.options.telegram)
  }

  get token () {
    return this.options.token
  }

  /**
   * Set error handler.
   *
   * @param {function} handler
   * @return {Telegraf} self
   * @api public
   */
  catch (handler) {
    this.onError = handler
    return this
  }

  /**
   * Start polling loop.
   *
   * @param {number} timeout
   * @param {number} limit
   * @return {Telegraf} self
   * @api public
   */
  startPolling (timeout, limit) {
    const isStarted = this.polling.started
    this.polling = Object.assign(this.polling, {
      started: true,
      timeout: timeout || 30,
      limit: limit || 100
    })
    if (!isStarted) {
      this.fetchUpdates()
    }
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
  webHookCallback (webHookPath = '/') {
    return (req, res, next) => {
      if (req.method !== 'POST' || req.url !== `${webHookPath}`) {
        if (next && typeof next === 'function') {
          return next()
        }
        res.statusCode = 403
        return res.end()
      }
      let body = ''
      req.on('data', (chunk) => {
        body += chunk.toString()
      })
      req.on('end', () => {
        let update = {}
        try {
          update = JSON.parse(body)
        } catch (error) {
          res.writeHead(415)
          res.end()
          return this.onError(error)
        }
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
      ? require('https').createServer(tlsOptions, callback)
      : require('http').createServer(callback)
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
    const telegram = webHookResponse ? new Telegram(this.token, this.options.telegram, webHookResponse) : this.telegram
    const ctx = new Context(update, telegram, this.options)
    Object.assign(ctx, this.context)
    return this.middleware()(ctx).catch(this.onError)
  }

  /**
   * Polling loop
   *
   * @api private
   */
  fetchUpdates () {
    const polling = this.polling
    if (!polling.started) {
      return
    }
    this.telegram.getUpdates(polling.timeout, polling.limit, polling.offset)
      .catch((err) => {
        console.error('Telegraf: network error', err.message)
        return delay(polling.retryAfter, [])
      })
      .then((updates) => {
        if (!Array.isArray(updates)) {
          return []
        }
        debug('📬  Polling updates', updates.length)
        const tasks = updates.map((update) => this.handleUpdate(update))
        return Promise.all(tasks).then(() => updates)
      })
      .catch((err) => {
        console.error('Telegraf: polling error', err.message)
        polling.offset = 0
        polling.started = false
        return []
      })
      .then((updates) => {
        if (updates.length > 0) {
          polling.offset = updates[updates.length - 1].update_id + 1
        }
        this.fetchUpdates()
      })
  }
}

function delay (timeout, result) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(result), timeout)
  })
}

function handleError (err) {
  const msg = err.stack || err.toString()
  console.error()
  console.error(msg.replace(/^/gm, '  '))
  console.error()
  throw err
}
module.exports = Telegraf
