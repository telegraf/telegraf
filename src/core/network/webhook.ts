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

    try {
      let update: Update

      if (req.body != null) {
        /* If req.body is already set, we expect it to be the parsed
         request body (update object) received from Telegram
         However, some libraries such as `serverless-http` set req.body to the
         raw buffer, so we'll handle that additionally */

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let body: any = req.body
        // if body is Buffer, parse it into string
        if (body instanceof Buffer) body = String(req.body)
        // if body is string, parse it into object
        if (typeof body === 'string') body = JSON.parse(body)
        update = body
      } else {
        let body = ''
        // parse each buffer to string and append to body
        for await (const chunk of req) body += String(chunk)
        // parse body to object
        update = JSON.parse(body)
      }

      return await updateHandler(update, res)
    } catch (error: unknown) {
      // if any of the parsing steps fails, give up and respond with error
      res.writeHead(415).end()
      debug('Failed to parse request body:', error)
      return
    }
  }
}
