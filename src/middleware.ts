import { Context } from './context.ts'
import { Any, MaybePromise } from './util.ts'

/*
  next's parameter is in a contravariant position, and thus, trying to type it
  prevents assigning `MiddlewareFn<ContextMessageUpdate>`
  to `MiddlewareFn<CustomContext>`.
  Middleware passing the parameter should be a separate type instead.
*/
export type MiddlewareFn<C extends Context> = (
  ctx: C,
  next: () => Promise<void>
) => MaybePromise<Any>

export interface MiddlewareObj<C extends Context> {
  middleware: () => MiddlewareFn<C>
}

export type Middleware<C extends Context> = MiddlewareFn<C> | MiddlewareObj<C>
