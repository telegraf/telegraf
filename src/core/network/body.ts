/**
 * Turns the segments of a multipart body into `ReadableStream` where streaming is
 * possible, or `Blob` that `fetch` can send. Web APIs only.
 */
import type { ByteStream, Segment } from './payload'

export interface StreamBody {
  readonly stream: ReadableStream<Uint8Array>
  /**
   * Set when a source failed while it was being read. Some runtimes resolve the request
   * anyway, having sent a truncated body, so the caller must check.
   */
  readonly failure?: { readonly error: unknown }
  /**
   * Stops reading and releases the source that is open. Some runtimes never cancel the
   * stream of a request that was aborted or that failed, so the caller must do it.
   */
  close(): Promise<void>
}

/** A body that is read segment by segment, as the request is sent. */
export function toStream(segments: readonly Segment[]): StreamBody {
  const reader = new SegmentReader(segments)
  let failure: { error: unknown } | undefined

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      let chunk: Uint8Array | undefined
      try {
        chunk = await reader.read()
      } catch (error) {
        // A read that `close` interrupted is not a failure of the source.
        if (reader.closed) return
        failure = { error }
        controller.error(error)
        return
      }
      if (reader.closed) return
      if (chunk === undefined) controller.close()
      else controller.enqueue(chunk)
    },
    cancel: () => reader.close(),
  })

  // Only an implementation that does not understand streams converts one to a string, and
  // would then send the text "[object ReadableStream]" as the body.
  Object.defineProperty(stream, 'toString', {
    value() {
      throw new TypeError(
        'This fetch cannot send a ReadableStream. Telegraf needs a standard fetch.'
      )
    },
  })

  return {
    stream,
    get failure() {
      return failure
    },
    close: () => reader.close(),
  }
}

export interface BlobOptions {
  type?: string
  /** Stops the reading. The promise then rejects with the signal's reason, at once. */
  signal?: AbortSignal
}

/**
 * A body of known size. A `Blob` segment is not read; a stream is read into memory, since
 * nothing else can be sent where requests cannot be streamed.
 */
export async function toBlob(
  segments: readonly Segment[],
  { type, signal }: BlobOptions = {}
): Promise<Blob> {
  if (signal?.aborted === true) throw signal.reason
  const parts: (Uint8Array | Blob)[] = []
  // The stream that was opened last.
  let source: Source | undefined
  const read = async () => {
    for (const segment of segments) {
      if (typeof segment !== 'function') {
        parts.push(segment)
        continue
      }
      source = open(segment())
      for (;;) {
        const chunk = await source.read()
        if (chunk === undefined || signal?.aborted === true) break
        parts.push(chunk)
      }
      // No other stream is opened once the reading has been abandoned.
      if (signal?.aborted === true) return
    }
  }
  try {
    await (signal === undefined ? read() : mayAbortWith(signal, read()))
  } finally {
    // It is released: it may have failed, or been abandoned. Nothing waits for that, since
    // a generator stops only when it next yields, which it may never do.
    source?.cancel().catch(ignore)
  }
  return new Blob(parts, type === undefined ? undefined : { type })
}

/** Settles as the promise does, or rejects as soon as the signal aborts. */
function mayAbortWith<T>(signal: AbortSignal, promise: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(signal.reason)
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
    promise.then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', abort)
    })
  })
}

/** One stream being read. */
interface Source {
  /** The next chunk, or `undefined` at the end. */
  read(): Promise<Uint8Array | undefined>
  cancel(): Promise<void>
  /** Whether `cancel` ends a read that is waiting. */
  readonly interruptible: boolean
}

function open(stream: ByteStream): Source {
  // A web stream is read through its reader, not by iteration: cancelling a reader ends a
  // read that is waiting, and not every engine can iterate a stream.
  if ('getReader' in stream && typeof stream.getReader === 'function') {
    const reader = stream.getReader()
    return {
      interruptible: true,
      async read() {
        const { done, value } = await reader.read()
        return done ? undefined : toBytes(value)
      },
      cancel: () => reader.cancel(),
    }
  }

  const iterator = (stream as AsyncIterable<unknown>)[Symbol.asyncIterator]()
  // A Node stream can be told to stop; a generator can only be asked once it yields.
  const destroy = (stream as { destroy?: unknown }).destroy
  return {
    interruptible: typeof destroy === 'function',
    async read() {
      const { done, value } = await iterator.next()
      return done === true ? undefined : toBytes(value)
    },
    async cancel() {
      if (typeof destroy === 'function') destroy.call(stream)
      await iterator.return?.()
    },
  }
}

/** Reads the segments in order, opening each stream only when it is reached. */
class SegmentReader {
  closed = false
  private index = 0
  private source?: Source
  private reading = false
  private closing?: Promise<void>

  constructor(private readonly segments: readonly Segment[]) {}

  async read(): Promise<Uint8Array | undefined> {
    while (!this.closed) {
      if (this.source === undefined) {
        if (this.index === this.segments.length) return undefined
        const segment = this.segments[this.index++] as Segment
        if (ArrayBuffer.isView(segment)) return segment
        this.source = open(
          typeof segment === 'function' ? segment() : segment.stream()
        )
      }
      const source = this.source
      this.reading = true
      let chunk: Uint8Array | undefined
      try {
        chunk = await source.read()
      } finally {
        this.reading = false
      }
      if (chunk !== undefined) return chunk
      // The source has ended. `close` may have taken it in the meantime.
      if (this.source === source) this.source = undefined
    }
    return undefined
  }

  close(): Promise<void> {
    this.closing ??= this.release()
    return this.closing
  }

  private async release() {
    this.closed = true
    const source = this.source
    this.source = undefined
    if (source === undefined) return
    const cancelled = source.cancel().catch(ignore)
    // A generator that is waiting cannot be interrupted, and may wait for ever. It is asked
    // to stop, and stops when it next yields; waiting for that here could hang the caller.
    if (this.reading && !source.interruptible) return
    await cancelled
  }
}

const encoder = new TextEncoder()

function toBytes(chunk: unknown): Uint8Array {
  if (chunk instanceof Uint8Array) return chunk
  if (typeof chunk === 'string') return encoder.encode(chunk)
  if (ArrayBuffer.isView(chunk)) {
    return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
  }
  if (Object.prototype.toString.call(chunk) === '[object ArrayBuffer]') {
    return new Uint8Array(chunk as ArrayBuffer)
  }
  const kind = Object.prototype.toString.call(chunk)
  throw new TypeError(`A file stream produced ${kind}, not bytes.`)
}

function ignore() {
  // an error from a source that is being abandoned
}
