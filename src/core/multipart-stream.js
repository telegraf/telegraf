import { PassThrough } from 'stream'
import { SandwichStream } from 'sandwich-stream'

/* eslint-disable guard-for-in */
const CRNL = '\r\n'

export interface StreamPart {
  headers?: {},
  body: any
}

export class MultipartStream extends SandwichStream {
  constructor(boundary: string) {
    super({
      head: `--${boundary}${CRNL}`,
      tail: `${CRNL}--${boundary}--`,
      separator: `${CRNL}--${boundary}${CRNL}`,
    })
  }

  addPart(part: $Shape<StreamPart>) {
    const partStream = new PassThrough()

    if (part.headers) {
      for (const key in part.headers) {
        const header = part.headers[key]

        partStream.write(`${key}:${header}${CRNL}`)
      }
    }
    partStream.write(CRNL)
    if (MultipartStream.isStream(part.body)) {
      part.body.pipe(partStream)
    }
    else {
      partStream.end(part.body)
    }
    this.add(partStream)
  }

  static isStream(targetStream: any) {
    return targetStream && typeof targetStream === 'object' && typeof targetStream.pipe === 'function'
  }
}
