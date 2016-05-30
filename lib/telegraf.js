var debug = require('debug')('telegraf:core')
var Promise = require('bluebird')
var ware = require('co-ware')
var util = require('util')
var Telegram = require('./telegram-api')
var memorySession = require('./memory-session')
var platform = require('./platform')

/**
 * Represents a Telegraf app.
 * @constructor
 * @param {string} token - Telegram token.
 * @param {object} options - Additional options.
 */
function Telegraf (token, options) {
  this.options = Object.assign({webHookAnswer: true}, options)
  this.middleware = []
  this.context = {}
  this.polling = {
    offset: 0,
    started: false
  }
  Telegram.call(this, token, this.options.apiRoot)
}

util.inherits(Telegraf, Telegram)

/**
 * Expose `Telegraf`.
 */
module.exports = Telegraf

/**
 * Telegraf prototype.
 */
var telegraf = Telegraf.prototype

/**
 * Expose `memorySession`.
 */
Telegraf.memorySession = memorySession

/**
 * O(1)
 *
 * @api private
 */
function * noop () {}

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {GeneratorFumction[]} middleware
 * @return {GeneratorFumction}
 * @api public
 */
Telegraf.compose = function (middleware) {
  return function * (next) {
    if (!next) {
      next = noop()
    }
    var i = middleware.length
    while (i--) {
      next = middleware[i].call(this, next)
    }
    return yield * next
  }
}

/**
 * Generates `middleware` for handling provided update types.
 *
 * @param {string|string[]} updateTypes
 * @param {(GeneratorFunction|GeneratorFunction[])} fn - middleware
 * @api public
 */
Telegraf.mount = function (updateTypes) {
  if (typeof updateTypes === 'string') {
    updateTypes = [updateTypes]
  }
  var fns = [].slice.call(arguments, 1)
  return function * (next) {
    if (updateTypes.indexOf(this.updateType) !== -1 || updateTypes.indexOf(this.updateSubType) !== -1) {
      yield Telegraf.compose(fns)
    }
    yield next
  }
}

/**
 * Default error handler.
 *
 * @param {Error} err
 * @api private
 */
telegraf.onError = function (err) {
  var msg = err.stack || err.toString()
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
telegraf.startPolling = function (timeout, limit) {
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
telegraf.webHookCallback = function (webHookPath) {
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
        var update = JSON.parse(body)
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
telegraf.startWebHook = function (webHookPath, tlsOptions, port, host) {
  var callback = this.webHookCallback(webHookPath)
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
telegraf.stop = function () {
  this.polling.started = false
  if (this.webhookServer) {
    this.webhookServer.close()
  }
  return this
}

/**
 * Register a middleware.
 *
 * @param {GeneratorFunction} fn - middleware
 * @return {Telegraf} self
 * @api public
 */
telegraf.use = function (fn) {
  this.middleware.push(fn)
  return this
}

/**
 * Use the given middleware as handler for `updateType`.
 *
 * @param {string} updateType - Update type
 * @param {(GeneratorFunction|GeneratorFunction[])} fn - middleware
 * @return {Telegraf} self
 * @api public
 */
telegraf.on = function (updateTypes) {
  var fns = [].slice.call(arguments, 1)
  this.use(Telegraf.mount(updateTypes, Telegraf.compose(fns)))
  return this
}

// String -> RegEx magic!
var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g

/**
 * Use the given middleware as handler for text `trigger`.
 *
 * @param {(string|RegEx)} trigger - Text trigger
 * @param {(GeneratorFunction|GeneratorFunction[])} fn - middleware
 * @return {Telegraf} self
 * @api public
 */
telegraf.hears = function (trigger) {
  var regex = trigger instanceof RegExp
    ? trigger
    : new RegExp(trigger.replace(matchOperatorsRe, '\\$&'))
  var fns = [].slice.call(arguments, 1)

  var middleware = Telegraf.mount('text', function * (next) {
    var result = regex.exec(this.message.text)
    if (result) {
      this.__defineGetter__('match', function () {
        return result || []
      })
      yield Telegraf.compose(fns)
    }
    yield next
  })
  this.use(middleware)
  return this
}

/**
 * Polling loop
 *
 * @api private
 */
telegraf.pollingLoop = function () {
  if (!this.polling.started) {
    return
  }
  this.getUpdates(this.polling.timeout, this.polling.limit, this.polling.offset)
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

/**
 * Extract raw Telegram update
 *
 * @param {Object} update - raw Telegram update
 * @return {Object} normalized update
 * @api private
 */
telegraf.extractUpdate = function (update) {
  var result = {}
  platform.updateTypes.forEach((key) => {
    if (update[key]) {
      result.payload = update[key]
      result.type = key
    }
  })
  if (update.message) {
    platform.messageSubTypes.forEach((messageType) => {
      if (update.message[messageType]) {
        result.subType = messageType
      }
    })
  }
  return result
}

/**
 * Handle Telegram update
 *
 * @param {Object} rawUpdate - Telegram update object
 * @param {Object} [webHookResponse] - http.ServerResponse
 * @return {Promise}
 * @api public
 */
telegraf.handleUpdate = function (rawUpdate, webHookResponse) {
  var update = this.extractUpdate(rawUpdate)
  if (!update.type) {
    throw new Error('Undefined update type')
  }
  debug('⚡ update', update.type, update.subType || '-')
  var chat = {id: ''}
  var sender = {id: ''}
  if (update.payload.from) {
    sender = update.payload.from
  }
  if (update.payload && update.payload.chat) {
    chat = update.payload.chat
  }
  if (update.payload && update.payload.message && update.payload.message.chat) {
    chat = update.payload.message.chat
  }
  var state = {}
  var context = Object.assign({
    telegraf: this,
    updateType: update.type,
    updateSubType: update.subType,
    chat: chat,
    from: sender,
    state: state
  }, this.context)

  var proxy = this
  if (this.options.webHookAnswer && webHookResponse) {
    var self = this
    // 🐵-patching
    proxy = {
      sendRequest: function (method, options) {
        return self.sendRequest(method, options, webHookResponse)
      }
    }
  }

  var payload = update.payload
  var chatId = (payload.chat && payload.chat.id) ||
    (payload.message && payload.message.chat && payload.message.chat.id)

  if (chatId) {
    platform.chatShortcuts.forEach((command) => {
      context[command.name] = this[command.target].bind(proxy, chatId)
    })
  }

  // 🐫-case
  var payloadName = update.type.replace(/^([A-Z])|[\s-_](\w)/g, (match, group1, group2) => {
    return group2 ? group2.toUpperCase() : group1.toLowerCase()
  })

  context.__defineGetter__(payloadName, function () {
    return payload
  })

  if (update.type === 'callback_query') {
    context.answerCallbackQuery = this.answerCallbackQuery.bind(proxy, payload.id)
  }

  if (update.type === 'inline_query') {
    context.answerInlineQuery = this.answerInlineQuery.bind(proxy, payload.id)
  }

  var ctx = ware()
  ctx.context = context
  ctx.use(Telegraf.compose(this.middleware))
  ctx.on('error', this.onError)
  return ctx.run()
}
