import * as http from 'http'
import d from 'debug'
import { Update } from '../../telegram-types'
const debug = d('telegraf:webhook')

export default function (
  hookPath: string,
  updateHandler: (update: Update, res: http.ServerResponse) => Promise<void>
) {
  return async (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next = (): void => {
      res.statusCode = 403
      debug('Replying with status code', res.statusCode)
      return res.end()
    }
  ): Promise<void> => {
    debug('Incoming request', req.method, req.url)
    if (req.method !== 'POST' || req.url !== hookPath) {
      return next()
    }
    let body = ''
    for await (const chunk of req) {
      body += String(chunk)
    }
    let update: Update
    try {
      update = JSON.parse(body)
    } catch (error: unknown) {
      res.writeHead(415)
      res.end()
      debug('Failed to parse request body:', error)
      return
    }
    await updateHandler(update, res)
  }
}
