const debug = require('debug')('telegraf:core')
const Promise = require('bluebird')
const Telegram = require('./telegram')
const memorySession = require('./memory-session')
const https = require('https')
const http = require('http')
const TelegrafContext = require('./context')

class Telegraf {

  /**
   * Initialize a new `Telegraf` application.
   * @param {string} token - Telegram token.
   * @param {object} options - Additional options.
   * @api public
   */
  constructor (token, options) {
    const opts = Object.assign({webHookAnswer: true}, options)
    this.token = token
    this.telegram = new Telegram(token, opts.telegram)
    this.options = opts
    this.middlewares = []
    this.context = {}
    this.polling = {
      offset: 0,
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
   * @return {Telegraf} self
   * @api public
   */
  startPolling (timeout, limit) {
    this.polling.started = true
    this.polling.timeout = timeout || 0
    this.polling.limit = limit || 100
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
                res.writeHead(200)
                res.end()
              }
            })
            .catch((err) => {
              debug('webhook error', err)
              res.writeHead(500)
              res.end()
            })
        } catch (error) {
          this.onError(error)
          res.writeHead(415)
          res.end()
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
   * Register a middleware.
   *
   * @param {Function} middleware - middleware
   * @return {Telegraf} self
   * @api public
   */
  use (middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be composed of functions')
    }
    this.middlewares.push(middleware)
    return this
  }

  /**
   * Use the given middleware as handler for `updateType`.
   *
   * @param {string} updateType - Update type
   * @param {(Function|Function[])} middleware - middleware
   * @return {Telegraf} self
   * @api public
   */
  on (updateTypes) {
    const fns = [].slice.call(arguments, 1)
    if (fns.length === 0) {
      throw new TypeError('At least one Middleware must be provided')
    }
    this.use(Telegraf.mount(updateTypes, Telegraf.compose(fns)))
    return this
  }

  /**
   * Use the given middleware as handler for text `triggers`.
   *
   * @param {(string|RegEx)} triggers - Text triggers
   * @param {(Function|Function[])} middleware - middleware
   * @return {Telegraf} self
   * @api public
   */
  hears (triggers) {
    const fns = [].slice.call(arguments, 1)
    if (fns.length === 0) {
      throw new TypeError('At least one Middleware must be provided')
    }
    const middleware = Telegraf.compose(fns)
    this.use(Telegraf.hears(triggers, middleware))
    return this
  }

  /**
   * Just shortcut for `hears`.
   *
   * @param {(string|RegEx)} Commands - Text triggers
   * @param {(Function|Function[])} middleware - middleware
   * @return {Telegraf} self
   * @api public
   */
  command () {
    return this.hears.apply(this, arguments)
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
    const ctx = new TelegrafContext(this.token, update, {webHookResponse: webHookResponse})
    for (let key in this.context) {
      ctx[key] = this.context[key]
    }
    const middleware = Telegraf.compose(this.middlewares)
    return middleware(ctx).catch(this.onError)
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
    this.telegram.getUpdates(this.polling.timeout, this.polling.limit, this.polling.offset)
      .catch((err) => {
        console.error('Telegraf: network error', err)
        return new Promise((resolve) => {
          setTimeout(() => resolve([]), 1000)
        })
      })
      .map((update) => {
        return this.handleUpdate(update).then(() => {
          this.polling.offset = update.update_id + 1
        })
      }, {concurrency: 1})
      .then(() => this.pollingLoop())
      .catch((err) => {
        console.error('Telegraf: polling error', err)
        this.polling.started = false
      })
  }
}

/**
 * Expose `memorySession`.
 */
Telegraf.memorySession = memorySession

/**
 * Expose `Telegram`.
 */
Telegraf.Telegram = Telegram

/**
 * Compose `middlewares` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Function[]} middlewares
 * @return {Function}
 * @api public
 */
Telegraf.compose = function (middlewares) {
  if (!Array.isArray(middlewares)) {
    middlewares = [middlewares]
  }
  for (const middleware of middlewares) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be composed of functions')
    }
  }
  return (ctx, next) => {
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'))
      }
      index = i
      const middleware = middlewares[i] || next
      if (!middleware) {
        return Promise.resolve()
      }
      try {
        return Promise.resolve(middleware(ctx, () => dispatch(i + 1)))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}

/**
 * Generates `middleware` for handling provided update types.
 *
 * @param {string|string[]} updateTypes
 * @param {(Function)} middleware - middleware
 * @api public
 */
Telegraf.mount = function (updateTypes, middleware) {
  if (!Array.isArray(updateTypes)) {
    updateTypes = [updateTypes]
  }
  return (ctx, next) => {
    if (updateTypes.indexOf(ctx.updateType) !== -1 || updateTypes.indexOf(ctx.updateSubType) !== -1) {
      return middleware(ctx, next)
    }
    return next()
  }
}

/**
 * Generates `middleware` for handling `text` messages with regular expressions.
 *
 * @param {(string|RegEx)[]} triggers
 * @param {(Function)} middleware - middleware
 * @api public
 */
Telegraf.hears = function (triggers, middleware) {
  if (!Array.isArray(triggers)) {
    triggers = [triggers]
  }

  const expressions = triggers.map((trigger) => {
    return trigger instanceof RegExp
      ? trigger
      : new RegExp(trigger.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'))
  })

  return Telegraf.mount('text', (ctx, next) => {
    const results = expressions.map((regex) => regex.exec(ctx.message.text)).filter((x) => x)
    if (results && results[0]) {
      ctx.match = results[0]
      return middleware(ctx, next)
    }
    return next()
  })
}

/**
 * Expose `Telegraf`.
 */
module.exports = Telegraf
