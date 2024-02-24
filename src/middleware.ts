import { Context } from './context'
import { Update } from './core/types/typegram'

/*
  next's parameter is in a contravariant position, and thus, trying to type it
  prevents assigning `MiddlewareFn<ContextMessageUpdate>`
  to `MiddlewareFn<CustomContext>`.
  Middleware passing the parameter should be a separate type instead.
*/
export type MiddlewareFn<C extends Context<U>, U extends Update = Update> = (
  ctx: C,
  next: () => Promise<void>
) => Promise<unknown> | void

export interface MiddlewareObj<
  C extends Context<U>,
  U extends Update = Update,
> {
  middleware: () => MiddlewareFn<C, U>
}

export type Middleware<C extends Context<U>, U extends Update = Update> =
  | MiddlewareFn<C, U>
  | MiddlewareObj<C, U>
