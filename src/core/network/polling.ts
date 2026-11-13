import * as tg from '../types/typegram'
import * as tt from '../../telegram-types'
import AbortController, { type AbortSignal } from 'abort-controller'
import ApiClient from './client'
import d from 'debug'
import { TelegramError } from './error'
const debug = d('telegraf:polling')

/** Resolves after `ms`, or as soon as the signal is aborted. */
function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }
    const end = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', end)
      resolve()
    }
    const timer = setTimeout(end, ms)
    signal.addEventListener('abort', end)
  })
}

function always<T>(x: T) {
  return () => x
}
const noop = always(Promise.resolve())

function getErrorName(error: unknown): unknown {
  if (typeof error !== 'object' || error === null) return undefined
  return 'name' in error ? error.name : undefined
}

/** The `parameters.retry_after` of an API error, in seconds. */
function getRetryAfter(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  if (!('parameters' in error)) return undefined
  const { parameters } = error
  if (typeof parameters !== 'object' || parameters === null) return undefined
  if (!('retry_after' in parameters)) return undefined
  const { retry_after: seconds } = parameters
  return typeof seconds === 'number' ? seconds : undefined
}

export class Polling {
  private readonly abortController = new AbortController()
  private skipOffsetSync = false
  private offset = 0
  constructor(
    private readonly telegram: ApiClient,
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
          this.abortController
        )
        const last = updates[updates.length - 1]
        if (last !== undefined) {
          this.offset = last.update_id + 1
        }
        yield updates
      } catch (error) {
        const stopped = this.abortController.signal.aborted
        if (stopped && getErrorName(error) === 'AbortError') return
        // A failed request rejects with the transport's own error: a `FetchError` from
        // node-fetch, a `TypeError` from a standard fetch and from Bun, where `node-fetch`
        // is Bun's `fetch`. So anything that is not an API error is a failed request.
        if (
          !(error instanceof TelegramError) ||
          error.code === 429 ||
          error.code >= 500
        ) {
          const retryAfter = getRetryAfter(error) ?? 5
          debug(
            'Failed to fetch updates, retrying after %ds.',
            retryAfter,
            error
          )
          // `stop()` must not have to wait for a retry that will not happen.
          await wait(retryAfter * 1000, this.abortController.signal)
          continue
        }
        // Unauthorized      Conflict
        if (error.code === 401 || error.code === 409) {
          this.skipOffsetSync = true
        }
        throw error
      }
    } while (!this.abortController.signal.aborted)
  }

  private async syncUpdateOffset() {
    if (this.skipOffsetSync) return
    debug('Syncing update offset...')
    await this.telegram.callApi('getUpdates', { offset: this.offset, limit: 1 })
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
