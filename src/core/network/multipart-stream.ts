import * as stream from 'stream'
import { hasPropType } from '../helpers/check'
import SandwichStream from 'sandwich-stream'
const CRNL = '\r\n'

interface Part {
  headers: { [key: string]: string }
  body: NodeJS.ReadStream | NodeJS.ReadableStream | string
}

class MultipartStream extends SandwichStream {
  constructor(boundary: string) {
    super({
      head: `--${boundary}${CRNL}`,
      tail: `${CRNL}--${boundary}--`,
      separator: `${CRNL}--${boundary}${CRNL}`,
    })
  }

  addPart(part: Part) {
    const partStream = new stream.PassThrough()
    for (const [key, header] of Object.entries(part.headers)) {
      partStream.write(`${key}:${header}${CRNL}`)
    }
    partStream.write(CRNL)
    if (MultipartStream.isStream(part.body)) {
      part.body.pipe(partStream)
    } else {
      partStream.end(part.body)
    }
    this.add(partStream)
  }

  static isStream(
    stream: unknown
  ): stream is { pipe: MultipartStream['pipe'] } {
    return (
      typeof stream === 'object' &&
      stream !== null &&
      hasPropType(stream, 'pipe', 'function')
    )
  }
}

export default MultipartStream
