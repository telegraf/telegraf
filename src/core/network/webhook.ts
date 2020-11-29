import * as http from 'http'
import d from 'debug'
import { IGNORE_WEBHOOK_PATH } from '../../types'
import { Update } from '../../telegram-types'
const debug = d('telegraf:webhook')

export = function (
  hookPath: string | typeof IGNORE_WEBHOOK_PATH,
  updateHandler: (update: Update, res: http.ServerResponse) => Promise<void>,
  errorHandler: (err: SyntaxError) => void
) {
  return (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next?: () => void
  ): void => {
    debug('Incoming request', req.method, req.url)
    if (
      req.method !== 'POST' ||
      (typeof hookPath === 'string' && req.url !== hookPath)
    ) {
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
      let update: Update
      try {
        update = JSON.parse(body)
      } catch (error) {
        res.writeHead(415)
        res.end()
        return errorHandler(error)
      }
      updateHandler(update, res)
        .then(() => {
          if (!res.writableEnded) {
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
