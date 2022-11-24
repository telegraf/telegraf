import { readableStreamFromReader } from 'https://deno.land/std@0.165.0/streams/mod.ts'
import { basename } from 'https://deno.land/std@0.165.0/path/mod.ts'
import { StreamFile } from '../core/network/payload.ts'

type RS = ReadableStream
export type { RS as ReadableStream }

/**
 * The local file specified by path will be uploaded to Telegram using multipart/form-data.
 *
 * 10 MB max size for photos, 50 MB for other files.
 */
export const fromLocalFile = (path: string, filename = basename(path)) =>
  new StreamFile(async function* () {
    yield* readableStreamFromReader(await Deno.open(path))
  }, filename)
