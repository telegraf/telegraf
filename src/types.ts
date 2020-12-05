/** @format */

import Context from './context'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Middleware {
  /*
    next's parameter is in a contravariant position, and thus, trying to type it
    prevents assigning `MiddlewareFn<ContextMessageUpdate>`
    to `MiddlewareFn<CustomContext>`.
    Middleware passing the parameter should be a separate type instead.
  */
  export type Fn<C extends Context> = (
    ctx: C,
    next: () => Promise<void>
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ) => Promise<unknown> | void
  export interface Obj<C extends Context> {
    middleware: () => Fn<C>
  }
  export type ExtFn<B extends Context, X extends object> = <C extends B>(
    ctx: C,
    next: (ctx: C & X) => Promise<void>
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ) => Promise<unknown> | void
  export type Ext<B extends Context, X extends object> = ExtFn<B, X>
}
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Middleware<C extends Context> = Middleware.Fn<C> | Middleware.Obj<C>

export type NonemptyReadonlyArray<T> = readonly [T, ...T[]]

export type Tail<T> = T extends [unknown, ...infer U] ? U : never
