import * as tg from '../types/typegram'
import * as tt from '../../telegram-types'
import ApiClient from './client'
import d from 'debug'
import { setTimeout as wait } from 'timers/promises'
import { TelegrafNetworkError, TelegramError } from './error'
const debug = d('telegraf:polling')
const DEFAULT_CONFLICT_RETRY_DELAY = 1_000
const DEFAULT_MAX_CONFLICT_RETRY_DELAY = 60_000
function always<T>(x: T) {
  return () => x
}
const noop = always(Promise.resolve())

export interface PollingOptions {
  retryOnConflict?: boolean
  conflictRetryDelay?: number
  maxConflictRetryDelay?: number
}

export class Polling {
  private readonly abortController = new AbortController()
  private skipOffsetSync = false
  private offset = 0
  private retryCount = 0
  constructor(
    private readonly telegram: ApiClient,
    private readonly allowedUpdates: readonly tt.UpdateType[],
    private readonly options: PollingOptions = {}
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
          { signal: this.abortController.signal as AbortSignal }
        )

        this.retryCount = 0
        const last = updates[updates.length - 1]
        if (last !== undefined) {
          this.offset = last.update_id + 1
        }
        yield updates
      } catch (error) {
        const err = error as Error & {
          parameters?: { retry_after: number }
          code?: string | number
        }

        if (this.abortController.signal.aborted) return

        if (
          err instanceof TelegramError &&
          err.code === 409 &&
          this.options?.retryOnConflict
        ) {
          const baseDelay =
            this.options.conflictRetryDelay ?? DEFAULT_CONFLICT_RETRY_DELAY
          const maxDelay =
            this.options.maxConflictRetryDelay ??
            DEFAULT_MAX_CONFLICT_RETRY_DELAY
          const delay = Math.min(
            baseDelay * Math.pow(2, this.retryCount++),
            maxDelay
          )

          debug(
            '409 Conflict detected (likely old connection still open). Retrying in %dms (Attempt %d)',
            delay,
            this.retryCount
          )

          await this.wait(delay)
          continue
        }

        if (
          (err instanceof TelegrafNetworkError && err.transient) ||
          (err instanceof TelegramError && err.code === 429) ||
          (err instanceof TelegramError && err.code >= 500)
        ) {
          const retryAfter =
            err instanceof TelegramError
              ? (err.parameters?.retry_after ?? 5)
              : 5
          debug('Failed to fetch updates, retrying after %ds.', retryAfter, err)
          await this.wait(retryAfter * 1000)
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

  private async wait(delay: number) {
    const { signal } = this.abortController
    try {
      await wait(delay, undefined, { signal })
    } catch (error) {
      if (!signal.aborted) throw error
    }
  }

  private async syncUpdateOffset() {
    if (this.skipOffsetSync) return
    debug('Syncing update offset...')
    await this.telegram.callApi('getUpdates', {
      offset: this.offset,
      limit: 1,
    })
  }

  async loop(handleUpdate: (updates: tg.Update) => Promise<void>) {
    if (this.abortController.signal.aborted)
      throw new Error('Polling instances must not be reused!')
    try {
      for await (const updates of this)
        await Promise.all(updates.map(handleUpdate))
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
