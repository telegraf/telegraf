import { Context } from '../context'
import { formatWithOptions } from 'util'

interface Drift<C extends Context> {
  ctx: C
  promise: Promise<unknown>
}

export class Timeouts<C extends Context> {
  private nextBatch = new Set<Drift<C>>()
  public minBatchSize = 1

  constructor(private readonly handlerTimeout: number) {}

  add(drift: Drift<C>) {
    const { nextBatch } = this
    nextBatch.add(drift)
    this.runTimer()
    drift.promise.finally(() => {
      nextBatch.delete(drift)
    })
  }

  private isTimerRunning = false
  private runTimer() {
    if (this.isTimerRunning) return
    if (this.nextBatch.size < this.minBatchSize) return
    this.isTimerRunning = true
    const currentBatch = this.nextBatch
    this.nextBatch = new Set()
    setTimeout(() => {
      this.isTimerRunning = false
      this.runTimer()
      if (currentBatch.size !== 0) {
        const updates = Array.from(currentBatch, ({ ctx }) => ctx.update)
        throw new Error(
          formatWithOptions(
            { colors: true, depth: 4 },
            'These updates took longer than %ds to process:',
            this.handlerTimeout / 1000,
            updates
          )
        )
      }
    }, this.handlerTimeout).unref()
  }
}
