import * as _http from 'https://deno.land/std@0.165.0/node/http.ts'
import * as _https from 'https://deno.land/std@0.165.0/node/https.ts'
export { Buffer } from 'https://deno.land/std@0.165.0/node/buffer.ts'

export namespace http {
  export const createServer = _http.createServer
  export type RequestListener = NonNullable<Parameters<typeof createServer>[0]>
  type createServerParams = Parameters<RequestListener>
  export type IncomingMessage = createServerParams[0]
  export type ServerResponse = createServerParams[1]
  export type Server = ReturnType<typeof createServer>
}

/** Not implemented */
export namespace https {
  export const createServer = (
    opts: TlsOptions,
    callback: http.RequestListener
  ): http.Server =>
    (() => {
      throw new Error('Not implemented')
    }) as any
  export type Server = http.Server
}

/** Not implemented */
export type TlsOptions = {}
