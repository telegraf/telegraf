import type { Transformer } from '../telegram'
import { setTimeout as sleep } from 'node:timers/promises'

export function autoRetry({ maxRetries = 3 } = {}): Transformer {
  return (call) => async (invocation) => {
    let retries = maxRetries
    let promise
    do {
      promise = call(invocation)
      try {
        const result = await promise
        if (result.ok) return result
        if (result.error_code !== 429) return result
        const retryAfter = result.parameters?.retry_after ?? 5 // seconds
        await sleep(retryAfter * 1000)
      } catch {
        // ignore the error for now, we may retry
      }
    } while (retries-- > 0)
    return await promise
  }
}
