import * as tg from 'typegram'
import * as tt from '../../telegram-types'
import d from 'debug'
import { promisify } from 'util'
import { TelegramError } from './error'
import Telegram from '../../telegram'
const debug = d('telegraf:polling')
const wait = promisify(setTimeout)
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
    debug('Starting long polling')
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
          debug('Failed to fetch updates, retrying after %ds.', retryAfter, err)
          await wait(retryAfter * 1000)
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
    debug('Syncing update offset...')
    await this.telegram.callApi('getUpdates', { offset: this.offset, limit: 1 })
  }

  async loop(handleUpdate: (updates: tg.Update) => Promise<void>) {
    if (this.abortController.signal.aborted) {
      throw new Error('Polling instances must not be reused!')
    }
    try {
      for await (const updates of this) {
        await Promise.all(updates.map(handleUpdate))
      }
    } finally {
      debug('Long polling stopped')
      // prevent instance reuse
      this.stop()
      await this.syncUpdateOffset().catch(noop)
    }
  }

  stop() {
    this.abortController.abort()
  }
}
