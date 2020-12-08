import * as tt from '../../telegram-types'
import AbortController from 'abort-controller'
import ApiClient from './client'
import d from 'debug'
import { promisify } from 'util'
const wait = promisify(setTimeout)
const debug = d('telegraf:polling')
const noop = () => {}

export class Polling {
  private readonly abortController = new AbortController()
  private stopCallback = noop
  constructor(
    private readonly telegram: ApiClient,
    private readonly allowedUpdates: readonly tt.UpdateType[]
  ) {}

  async *[Symbol.asyncIterator](): AsyncGenerator<tt.Update[], void, void> {
    let offset = 0
    do {
      try {
        const updates = await this.telegram.callApi(
          'getUpdates',
          { timeout: 60, offset, allowed_updates: this.allowedUpdates },
          this.abortController
        )
        const last = updates[updates.length - 1]
        if (last !== undefined) {
          offset = last.update_id + 1
        }
        yield updates
      } catch (err) {
        if (err.name === 'AbortError') return this.stopCallback()
        if (err.code === 401 || err.code === 409) throw err
        const retryAfter = err.parameters?.retry_after ?? 5
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        debug(`Failed to fetch updates. Retrying after ${retryAfter}s`, err)
        await wait(retryAfter * 1000)
      }
    } while (!this.abortController.signal.aborted)
    await this.telegram.callApi('getUpdates', { timeout: 0, offset })
    return this.stopCallback()
  }

  async consume(handleUpdates: (updates: tt.Update[]) => Promise<void>) {
    for await (const updates of this) {
      await handleUpdates(updates)
    }
  }

  stop() {
    debug('Gracefully stopping long polling...')
    return new Promise<void>((resolve) => {
      this.stopCallback = resolve
      this.abortController.abort()
    })
  }
}
