import { Context } from './context'
import { MiddlewareFn } from './middleware'

export interface SessionStore<T> {
  readonly get: (name: string) => T | undefined
  readonly set: (name: string, value: T) => void
  readonly delete: (name: string) => void
}

interface SessionOptions<S extends object> {
  getSessionKey?: (ctx: Context) => string | undefined
  store?: SessionStore<S>
}

export interface SessionContext<S extends object> extends Context {
  session?: S
}

/**
 * Returns middleware that adds `ctx.session` for storing arbitrary state per session key.
 *
 * The default `getSessionKey` is <code>\`${ctx.from.id}:${ctx.chat.id}\`</code>.
 * If either `ctx.from` or `ctx.chat` is `undefined`, default session key and thus `ctx.session` are also `undefined`.
 *
 * Session data is kept only in memory by default,
 * which means that all data will be lost when the process is terminated.
 * If you want to store data across restarts, or share it among workers,
 * you can [install persistent session middleware from npm](https://www.npmjs.com/search?q=telegraf-session),
 * or pass custom `storage`.
 *
 * @example https://github.com/telegraf/telegraf/blob/develop/docs/examples/session-bot.ts
 */
export function session<S extends object>({
  getSessionKey = defaultGetSessionKey,
  store = new Map(),
}: SessionOptions<S> = {}): MiddlewareFn<SessionContext<S>> {
  return async (ctx, next) => {
    const key = getSessionKey(ctx)
    if (key == null) {
      return await next()
    }
    Object.defineProperty(ctx, 'session', {
      get() {
        return store.get(key)
      },
      set(value) {
        if (value === undefined) {
          store.delete(key)
        } else {
          store.set(key, value)
        }
      },
    })
    await next()
  }
}

function defaultGetSessionKey(ctx: Context) {
  const fromId = ctx.from?.id
  const chatId = ctx.chat?.id
  if (fromId == null || chatId == null) {
    return undefined
  }
  return `${fromId}:${chatId}`
}
