import { type WebhookContract } from '../../core/network/webhook-contract.ts'
import { debug } from '../../platform/deps/debug.ts'
import { json } from '../../vendor/stream-consumers.ts'

const TOKEN_HEADER = 'x-telegram-bot-api-secret-token'

export type { WebhookContract }

export const denoHttpContract: WebhookContract.Contract<
  [event: Deno.RequestEvent]
> = (filter) => async (event) => {
  const d = debug('telegraf:denoHttp-webhook')
  const req = event.request

  if (!(await filter(req.method, req.url, req.headers.get(TOKEN_HEADER))))
    return d('Webhook filter failed')

  const filtered: WebhookContract.WebhookContext<Deno.RequestEvent> = {
    done: false,
    update: () => json(req.body!),
    reply: (json, status) => {
      d('Sending response %s', status)
      filtered.done = true
      return event.respondWith(
        new Response(json, {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    },
    returns: event,
  }

  return filtered
}

export const defaultContract = denoHttpContract
