/*
  ===
  Adopted from https://github.com/nodejs/node/blob/a01dbf179ec5bf53cb19041303afd55e1d1e9f3f/lib/stream/consumers.js
  Copyright Joyent and Node contributors. All rights reserved. MIT license.
  ===
*/

async function text(
  stream: AsyncIterable<string> | ReadableStream
): Promise<string> {
  const dec = new TextDecoder()
  let str = ''
  for await (const chunk of stream) {
    if (typeof chunk === 'string') str += chunk
    else str += dec.decode(chunk, { stream: true })
  }
  // Flush the streaming TextDecoder so that any pending
  // incomplete multibyte characters are handled.
  str += dec.decode(undefined, { stream: false })
  return str
}

export async function json(
  stream: AsyncIterable<string> | ReadableStream
): Promise<any> {
  const str = await text(stream)
  return JSON.parse(str)
}
