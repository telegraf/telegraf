import Yallist = require('yallist')

export class TimeoutError extends Error {}

interface Drift {
  readonly timeoutsAt: number
  readonly reject: (error: TimeoutError) => void
}

const NODEJS_MAX_TIMER_DURATION = 0x7fffffff
const MIN_TIMEOUT_DURATION = 5_000 // 5s in ms

function popExpired(list: Yallist<Drift>) {
  if (list.head != null && list.head.value.timeoutsAt < Date.now()) {
    return list.pop()
  }
}

export class Timeouts {
  private readonly list = new Yallist<Drift>()

  constructor(private readonly timeout: number) {}

  add(promise: Promise<void>) {
    return new Promise<void>((resolve, reject) => {
      const timeoutsAt = Date.now() + this.timeout
      const node = new Yallist.Node<Drift>({ timeoutsAt, reject })
      if (this.timeout < NODEJS_MAX_TIMER_DURATION) {
        this.list.pushNode(node)
        this.runTimer()
      }
      promise.then(resolve, reject).finally(() => {
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
      let value
      while ((value = popExpired(this.list)) !== undefined) {
        value.reject(new TimeoutError())
      }
      this.isTimerRunning = false
      this.runTimer()
    }, ms).unref()
  }
}
