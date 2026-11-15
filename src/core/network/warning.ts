import type { Globals } from '../types/platform'

/** The codes of the warnings that have been issued. */
const issued = new Set<string>()

/**
 * Issues a deprecation warning, once in a process for each code.
 * Uses `process.emitWarning`, so Node's own switches apply to it.
 */
export function warnOnce(code: string, message: string) {
  if (issued.has(code)) return
  issued.add(code)
  const { process: emitter, navigator: agent }: Globals = globalThis
  // Cloudflare Workers can have `emitWarning`, but no builtin
  // listener prints it, so we fall back to console.warn.
  const printed = agent?.userAgent !== 'Cloudflare-Workers'
  if (printed && typeof emitter?.emitWarning === 'function') {
    emitter.emitWarning(message, 'DeprecationWarning', code)
  } else {
    console.warn(message)
  }
}
