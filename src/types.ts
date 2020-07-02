/** @format */

//@ts-ignore
import Context from './context'

export namespace Middleware {
  export interface Fn<TContext extends Context> {
    /*
      next's parameter is in a contravariant position, and thus, trying to type it
      prevents assigning `MiddlewareFn<ContextMessageUpdate>`
      to `MiddlewareFn<CustomContext>`.
      Middleware passing the parameter should be a separate type instead.
    */
    (ctx: TContext, next: () => Promise<void>): void | Promise<unknown>
  }
  export interface Obj<TContext extends Context> {
    middleware(): Fn<TContext>
  }
}
export type Middleware<TContext extends Context> =
  | Middleware.Fn<TContext>
  | Middleware.Obj<TContext>

export type NonemptyReadonlyArray<T> = readonly [T, ...T[]]
