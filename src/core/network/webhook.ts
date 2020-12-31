import * as http from 'http'
import d from 'debug'
import { Update } from '../../telegram-types'
const debug = d('telegraf:webhook')

export default function (
  hookPath: string,
  updateHandler: (update: Update, res: http.ServerResponse) => Promise<void>,
  errorHandler: (err: SyntaxError) => void
) {
  return async (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next?: () => void
  ): Promise<void> => {
    debug('Incoming request', req.method, req.url)
    if (req.method !== 'POST' || req.url !== hookPath) {
      if (typeof next === 'function') {
        return next()
      }
      res.statusCode = 403
      return res.end()
    }
     let body = ''
    for await (let chunk of req) {
      body += chunk.toString()
    }
    let update: Update
    try {
      update = JSON.parse(body)
    } catch (error) {
      res.writeHead(415)
      res.end()
      return errorHandler(error)
    }
    try {
      await updateHandler(update, res)
      if (!res.writableEnded || !res.finished) {
        res.end()
      }
    } catch (err) {
      debug('Webhook error', err)
      res.writeHead(500)
      res.end()
    }
  }
}
