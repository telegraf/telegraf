/**
 * Turns the arguments of an API call into the parts of a request body.
 * Builds a JSON string, or the segments of a multipart/form-data body for the client
 * to send as a `ReadableStream` or a `Blob`.
 *
 * Web APIs only, so it runs on Node, Deno, Bun, Cloudflare Workers and in a browser.
 */

/** Using Symbol.for so two copies of Telegraf recognise each other's files. */
const brand: unique symbol = Symbol.for('telegraf.MultipartFile')

export type ByteStream = AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>

/**
 * The contents of a file.
 * A stream is given as a function so an upload can be repeated.
 */
export type FileSource = Blob | Uint8Array | ArrayBuffer | (() => ByteStream)

export class MultipartFile {
  readonly [brand] = true

  constructor(
    readonly source: FileSource,
    /** Derived from the parameter if omitted. */
    readonly name?: string
  ) {}

  static is(value: unknown): value is MultipartFile {
    return (
      typeof value === 'object' &&
      value !== null &&
      (value as { [brand]?: unknown })[brand] === true
    )
  }

  toJSON(): never {
    throw new TypeError(
      'A MultipartFile cannot be serialized. It must sit in a plain object or an array.'
    )
  }
}

/** A file to send as its own multipart part. */
export interface Attachment {
  /**
   * The part's name: the key for a top-level file, otherwise a generated id that the
   * payload references as `attach://<id>`.
   */
  id: string
  /** The parameter of the API method the file was found under. */
  parameter: string
  file: MultipartFile
}

/**
 * Extracts every `MultipartFile` from a payload. A top-level file is removed and sent as the
 * part named after its key; a nested file is replaced with an `attach://<id>` reference.
 * The payload is not mutated: objects and arrays that contain a file are copied,
 * everything else is shared.
 */
export function extractFiles(payload: Record<string, unknown>): {
  payload: Record<string, unknown>
  attachments: Attachment[]
} {
  const attachments: Attachment[] = []
  // The arrays and objects that the value being visited is inside of.
  const ancestors = new Set<unknown>([payload])

  const visit = (value: unknown, parameter: string): unknown => {
    if (MultipartFile.is(value)) {
      const id = randomId()
      attachments.push({ id, parameter, file: value })
      return `attach://${id}`
    }
    const isArray = Array.isArray(value)
    if (!isArray && !isPlainObject(value)) return value
    // A value that contains itself can't be sent. `JSON.stringify` throws for it when
    // the payload is serialized, so it is left as it is.
    if (ancestors.has(value)) return value
    ancestors.add(value)
    const visited = isArray
      ? visitArray(value, parameter)
      : visitObject(value, parameter)
    ancestors.delete(value)
    return visited
  }

  const visitArray = (array: unknown[], parameter: string) => {
    let copy: unknown[] | undefined
    array.forEach((item, index) => {
      const visited = visit(item, parameter)
      if (visited === item) return
      copy ??= array.slice()
      copy[index] = visited
    })
    return copy ?? array
  }

  const visitObject = (object: Record<string, unknown>, parameter: string) => {
    let copy: Record<string, unknown> | undefined
    for (const [key, item] of Object.entries(object)) {
      const visited = visit(item, parameter)
      if (visited === item) continue
      copy ??= { ...object }
      copy[key] = visited
    }
    return copy ?? object
  }

  let fields: Record<string, unknown> | undefined
  for (const [key, value] of Object.entries(payload)) {
    // A file provided as the value to a top-level key is attached as `attach://<key>`.
    // A caller may refer to it directly from elsewhere in the payload.
    // This is for backward compatibility with abuse of top-level file keys to
    // work around Telegraf's bug that disallowed files in some nested objects.
    const file = MultipartFile.is(value)
    if (file) attachments.push({ id: key, parameter: key, file: value })
    const visited = file ? undefined : visit(value, key)
    if (visited === value) continue
    fields ??= { ...payload }
    fields[key] = visited
  }
  return { payload: fields ?? payload, attachments }
}

/** `JSON.stringify` that removes `null` and `undefined` values */
export function toJson(value: unknown): string {
  return JSON.stringify(value, (_, member: unknown) => member ?? undefined)
}

/** A piece of a multipart body. A function is a stream that hasn't been opened. */
export type Segment = Uint8Array | Blob | (() => ByteStream)

export interface Multipart {
  contentType: string
  segments: Segment[]
}

/**
 * Encodes a payload as multipart/form-data.
 */
export function toMultipart(
  payload: Record<string, unknown>,
  attachments: readonly Attachment[],
  boundary = randomId(16)
): Multipart {
  const segments: Segment[] = []
  let text = ''
  let opened = false
  const open = () => {
    text += `${opened ? '\r\n' : ''}--${boundary}\r\n`
    opened = true
  }
  const flush = () => {
    if (text !== '') segments.push(encoder.encode(text))
    text = ''
  }

  for (const [key, value] of Object.entries(payload)) {
    if (value == null) continue
    open()
    text += `content-disposition: form-data; name="${escape(key)}"\r\n\r\n`
    text += typeof value === 'object' ? toJson(value) : String(value)
  }

  for (const { id, parameter, file } of attachments) {
    const name = file.name ?? `${parameter}.${extensions[parameter] ?? 'dat'}`
    open()
    text += `content-disposition: form-data; name="${escape(id)}"; `
    text += `filename="${escape(name)}"\r\n`
    text += 'content-type: application/octet-stream\r\n\r\n'
    flush()
    segments.push(toSegment(file.source))
  }

  text += `${opened ? '\r\n' : ''}--${boundary}--\r\n`
  flush()
  return { contentType: `multipart/form-data; boundary=${boundary}`, segments }
}

const encoder = new TextEncoder()

const extensions: Record<string, string | undefined> = {
  animation: 'mp4',
  audio: 'mp3',
  photo: 'jpg',
  sticker: 'webp',
  video: 'mp4',
  video_note: 'mp4',
  voice: 'ogg',
}

function toSegment(source: FileSource): Segment {
  if (typeof source === 'function') return source
  if (Object.prototype.toString.call(source) === '[object ArrayBuffer]') {
    return new Uint8Array(source as ArrayBuffer)
  }
  return source as Uint8Array | Blob
}

/**
 * Escape a field or file name for multipart/form-data.
 * The Bot API server percent-decodes the value, and reads a backslash inside the quotes as an
 * escape, so both are encoded along with the characters that would end the value.
 */
function escape(name: string) {
  return name.replace(/[%\\"\r\n]/g, (char) => {
    return `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`
  })
}

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false
  const prototype: unknown = Object.getPrototypeOf(value)
  return prototype === null || Object.getPrototypeOf(prototype) === null
}

function randomId(bytes = 8) {
  let id = ''
  for (const byte of crypto.getRandomValues(new Uint8Array(bytes))) {
    id += byte.toString(16).padStart(2, '0')
  }
  return id
}
