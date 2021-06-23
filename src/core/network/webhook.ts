import * as http from 'http'
import d from 'debug'
import { Update } from '../types/typegram'
import safeCompare = require('safe-compare')
const debug = d('telegraf:webhook')

export default function (
  hookPath: string,
  updateHandler: (update: Update, res: http.ServerResponse) => Promise<void>
) {
  return async (
    req: http.IncomingMessage & { body?: Update },
    res: http.ServerResponse,
    next = (): void => {
      res.statusCode = 403
      debug('Replying with status code', res.statusCode)
      return res.end()
    }
  ): Promise<void> => {
    debug('Incoming request', req.method, req.url)
    if (req.method !== 'POST' || !safeCompare(hookPath, req.url!)) {
      return next()
    }

    let update: Update

    if (req.body != null) {
      update = req.body
      await updateHandler(update, res)
      return
    }

    let body = ''
    for await (const chunk of req) {
      body += String(chunk)
    }
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
