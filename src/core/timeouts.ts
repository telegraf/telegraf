import Yallist = require('yallist')

const NODEJS_MAX_TIMER_DURATION = 0x7fffffff

export class TimeoutError extends Error {}

interface Drift {
  readonly timeoutsAt: number
  readonly reject: (error: TimeoutError) => void
}

function shiftExpired(list: Yallist<Drift>) {
  if (list.head != null && list.head.value.timeoutsAt < Date.now()) {
    return list.shift()
  }
}

export class Timeouts {
  private readonly list = new Yallist<Drift>()

  constructor(private readonly timeout: number) {
    if (!(timeout > 0)) {
      throw new RangeError(`Expected positive timeout, got ${timeout}`)
    }
  }

  add(promise: Promise<void>) {
    if (this.timeout >= NODEJS_MAX_TIMER_DURATION) {
      return promise
    }
    return new Promise<void>((resolve, reject) => {
      const timeoutsAt = Date.now() + this.timeout
      const node = new Yallist.Node<Drift>({ timeoutsAt, reject })
      this.list.pushNode(node)
      this.runTimer()
      promise.then(resolve, reject).finally(() => {
        if (node.list != null) {
          this.list.removeNode(node)
        }
      })
    })
  }

  private isTimerRunning = false
  private runTimer() {
    const node = this.list.head
    if (node == null || this.isTimerRunning) return
    this.isTimerRunning = true
    const timeLeft = node.value.timeoutsAt - Date.now()
    setTimeout(() => {
      let value
      while ((value = shiftExpired(this.list)) !== undefined) {
        value.reject(new TimeoutError())
      }
      this.isTimerRunning = false
      this.runTimer()
    }, timeLeft).unref()
  }
}
