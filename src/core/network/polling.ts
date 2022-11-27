import type * as tg from '../../deps/typegram.ts'
import * as tt from '../../telegram-types.ts'
import { debug } from '../../platform/deps/debug.ts'
import { TelegramError } from './error.ts'
import Telegram from '../../telegram.ts'
import { sleep, UpdateHandler } from '../../util.ts'

const d = debug('telegraf:polling')

function always<T>(x: T) {
  return () => x
}

const noop = always(Promise.resolve())

export class Polling {
  private readonly abortController = new AbortController()
  private skipOffsetSync = false
  private offset = 0
  constructor(
    private readonly telegram: Telegram,
    private readonly allowedUpdates: readonly tt.UpdateType[]
  ) {}

  private async *[Symbol.asyncIterator]() {
    d('Starting long polling')
    do {
      try {
        const updates = await this.telegram.callApi(
          'getUpdates',
          {
            timeout: 50,
            offset: this.offset,
            allowed_updates: this.allowedUpdates,
          },
          this.abortController.signal
        )
        const last = updates[updates.length - 1]
        if (last !== undefined) {
          this.offset = last.update_id + 1
        }
        yield updates
      } catch (error) {
        const err = error as Error & {
          parameters?: { retry_after: number }
        }

        if (err.name === 'AbortError') return
        if (
          err.name === 'FetchError' ||
          (err instanceof TelegramError && err.code === 429) ||
          (err instanceof TelegramError && err.code >= 500)
        ) {
          const retryAfter: number = err.parameters?.retry_after ?? 5
          d('Failed to fetch updates, retrying after %ds.', retryAfter, err)
          await sleep(retryAfter * 1000)
          continue
        }
        if (
          err instanceof TelegramError &&
          // Unauthorized      Conflict
          (err.code === 401 || err.code === 409)
        ) {
          this.skipOffsetSync = true
          throw err
        }
        throw err
      }
    } while (!this.abortController.signal.aborted)
  }

  private async syncUpdateOffset() {
    if (this.skipOffsetSync) return
    d('Syncing update offset...')
    await this.telegram.callApi('getUpdates', { offset: this.offset, limit: 1 })
  }

  async start(handleUpdate: UpdateHandler) {
    if (this.abortController.signal.aborted) {
      throw new Error('Polling instances must not be reused!')
    }
    try {
      for await (const updates of this) {
        await Promise.all(updates.map((update) => handleUpdate(update)))
      }
    } finally {
      d('Long polling stopped')
      // prevent instance reuse
      this.stop()
      await this.syncUpdateOffset().catch(noop)
    }
  }

  stop() {
    this.abortController.abort()
  }
}
