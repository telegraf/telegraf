import * as http from 'http'
import d from 'debug'
const debug = d('telegraf:webhook')

export = function (
  hookPath: string,
  updateHandler: (update: Update, res: http.ServerResponse) => Promise<void>,
  errorHandler: (err: SyntaxError) => void
) {
  return (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next?: () => void
  ): void => {
    debug('Incoming request', req.method, req.url)
    if (req.method !== 'POST' || req.url !== hookPath) {
      if (typeof next === 'function') {
        return next()
      }
      res.statusCode = 403
      return res.end()
    }
    let body = ''
    req.on('data', (chunk: string) => {
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
        .catch((err: unknown) => {
          debug('Webhook error', err)
          res.writeHead(500)
          res.end()
        })
    })
  }
}
