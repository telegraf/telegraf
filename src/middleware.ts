/*
  next's parameter is in a contravariant position, and thus, trying to type it
  prevents assigning `MiddlewareFn<ContextMessageUpdate>`
  to `MiddlewareFn<CustomContext>`.
  Middleware passing the parameter should be a separate type instead.
*/
export type MiddlewareFn<C> = (
  ctx: C,
  next: () => Promise<void>
) => Promise<unknown> | void

export interface MiddlewareObj<C> {
  middleware: () => MiddlewareFn<C>
}

export type Middleware<C> = MiddlewareFn<C> | MiddlewareObj<C>
