/** @format */

import * as tt from './telegram-types.d'
import { TelegrafContext } from './context'

type HearsTriggers<TContext> = string[] | string | RegExp | RegExp[] | ((value: string, ctx: TContext) => RegExpExecArray | null)
type BranchPredicate<TContext> = boolean | ((ctx: TContext) => boolean | Promise<boolean>)

export interface MiddlewareFn<TContext extends TelegrafContext> {
  /*
  next's parameter is in a contravariant position, and thus, trying to type it
  prevents assigning `MiddlewareFn<ContextMessageUpdate>`
  to `MiddlewareFn<CustomContext>`.
  Middleware passing the parameter should be a separate type instead.
  */
  (ctx: TContext, next: () => Promise<void>): void | Promise<unknown>
}

export interface MiddlewareObj<TContext extends TelegrafContext> {
  middleware(): MiddlewareFn<TContext>
}

export type Middleware<TContext extends TelegrafContext> =
  | MiddlewareFn<TContext>
  | MiddlewareObj<TContext>

export declare class Composer<TContext extends TelegrafContext>
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
    triggers: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling callbackQuery data with regular expressions
   */
  action(
    triggers: HearsTriggers<TContext>,
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

  static unwrap<TContext extends TelegrafContext>(
    middleware: Middleware<TContext>
  ): MiddlewareFn<TContext>

  /**
   * Compose middlewares returning a fully valid middleware comprised of all those which are passed.
   */
  static compose<TContext extends TelegrafContext>(
    middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling provided update types.
   */
  static mount<TContext extends TelegrafContext>(
    updateTypes: tt.UpdateType | tt.UpdateType[],
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling matching text messages.
   */
  static hears<TContext extends TelegrafContext>(
    triggers: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling matching callback queries.
   */
  static action<TContext extends TelegrafContext>(
    triggers: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates pass thru middleware.
   */
  static passThru(): MiddlewareFn<TelegrafContext>

  /**
   * Generates safe version of pass thru middleware.
   */
  static safePassThru(): MiddlewareFn<TelegrafContext>

  /**
   * Generates optional middleware.
   * @param middleware middleware to run if the predicate returns true
   */
  static optional<TContext extends TelegrafContext>(
    predicate: BranchPredicate<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates filter middleware.
   */
  static filter<TContext extends TelegrafContext>(
    predicate: BranchPredicate<TContext>
  ): MiddlewareFn<TContext>

  /**
   * Generates drop middleware.
   */
  static drop<TContext extends TelegrafContext>(
    predicate: BranchPredicate<TContext>
  ): Middleware<TContext>

  /**
   * @param trueMiddleware middleware to run if the predicate returns true
   * @param falseMiddleware middleware to run if the predicate returns false
   */
  static branch<TContext extends TelegrafContext>(
    predicate: BranchPredicate<TContext>,
    trueMiddleware: Middleware<TContext>,
    falseMiddleware: Middleware<TContext>
  ): MiddlewareFn<TContext>

  static reply(
    text: string,
    extra?: tt.ExtraReplyMessage
  ): MiddlewareFn<TelegrafContext>

  /**
   * Generates middleware that runs in the background.
   */
  static fork<TContext extends TelegrafContext>(
    middleware: Middleware<TContext>
  ): MiddlewareFn<TContext>

  static log(logFn?: (s: string) => void): MiddlewareFn<TelegrafContext>

  /**
   * Generates middleware running only in given chat types.
   */
  static chatType<TContext extends TelegrafContext>(
    type: tt.ChatType | tt.ChatType[],
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware running only in private chats.
   */
  static privateChat<TContext extends TelegrafContext>(
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware running only in groups and supergroups.
   */
  static groupChat<TContext extends TelegrafContext>(
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>
}
