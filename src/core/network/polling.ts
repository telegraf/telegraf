import * as tt from '../../telegram-types'
import AbortController from 'abort-controller'
import ApiClient from './client'
import d from 'debug'
import { promisify } from 'util'
import { TelegramError } from './error'
const debug = d('telegraf:polling')
const wait = promisify(setTimeout)
function always<T>(x: T) {
  return () => x
}
const noop = always(Promise.resolve())

export class Polling {
  private readonly abortController = new AbortController()
  private offset = 0
  constructor(
    private readonly telegram: ApiClient,
    private readonly allowedUpdates: readonly tt.UpdateType[],
    private readonly skipOffsetSync: boolean
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
          this.abortController
        )
        const last = updates[updates.length - 1]
        if (last !== undefined) {
          this.offset = last.update_id + 1
        }
        yield updates
      } catch (err) {
        if (err.name === 'AbortError') return
        if (
          err.name === 'FetchError' ||
          (err instanceof TelegramError && err.code >= 500)
        ) {
          const retryAfter: number = err.parameters?.retry_after ?? 5
          debug('Failed to fetch updates, retrying after %ds.', retryAfter, err)
          await wait(retryAfter * 1000)
          continue
        }
        throw err
      }
    } while (!this.abortController.signal.aborted)
  }

  private async syncUpdateOffset() {
    if (!this.skipOffsetSync) {
      debug('Syncing update offset...')
      await this.telegram
        .callApi('getUpdates', { offset: this.offset, limit: 1 })
        .catch(noop)
    }
  }

  async loop(handleUpdates: (updates: tt.Update[]) => Promise<void>) {
    if (this.abortController.signal.aborted) {
      throw new Error('Polling instances must not be reused!')
    }
    try {
      for await (const updates of this) {
        await handleUpdates(updates)
      }
      await this.syncUpdateOffset()
    } catch (err: unknown) {
      if (
        !(err instanceof TelegramError) ||
        // Unauthorized      Conflict
        (err.code !== 401 && err.code !== 409)
      ) {
        await this.syncUpdateOffset()
      }
      throw err
    } finally {
      debug('Long polling stopped')
      // prevent instance reuse
      this.stop()
    }
  }

  stop() {
    this.abortController.abort()
  }
}
