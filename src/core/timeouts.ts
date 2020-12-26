import { inspect } from 'util'
import Yallist = require('yallist')

export class TimeoutError<C> extends Error {
  constructor(readonly ctx: C) {
    super(inspect(ctx))
  }
}

interface Drift<C> {
  readonly ctx: C
  readonly timeoutsAt: number
  readonly reject: (error: TimeoutError<C>) => void
}

const NODEJS_MAX_TIMER_DURATION = 0x7fffffff
const MIN_TIMEOUT_DURATION = 5_000 // 5s in ms

export class Timeouts<C> {
  private readonly list = new Yallist<Drift<C>>()

  constructor(private readonly timeout: number) {}

  add(fn: (ctx: C) => Promise<void>, ctx: C) {
    return new Promise<void>((resolve, reject) => {
      const timeoutsAt = Date.now() + this.timeout
      const node = new Yallist.Node<Drift<C>>({ ctx, timeoutsAt, reject })
      if (this.timeout < NODEJS_MAX_TIMER_DURATION) {
        this.list.pushNode(node)
        this.runTimer()
      }
      fn(ctx)
        .then(resolve, reject)
        .finally(() => {
          if (node.list != null) {
            this.list.removeNode(node)
          }
        })
    })
  }

  private isTimerRunning = false
  private runTimer() {
    const node = this.list.tail // head works too, sets timers more often
    if (node == null || this.isTimerRunning) return
    this.isTimerRunning = true
    const timeLeft = node.value.timeoutsAt - Date.now()
    const ms = Math.max(timeLeft, MIN_TIMEOUT_DURATION)
    setTimeout(() => {
      try {
        while (true) {
          const node = this.list.head
          if (node == null) break
          const { value } = node
          if (value.timeoutsAt > Date.now()) break
          this.list.removeNode(node)
          value.reject(new TimeoutError(value.ctx))
        }
      } finally {
        this.isTimerRunning = false
        this.runTimer()
      }
    }, ms).unref()
  }
}
