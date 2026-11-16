/**
 * Builds a request body from multipart segments: a `ReadableStream` where requests can
 * stream, or a `Blob` where they cannot. Web APIs only.
 */
import type { ByteStream } from '../types/platform'
import type { Segment } from './payload'

export interface StreamBody {
  readonly stream: ReadableStream<Uint8Array>
  /**
   * Set if a source threw while being read. Some runtimes send the truncated body and
   * still resolve the request, so the caller must check this.
   */
  readonly failure?: { readonly error: unknown }
  /**
   * Stops reading, releases the open source and errors `stream`. Some runtimes never
   * cancel the body of an aborted or failed request, so the caller must call this.
   */
  close(): Promise<void>
}

/** A streaming body: segments are read one by one as the request is sent. */
export function toStream(segments: readonly Segment[]): StreamBody {
  const reader = new SegmentReader(segments)
  let failure: { error: unknown } | undefined
  let streamController: ReadableStreamDefaultController<Uint8Array> | undefined

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller
    },
    async pull(controller) {
      let chunk: Uint8Array | undefined
      try {
        chunk = await reader.read()
      } catch (error) {
        // A read interrupted by `close()` is not a source failure.
        if (reader.closed) return
        failure = { error }
        controller.error(error)
        // Erroring `stream` doesn't call its `cancel`, and the default transport only holds
        // `stream`, so the source is released here.
        reader.close().catch(noop)
        return
      }
      if (reader.closed) return
      if (chunk === undefined) controller.close()
      else controller.enqueue(chunk)
    },
    cancel: () => reader.close(),
  })

  // A fetch without stream support would stringify the body and upload the text
  // "[object ReadableStream]".
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
    close() {
      const closing = reader.close()
      // After `reader.close()`, `stream` doesn't produce another chunk.
      // Deno goes on sending the body after an early response, so it
      // would wait on `stream` until the server closes the connection.
      streamController?.error(
        new DOMException('The request body was closed.', 'AbortError')
      )
      return closing
    },
  }
}

export interface BlobOptions {
  type?: string
  /** Aborts the read. The promise rejects with the signal's reason immediately. */
  signal?: AbortSignal
}

/**
 * A body of known size, for where requests cannot stream. `Blob` segments are used as
 * they are; stream sources are buffered in memory.
 */
export async function toBlob(
  segments: readonly Segment[],
  { type, signal }: BlobOptions = {}
): Promise<Blob> {
  if (signal?.aborted === true) throw signal.reason
  const parts: (Uint8Array | Blob)[] = []
  // The most recently opened stream.
  let source: SourceReader | undefined
  const readAll = async () => {
    for (const segment of segments) {
      if (typeof segment !== 'function') {
        parts.push(segment)
        continue
      }
      source = openSource(segment())
      for (;;) {
        const chunk = await source.read()
        if (chunk === undefined || signal?.aborted === true) break
        parts.push(chunk)
      }
      // A stream opened after an abort would never be released.
      if (signal?.aborted === true) return
    }
  }
  try {
    await (signal === undefined ? readAll() : mayAbortWith(signal, readAll()))
  } finally {
    // A source that failed or was aborted is still open. Not awaited: a generator only
    // stops at its next yield, which may never come.
    source?.cancel().catch(noop)
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

/** Reads one source stream. */
interface SourceReader {
  /** Resolves with the next chunk, or `undefined` at the end. */
  read(): Promise<Uint8Array | undefined>
  cancel(): Promise<void>
  /** Whether `cancel()` interrupts a pending read. */
  readonly interruptible: boolean
}

function openSource(stream: ByteStream): SourceReader {
  // Cancelling a reader interrupts a pending read. Not every engine can iterate a web stream.
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
  // A Node stream can be destroyed at any time; a generator only stops at its next yield.
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

/** Reads segments in order, opening each stream lazily. */
class SegmentReader {
  closed = false
  private index = 0
  private source?: SourceReader
  private reading = false
  private closing?: Promise<void>

  constructor(private readonly segments: readonly Segment[]) {}

  async read(): Promise<Uint8Array | undefined> {
    while (!this.closed) {
      if (this.source === undefined) {
        if (this.index === this.segments.length) return undefined
        const segment = this.segments[this.index++] as Segment
        if (ArrayBuffer.isView(segment)) return segment
        this.source = openSource(
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
      // The source ended. `close()` may have cleared it in the meantime.
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
    const cancelled = source.cancel().catch(noop)
    // A generator awaiting something cannot be interrupted and may never yield again. It
    // was asked to stop at its next yield; awaiting that could hang the caller.
    if (this.reading && !source.interruptible) return
    await cancelled
  }
}

const encoder = new TextEncoder()

/**
 * A copy of the chunk as bytes. A source may refill the same buffer for its next chunk,
 * while the request still holds this one until it is sent or the whole body is buffered.
 */
function toBytes(chunk: unknown): Uint8Array {
  if (typeof chunk === 'string') return encoder.encode(chunk)
  if (ArrayBuffer.isView(chunk)) {
    // Not `chunk.slice()`: a Buffer's `slice` doesn't copy.
    return new Uint8Array(
      chunk.buffer,
      chunk.byteOffset,
      chunk.byteLength
    ).slice()
  }
  if (Object.prototype.toString.call(chunk) === '[object ArrayBuffer]') {
    return new Uint8Array((chunk as ArrayBuffer).slice(0))
  }
  const kind = Object.prototype.toString.call(chunk)
  throw new TypeError(`A file stream produced ${kind}, not bytes.`)
}

function noop() {
  // intentionally empty
}
