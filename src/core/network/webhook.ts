import * as http from 'http'
import d from 'debug'
import { type Update } from '../types/typegram'
const debug = d('telegraf:webhook')

export interface WebhookOptions {
  /**
   * Expected webhook path for proper status code responses.
   * When provided, enables returning 404 for path mismatches
   * and 405 for method mismatches instead of generic 403.
   */
  path?: string
}

export default function generateWebhook(
  filter: (req: http.IncomingMessage) => boolean,
  updateHandler: (update: Update, res: http.ServerResponse) => Promise<void>,
  options?: WebhookOptions
) {
  return async (
    req: http.IncomingMessage & { body?: Update },
    res: http.ServerResponse,
    next = (): void => {
      // Use appropriate HTTP status codes based on rejection reason
      if (req.method !== 'POST') {
        // 405 Method Not Allowed for non-POST requests
        res.statusCode = 405
      } else if (options?.path && req.url !== options.path) {
        // 404 Not Found for path mismatches
        res.statusCode = 404
      } else {
        // 403 Forbidden for authentication failures (secret token mismatch)
        res.statusCode = 403
      }
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

    try {
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
    } catch (error: unknown) {
      // if any of the parsing steps fails, give up and respond with error
      res.writeHead(415).end()
      debug('Failed to parse request body:', error)
      return
    }

    return await updateHandler(update, res)
  }
}
