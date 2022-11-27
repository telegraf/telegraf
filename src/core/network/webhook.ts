import { debug } from '../../platform/deps/debug.ts'
import { type Update } from '../../deps/typegram.ts'
import { defaultContract } from '../../platform/core/webhook.ts'
import { WebhookContract } from './webhook-contract.ts'
import { UpdateHandler } from '../../util.ts'

export type { WebhookContract }

const d = debug('telegraf:webhook')

export function generateWebhook(
  updateHandler: UpdateHandler,
  filter: WebhookContract.Filter,
  contract: WebhookContract.Contract = defaultContract
) {
  const wrapper = contract(filter)
  return async (...params: any[]) => {
    const ctx = await wrapper(...params)
    if (!ctx) return

    let update: Update

    try {
      update = await ctx.update()
    } catch (error: unknown) {
      // if parsing fails, give up and respond with error
      await ctx.reply(null, 415)
      d('Failed to parse request body:', error)
      return ctx.returns
    }

    try {
      await updateHandler(update)
    } finally {
      if (!ctx.done) ctx.reply()
    }

    return ctx.returns
  }
}
