const debug = require('debug')('telegraf:core')
const Promise = require('bluebird')
const Telegram = require('./telegram')
const memorySession = require('./memory-session')
const TelegrafContext = require('./context')

// String -> RegEx magic!
var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g

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
    this.telegram = new Telegram(token)
    this.options = opts
    this.middleware = []
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
   * Register a middleware.
   *
   * @param {Function} fn - middleware
   * @return {Telegraf} self
   * @api public
   */
  use (fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be composed of functions')
    }
    this.middleware.push(fn)
    return this
  }

  /**
   * Use the given middleware as handler for `updateType`.
   *
   * @param {string} updateType - Update type
   * @param {(Function|Function[])} fn - middleware
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
   * Use the given middleware as handler for text `trigger`.
   *
   * @param {(string|RegEx)} trigger - Text trigger
   * @param {(Function|Function[])} fn - middleware
   * @return {Telegraf} self
   * @api public
   */
  hears (trigger) {
    const regex = trigger instanceof RegExp
      ? trigger
      : new RegExp(trigger.replace(matchOperatorsRe, '\\$&'))
    const fns = [].slice.call(arguments, 1)
    const handler = Telegraf.compose(fns)
    var middleware = (ctx, next) => {
      const result = regex.exec(ctx.message.text)
      if (result) {
        ctx.match = result || []
        return handler(ctx, next)
      }
      return next()
    }
    this.use(Telegraf.mount('text', middleware))
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
    const ctx = new TelegrafContext(this.token, update, webHookResponse)
    for (let key in this.context) {
      ctx[key] = this.context[key]
    }
    const fn = Telegraf.compose(this.middleware)
    return fn(ctx).catch(this.onError)
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
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Function[]} middleware
 * @return {Function}
 * @api public
 */
Telegraf.compose = function (middleware) {
  if (!Array.isArray(middleware)) {
    middleware = [middleware]
  }
  for (const fn of middleware) {
    if (typeof fn !== 'function') {
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
      const fn = middleware[i] || next
      if (!fn) {
        return Promise.resolve()
      }
      try {
        return Promise.resolve(fn(ctx, () => dispatch(i + 1)))
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
 * @param {(Function)} fn - middleware
 * @api public
 */
Telegraf.mount = function (updateTypes, middleware) {
  if (typeof updateTypes === 'string') {
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
 * Expose `Telegraf`.
 */
module.exports = Telegraf
