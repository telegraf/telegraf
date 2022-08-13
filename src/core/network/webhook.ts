import * as http from 'http'
import d from 'debug'
import { type Update } from '../types/typegram'
const debug = d('telegraf:webhook')

export default function generateWebhook(
  filter: (req: http.IncomingMessage) => boolean,
  updateHandler: (update: Update, res: http.ServerResponse) => Promise<void>
) {
  return async (
    req: http.IncomingMessage & { body?: Update },
    res: http.ServerResponse,
    next = (): void => {
      res.statusCode = 403
      debug('Replying with status code', res.statusCode)
      res.end()
    }
  ): Promise<void> => {
    debug('Incoming request', req.method, req.url)

    if (!filter(req)) {
      debug('Webhook filter failed', req.method, req.url)
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
