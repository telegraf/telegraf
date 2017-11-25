const debug = require('debug')('telegraf:webhook')

module.exports = function (path, updateHandler, errorHandler) {
  return (req, res, next) => {
    if (req.method !== 'POST' || req.url !== `${path}`) {
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
          debug('webhook error', err)
          res.writeHead(500)
          res.end()
        })
    })
  }
}
