/* eslint-disable @typescript-eslint/no-non-null-assertion */
interface Drift<E> {
  prev: Drift<E> | null
  next: Drift<E> | null

  task: Promise<void>

  date: number
  elem: E
}

export class DecayingDeque<E> {
  private length: number = 0
  private head: Drift<E> | null = null
  private tail: Drift<E> | null = null

  private readonly concurrency: number
  private timer: NodeJS.Timeout | undefined
  private subscribers: Array<(capacity: number) => void> = []

  /**
   * Creates a new decaying queue, confer
   * @param handlerTimeout max period of time for a task
   * @param worker task generator
   * @param concurrency `add` will return only after the number of pending tasks fell below `concurrency`. `false` means `1`, `true` means `Infinity`, numbers below `1` mean `1`
   * @param catchError error handler
   * @param catchTimeout timeout handler
   */
  constructor(
    private readonly handlerTimeout: number,
    private readonly worker: (t: E) => Promise<void>,
    concurrency: boolean | number,
    private readonly catchError: (err: unknown, elem: E) => Promise<void>,
    private readonly catchTimeout: (t: E, task: Promise<void>) => void
  ) {
    if (concurrency === false) this.concurrency = 1
    else if (concurrency === true) this.concurrency = Infinity
    else this.concurrency = concurrency < 1 ? 1 : concurrency
  }

  /**
   * Adds the provided elements to the queue and starts tasks for all of them
   * immediately. Returns a `Promise` that resolves with `concurrency - length`
   * once this value becomes positive.
   * @param elems elements to be added
   * @returns `capacity - length` inside a `Promise`
   */
  add(elems: E[]): Promise<number> {
    const len = elems.length
    const capacity = this.concurrency - (this.length += len)

    if (len > 0) {
      let i = 0
      const now = Date.now()
      if (this.head === null) {
        this.head = this.tail = this.toDrift(elems[i++]!, now)
        this.startTimer()
      }

      let prev = this.tail!
      while (i < len) {
        const node = this.toDrift(elems[i++]!, now)
        prev.next = node
        node.prev = prev
        prev = node
      }
      this.tail = prev
    }

    return capacity > 0
      ? Promise.resolve(capacity)
      : new Promise((resolve) => this.subscribers.push(resolve))
  }

  private decay(node: Drift<E>): void {
    if (node.date !== node.next?.date)
      if (this.head === node) {
        if (this.timer !== undefined) clearTimeout(this.timer)
        if (node.next === null) this.timer = undefined
        else this.startTimer(node.next.date + this.handlerTimeout - Date.now())
      }
    this.remove(node)
  }

  private remove(node: Drift<E>): void {
    if (this.head === node) this.head = node.next
    else node.prev!.next = node.next
    if (this.tail === node) this.tail = node.prev
    else node.next!.prev = node.prev

    node.date = -1
    const capacity = this.concurrency - --this.length
    if (capacity > 0) {
      this.subscribers.forEach((resolve) => resolve(capacity))
      this.subscribers = []
    }
  }

  private toDrift(elem: E, date: number): Drift<E> {
    const node: Drift<E> = {
      prev: null,
      task: this.worker(elem)
        .catch(async (err) => {
          if (node.date > 0) await this.catchError(err, elem)
          else throw err
        })
        .finally(() => {
          if (node.date > 0) this.decay(node)
        }),
      next: null,
      date,
      elem,
    }
    return node
  }

  private startTimer(ms = this.handlerTimeout): void {
    if (ms < 1) setImmediate(() => this.timeout())
    else this.timer = setTimeout(() => this.timeout(), ms).unref()
  }

  private timeout(): void {
    if (this.head === null) return
    while (this.head.date === this.head.next?.date) {
      this.catchTimeout(this.head.elem, this.head.task)
      this.remove(this.head)
    }
    this.catchTimeout(this.head.elem, this.head.task)
    this.decay(this.head)
  }
}
