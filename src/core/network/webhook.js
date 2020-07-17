const debug = require('debug')('telegraf:webhook')

module.exports = function (hookPath, updateHandler, errorHandler) {
  return (req, res, next) => {
    debug('Incoming request', req.method, req.url)
    if (req.method !== 'POST' || req.url !== hookPath) {
      if (typeof next === 'function') {
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
        return errorHandler(error)
      }
      updateHandler(update, res)
        .then(() => {
          if (!res.finished) {
            res.end()
          }
        })
        .catch((err) => {
          debug('Webhook error', err)
          res.writeHead(500)
          res.end()
        })
    })
  }
}
