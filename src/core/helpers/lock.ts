export class Lock {
  private readonly queuedLocks: Map<string, Function[]>

  constructor() {
    this.queuedLocks = new Map<string, Function[]>()
  }

  async acquire(key: string) {
    const queue = this.queuedLocks.get(key)
    if (!queue) {
      this.queuedLocks.set(key, [])
      return true
    }

    const task = new Promise((resolve) => {
      queue.push(resolve)
    })

    return await task
  }

  async release(key: string) {
    const queue = this.queuedLocks.get(key)
    if (!queue) {
      console.warn('Nothing to release')
      return false
    }

    const nextLock = queue[0]
    if (!nextLock) {
      this.queuedLocks.delete(key)
      return true
    }

    this.queuedLocks.set(key, queue.slice(1))
    nextLock(true)
    return true
  }
}
