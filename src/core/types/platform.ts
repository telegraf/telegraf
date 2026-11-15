/**
 * Types for the platform APIs that Telegraf uses.
 *
 * Each type declares only the members that Telegraf uses. A project may not have the DOM
 * lib or the types of a runtime, and they declare some of these APIs incompatibly: the
 * `ReadableStream` of the DOM lib is not assignable to Node's.
 */

/** Web APIs: in browsers, Deno, Bun, Cloudflare Workers, and Node 18 and later. */
export declare namespace Web {
  interface ReadableStream {
    getReader(): {
      read(): Promise<{ done: boolean; value?: Uint8Array }>
      cancel(reason?: unknown): Promise<void>
    }
    cancel(reason?: unknown): Promise<void>
    readonly locked?: boolean
  }

  interface URL {
    readonly href: string
  }

  /** A `Blob` or a `File`. */
  interface Blob {
    readonly size: number
    readonly type: string
    stream(): ReadableStream
  }

  /** A `Response`, passed as the contents of a file. */
  interface Response {
    readonly ok?: boolean
    readonly status: number
    readonly statusText?: string
    readonly url?: string
    readonly body: ByteStream | null
  }
}

/** Node APIs. */
export declare namespace Node {
  /** Implementations from before async iteration may only have `pipe`. */
  interface Readable {
    pipe(destination: unknown): unknown
    destroy?: () => void
    readonly destroyed?: boolean
    readonly readableEnded?: boolean
  }
}

/** A Node stream, a web stream or another async iterable of bytes. */
export type ByteStream = AsyncIterable<Uint8Array | string> | Web.ReadableStream

/** The response of a `fetch` call. */
export interface FetchResponse {
  readonly status: number
  readonly statusText: string
  json(): Promise<unknown>
  /** The body stream. Unused by the client itself; read when downloading a file. */
  readonly body?: unknown
}

/** The options that the client passes to `fetch`. */
export interface FetchInit {
  method: string
  headers: Record<string, string>
  /**
   * A string, a `Blob` or a `ReadableStream` of bytes. DOM, Node, and undici each declare
   * incompatible types, so we leave it as any.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
  /**
   * The runtime's own `AbortSignal`, not a type of ours: a wrapper passes `init` on to a
   * `fetch` that requires the runtime's type.
   */
  signal: AbortSignal
  /** Required for a stream body. */
  duplex: 'half'
}

/** A `fetch` function. */
export type FetchFn = (url: string, init: FetchInit) => Promise<FetchResponse>

/** The globals that a runtime may have. */
export interface Globals {
  process?: {
    emitWarning?: (warning: string, type: string, code: string) => void
  }
  navigator?: { userAgent?: string }
}
