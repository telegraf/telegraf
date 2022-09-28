import { createReadStream } from 'node:fs'
import { basename } from 'node:path'
import { Readable } from 'node:stream'
import { StreamFile } from './core/network/client'
import { fetch } from './vendor/fetch'

/**
 * The local file specified by path will be uploaded to Telegram using multipart/form-data.
 *
 * 10 MB max size for photos, 50 MB for other files.
 */
export const fromLocalFile = (path: string, filename = basename(path)) =>
  new StreamFile(() => createReadStream(path), filename)

/**
 * The buffer will be uploaded as file to Telegram using multipart/form-data.
 *
 * 10 MB max size for photos, 50 MB for other files.
 */
export const fromBuffer = (buffer: Uint8Array, name: string) =>
  new StreamFile(() => Readable.from(buffer), name)

/**
 * Contents of the stream will be uploaded as file to Telegram using multipart/form-data.
 *
 * 10 MB max size for photos, 50 MB for other files.
 */
export const fromReadableStream = (
  stream: AsyncIterable<Uint8Array>,
  filename: string
) => new StreamFile(() => stream, filename)

/**
 * Contents of the URL will be streamed to Telegram.
 *
 * 10 MB max size for photos, 50 MB for other files.
 */
export const fromURLStream = (url: string | URL, filename: string) =>
  new StreamFile(() => {
    return {
      // create AsyncIterable from Promise<ReadableStream>
      async *[Symbol.asyncIterator]() {
        const body = await fetch(url).then((res) => res.body)
        if (!body)
          throw new Error(
            'Unexpected empty body attempting to stream file contents from URL'
          )
        for await (const chunk of body) yield chunk as Uint8Array
      },
    }
  }, filename)

/**
 * Provide Telegram with an HTTP URL for the file to be sent.
 * Telegram will download and send the file.
 *
 * * The target file must have the correct MIME type (e.g., audio/mpeg for `sendAudio`, etc.).
 * * `sendDocument` with URL will currently only work for GIF, PDF and ZIP files.
 * * To use `sendVoice`, the file must have the type audio/ogg and be no more than 1MB in size.
 * 1-20MB voice notes will be sent as files.
 *
 * 5 MB max size for photos and 20 MB max for other types of content.
 */
export const fromURL = (url: string | URL): string => url.toString()

/**
 * If the file is already stored somewhere on the Telegram servers, you don't need to reupload it:
 * each file object has a file_id field, simply pass this file_id as a parameter instead of uploading.
 *
 * It is not possible to change the file type when resending by file_id.
 *
 * It is not possible to resend thumbnails using file_id.
 * They have to be uploaded using one of the other Input methods.
 *
 * There are no limits for files sent this way.
 */
export const fromFileId = (fileId: string): string => fileId
