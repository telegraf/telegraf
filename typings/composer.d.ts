/** @format */

import * as tt from './telegram-types.d'
import { ContextMessageUpdate } from './context'

type HearsTriggers = string[] | string | RegExp | RegExp[] | Function

export interface MiddlewareFn<TContext extends ContextMessageUpdate> {
  /*
  next's parameter is in a contravariant position, and thus, trying to type it
  prevents assigning `MiddlewareFn<ContextMessageUpdate>`
  to `MiddlewareFn<CustomContext>`.
  Middleware passing the parameter should be a separate type instead.
  */
  (ctx: TContext, next: () => Promise<unknown>): unknown
}

export interface MiddlewareObj<TContext extends ContextMessageUpdate> {
  middleware(): MiddlewareFn<TContext>
}

export type Middleware<TContext extends ContextMessageUpdate> =
  | MiddlewareFn<TContext>
  | MiddlewareObj<TContext>

export declare class Composer<TContext extends ContextMessageUpdate>
  implements MiddlewareObj<TContext> {
  /**
   * Registers a middleware.
   */
  use(...middlewares: ReadonlyArray<Middleware<TContext>>): this

  /**
   * Registers middleware for provided update type.
   */
  on(
    updateTypes:
      | tt.UpdateType
      | tt.UpdateType[]
      | tt.MessageSubTypes
      | tt.MessageSubTypes[],
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Return the middleware created by this Composer
   */
  middleware(): MiddlewareFn<TContext>

  /**
   * Registers middleware for handling text messages.
   */
  hears(
    triggers: HearsTriggers,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling callbackQuery data with regular expressions
   */
  action(
    triggers: HearsTriggers,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling specified commands.
   */
  command(
    command: string | string[],
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling callback_data actions with game query.
   */
  gameQuery(...middlewares: ReadonlyArray<Middleware<TContext>>): this

  /**
   * Registers middleware for handling /start command.
   */
  start(...middlewares: ReadonlyArray<Middleware<TContext>>): this

  /**
   * Registers middleware for handling /help command.
   */
  help(...middlewares: ReadonlyArray<Middleware<TContext>>): this

  constructor(...middlewares: ReadonlyArray<Middleware<TContext>>)

  static unwrap<TContext extends ContextMessageUpdate>(
    middleware: Middleware<TContext>
  ): MiddlewareFn<TContext>

  /**
   * Compose middlewares returning a fully valid middleware comprised of all those which are passed.
   */
  static compose<TContext extends ContextMessageUpdate>(
    middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling provided update types.
   */
  static mount<TContext extends ContextMessageUpdate>(
    updateTypes: tt.UpdateType | tt.UpdateType[],
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling matching text messages.
   */
  static hears<TContext extends ContextMessageUpdate>(
    triggers: HearsTriggers,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling matching callback queries.
   */
  static action<TContext extends ContextMessageUpdate>(
    triggers: HearsTriggers,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates pass thru middleware.
   */
  static passThru(): MiddlewareFn<ContextMessageUpdate>

  /**
   * Generates safe version of pass thru middleware.
   */
  static safePassThru(): MiddlewareFn<ContextMessageUpdate>

  /**
   * Generates optional middleware.
   * @param middleware middleware to run if the predicate returns true
   */
  static optional<TContext extends ContextMessageUpdate>(
    test: boolean | ((ctx: TContext) => boolean),
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates filter middleware.
   */
  static filter<TContext extends ContextMessageUpdate>(
    test: boolean | ((ctx: TContext) => boolean)
  ): MiddlewareFn<TContext>

  /**
   * @param trueMiddleware middleware to run if the predicate returns true
   * @param falseMiddleware middleware to run if the predicate returns false
   */
  static branch<TContext extends ContextMessageUpdate>(
    test: boolean | ((ctx: TContext) => boolean),
    trueMiddleware: Middleware<TContext>,
    falseMiddleware: Middleware<TContext>
  ): MiddlewareFn<TContext>

  static reply(
    text: string,
    extra?: tt.ExtraReplyMessage
  ): MiddlewareFn<ContextMessageUpdate>

  /**
   * Generates middleware that runs in the background.
   */
  static fork<TContext extends ContextMessageUpdate>(
    middleware: Middleware<TContext>
  ): MiddlewareFn<TContext>

  static log(logFn?: (s: string) => void): MiddlewareFn<ContextMessageUpdate>

  /**
   * Generates middleware running only in given chat types.
   */
  static chatType<TContext extends ContextMessageUpdate>(
    type: tt.ChatType | tt.ChatType[],
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware running only in private chats.
   */
  static privateChat<TContext extends ContextMessageUpdate>(
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware running only in groups and supergroups.
   */
  static groupChat<TContext extends ContextMessageUpdate>(
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>
}
