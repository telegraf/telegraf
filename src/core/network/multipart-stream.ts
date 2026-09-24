import * as stream from 'stream'
import { hasPropType } from '../helpers/check'
const CRNL = '\r\n'

interface Part {
  headers: { [key: string]: string }
  body: NodeJS.ReadStream | NodeJS.ReadableStream | Buffer | string
}

/**
 * Builds a multipart/form-data body as a single stream.
 */
class MultipartStream extends stream.Readable {
  private readonly parts: Part[] = []
  // Not `iterator`: Readable already declares a method by that name.
  private chunks?: AsyncIterator<Buffer>

  constructor(private readonly boundary: string) {
    super()
  }

  addPart(part: Part) {
    this.parts.push(part)
  }

  private async *build(): AsyncGenerator<Buffer> {
    yield Buffer.from(`--${this.boundary}${CRNL}`)
    let first = true
    for (const part of this.parts) {
      if (!first) yield Buffer.from(`${CRNL}--${this.boundary}${CRNL}`)
      first = false
      let headers = ''
      for (const [key, header] of Object.entries(part.headers)) {
        headers += `${key}:${header}${CRNL}`
      }
      yield Buffer.from(headers + CRNL)
      const body = part.body
      if (MultipartStream.isStream(body)) {
        // Streams predating async iteration are piped through a PassThrough, which has it.
        // The type says every ReadableStream is async-iterable; not every runtime object is.
        const maybe = body as Partial<AsyncIterable<string | Buffer>>
        let source: AsyncIterable<string | Buffer>
        if (typeof maybe[Symbol.asyncIterator] === 'function') {
          source = body as AsyncIterable<string | Buffer>
        } else {
          // Not `body.pipe(new PassThrough())`: a hand-rolled stream may not return its
          // destination.
          const passthrough = new stream.PassThrough()
          body.pipe(passthrough)
          source = passthrough
        }
        for await (const chunk of source) {
          yield Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        }
      } else {
        yield Buffer.isBuffer(body) ? body : Buffer.from(String(body))
      }
    }
    yield Buffer.from(`${CRNL}--${this.boundary}--`)
  }

  _read() {
    if (this.chunks === undefined) this.chunks = this.build()
    this.chunks.next().then(
      ({ value, done }) => this.push(done === true ? null : value),
      (error: unknown) => this.destroy(error as Error)
    )
  }

  /**
   * Releases the part sources when the body is abandoned — an aborted or failed upload.
   * Returning the generator runs the `for await` cleanup, which destroys the part being
   * read; parts not reached yet were still opened by `attachFormMedia`, so they are closed
   * here too. Neither is awaited: a source that never produces would never call back.
   */
  _destroy(error: Error | null, callback: (error?: Error | null) => void) {
    const chunks = this.chunks
    this.chunks = undefined
    const returned = chunks?.return?.(undefined as never)
    if (returned !== undefined) returned.catch(() => undefined)
    for (const part of this.parts) {
      const body = part.body
      if (
        MultipartStream.isStream(body) &&
        typeof (body as stream.Readable).destroy === 'function'
      ) {
        ;(body as stream.Readable).destroy()
      }
    }
    callback(error)
  }

  static isStream(stream: unknown): stream is NodeJS.ReadableStream {
    return (
      typeof stream === 'object' &&
      stream !== null &&
      hasPropType(stream, 'pipe', 'function')
    )
  }
}

export default MultipartStream
