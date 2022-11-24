// file based on https://github.com/grammyjs/grammY/blob/d340d97c080b3e1bb34a593a9a238d4b8ac79c0f/src/core/payload.ts (MIT license)

export class StreamFile {
  constructor(
    readonly stream: () => AsyncIterable<Uint8Array>,
    readonly name: string
  ) {}
}

export type InputFile = StreamFile //| Blob?

// required by Deno's `fetch`
export function itrToStream<T>(iterator: AsyncIterator<T>): ReadableStream<T> {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next()
      if (done) {
        controller.close()
      } else {
        controller.enqueue(value)
      }
    },
  })
}

export class SerializationError extends TypeError {}

/**
 * Calls `JSON.stringify` but removes `null` values from objects before
 * serialization.
 *
 * @throws {SerializationError} when encountering `InputFile`
 */
export function str(value: unknown) {
  return JSON.stringify(value, (_, v) => {
    if (v instanceof StreamFile) throw new SerializationError() // caught by `createPayload`
    return v ?? undefined
  })
}

/**
 * Turns a payload into an options object that can be passed to a `fetch` call
 * by setting the necessary headers and method.
 *
 * @throws {SerializationError} when encounteting `InputFile`
 */
function createJsonPayload(payload: Record<string, unknown>) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      connection: 'keep-alive',
    },
    body: str(payload),
  }
}

/**
 * Turns a payload into an options object that can be passed to a `fetch` call
 * by setting the necessary headers and method. Note that this method creates a
 * multipart/form-data stream under the hood. If possible, a JSON payload should
 * be created instead for performance reasons.
 */
function createFormDataPayload(payload: Record<string, unknown>) {
  const boundary = createBoundary()
  const itr = payloadToMultipartItr(payload, boundary)
  return {
    method: 'POST',
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      connection: 'keep-alive',
    },
    body: itrToStream(itr),
  }
}

export function createPayload(payload: Record<string, unknown>) {
  try {
    return createJsonPayload(payload)
    // `str` might throw
  } catch (error) {
    if (!(error instanceof SerializationError)) throw error
    return createFormDataPayload(payload)
  }
}

// === Form data creation
function createBoundary() {
  // Taken from Deno std lib
  return '----------' + randomId(32)
}

function randomId(length = 16) {
  return Array.from(Array(length))
    .map(() => Math.random().toString(36)[2] || 0)
    .join('')
}

const enc = new TextEncoder()

/**
 * Takes a payload object and produces a valid multipart/form-data stream. The
 * stream is an iterator of `Uint8Array` objects. You also need to specify the
 * boundary string that was used in the Content-Type header of the HTTP request.
 *
 * @param payload a payload object
 * @param boundary the boundary string to use between the parts
 */
async function* payloadToMultipartItr(
  payload: Record<string, unknown>,
  boundary: string
): AsyncIterableIterator<Uint8Array> {
  const files = extractFiles(payload)
  // Start multipart/form-data protocol
  yield enc.encode(`--${boundary}\r\n`)
  // Send all payload fields
  const separator = enc.encode(`\r\n--${boundary}\r\n`)
  let first = true
  for (const [key, value] of Object.entries(payload)) {
    if (value == null) continue
    if (!first) yield separator
    yield valuePart(key, typeof value === 'object' ? str(value) : value)
    first = false
  }
  // Send all files
  for (const { id, origin, file } of files) {
    if (!first) yield separator
    yield* filePart(id, origin, file)
    first = false
  }
  // End multipart/form-data protocol
  yield enc.encode(`\r\n--${boundary}--\r\n`)
}

type ExtractedFile = { id: string; origin: string; file: InputFile }

/**
 * Replaces all instances of `InputFile` in a given payload by attach://
 * strings. This alters the passed object. After calling this method, the
 * payload object can be stringified.
 *
 * Returns a list of `InputFile` instances along with the random identifiers
 * that were used in the corresponding attach:// strings, as well as the origin
 * keys of the original payload object.
 *
 * @param value a payload object, or a part of it
 * @param key the origin key of the payload object, if a part of it is passed
 * @returns the cleaned payload object
 */
function extractFiles(value: unknown, key?: string): ExtractedFile[] {
  if (typeof value !== 'object' || value === null) return []
  return Object.entries(value).flatMap(([k, v]) => {
    const origin = key ?? k
    if (Array.isArray(v)) return v.flatMap((p) => extractFiles(p, origin))
    else if (v instanceof StreamFile) {
      const id = randomId()
      Object.assign(value, { [k]: `attach://${id}` })
      return { id, origin, file: v }
    } else return extractFiles(v, origin)
  })
}

/** Turns a regular value into a `Uint8Array` */
function valuePart(key: string, value: unknown): Uint8Array {
  return enc.encode(
    `content-disposition:form-data;name="${key}"\r\n\r\n${value}`
  )
}

/** Turns an `InputFile` into a generator of `Uint8Array`s */
async function* filePart(
  id: string,
  origin: string,
  input: InputFile
): AsyncIterableIterator<Uint8Array> {
  const filename = input.name || `${origin}.${getExt(origin)}`
  if (filename.includes('\r') || filename.includes('\n')) {
    throw new Error(
      `File paths cannot contain carriage-return (\\r) \
or newline (\\n) characters! Filename for property '${origin}' was:
"""
${filename}
"""`
    )
  }
  yield enc.encode(
    `content-disposition:form-data;name="${id}";filename=${filename}\r\ncontent-type:application/octet-stream\r\n\r\n`
  )
  yield* input.stream()
}

/** Returns the default file extension for an API property name */
function getExt(key: string) {
  switch (key) {
    case 'photo':
      return 'jpg'
    case 'voice':
      return 'ogg'
    case 'audio':
      return 'mp3'
    case 'animation':
    case 'video':
    case 'video_note':
      return 'mp4'
    case 'sticker':
      return 'webp'
    default:
      return 'dat'
  }
}
