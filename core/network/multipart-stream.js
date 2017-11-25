const stream = require('stream')
const { SandwichStream } = require('sandwich-stream')
const CRNL = '\r\n'

class MultipartStream extends SandwichStream {
  constructor (boundary) {
    super({
      head: `--${boundary}${CRNL}`,
      tail: `${CRNL}--${boundary}--`,
      separator: `${CRNL}--${boundary}${CRNL}`
    })
  }

  addPart (part) {
    part = part || {}
    const partStream = new stream.PassThrough()
    if (part.headers) {
      for (let key in part.headers) {
        const header = part.headers[key]
        partStream.write(`${key}:${header}${CRNL}`)
      }
    }
    partStream.write(CRNL)
    if (MultipartStream.isStream(part.body)) {
      part.body.pipe(partStream)
    } else {
      partStream.end(part.body)
    }
    this.add(partStream)
  }

  static isStream (stream) {
    return stream && typeof stream === 'object' && typeof stream.pipe === 'function'
  }
}

module.exports = MultipartStream
