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
   * @param middleware Middleware function
   */
  use(
    middleware: Middleware<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for provided update type.
   * @param updateTypes Update type
   * @param middlewares Middleware functions
   */
  on(
    updateTypes:
      | tt.UpdateType
      | tt.UpdateType[]
      | tt.MessageSubTypes
      | tt.MessageSubTypes[],
    middleware: Middleware<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Return the middleware created by this Composer
   */
  middleware(): MiddlewareFn<TContext>

  /**
   * Registers middleware for handling text messages.
   * @param triggers Triggers
   * @param middlewares Middleware functions
   */
  hears(
    triggers: HearsTriggers,
    middleware: Middleware<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling callbackQuery data with regular expressions
   * @param triggers Triggers
   * @param middlewares Middleware functions
   */
  action(
    triggers: HearsTriggers,
    middleware: Middleware<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Command handling.
   * @param command Commands
   * @param middlewares Middleware functions
   */
  command(
    command: string | string[],
    middleware: Middleware<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling callback_data actions with game query.
   * @param middlewares Middleware functions
   */
  gameQuery(
    middleware: Middleware<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling callback_data actions on start.
   * @param middlewares Middleware functions
   */
  start(
    middleware: Middleware<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling callback_data actions on help.
   * @param middlewares Middleware functions
   */
  help(
    middleware: Middleware<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  constructor(...middlewares: ReadonlyArray<Middleware<TContext>>)

  static unwrap<TContext extends ContextMessageUpdate>(
    handler: Middleware<TContext>
  ): MiddlewareFn<TContext>

  /**
   * Compose middlewares returning a fully valid middleware comprised of all those which are passed.
   * @param middlewares ReadonlyArray of middlewares functions
   */
  static compose<TContext extends ContextMessageUpdate>(
    middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling provided update types.
   * @param updateTypes Update type
   * @param middleware Middleware function
   */
  static mount<TContext extends ContextMessageUpdate>(
    updateTypes: tt.UpdateType | tt.UpdateType[],
    ...middleware: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling text messages with regular expressions.
   * @param triggers Triggers
   * @param handler Handler
   */
  static hears<TContext extends ContextMessageUpdate>(
    triggers: HearsTriggers,
    ...handler: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling callbackQuery data with regular expressions.
   * @param triggers Triggers
   * @param handler Handler
   */
  static action<TContext extends ContextMessageUpdate>(
    triggers: HearsTriggers,
    ...handler: ReadonlyArray<Middleware<TContext>>
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
   * @param test Value or predicate (ctx) => bool
   * @param middleware Middleware function
   */
  static optional<TContext extends ContextMessageUpdate>(
    test: boolean | ((ctx: TContext) => boolean),
    ...middleware: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates filter middleware.
   * @param test  Value or predicate (ctx) => bool
   */
  static filter<TContext extends ContextMessageUpdate>(
    test: boolean | ((ctx: TContext) => boolean)
  ): MiddlewareFn<TContext>

  /**
   * Generates branch middleware.
   * @param test Value or predicate (ctx) => bool
   * @param trueMiddleware true action middleware
   * @param falseMiddleware false action middleware
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
   * Allows it to console.log each request received.
   */
  static fork<TContext extends ContextMessageUpdate>(
    middleware: Middleware<TContext>
  ): MiddlewareFn<TContext>

  static log(logFn?: (s: string) => void): MiddlewareFn<ContextMessageUpdate>

  /**
   * Generates middleware which passes through when the requested chat type is not in the request.
   * @param Chat Type to trigger the given middleware. Other types will pass through
   * @param middleware Middleware function
   */
  static chatType<TContext extends ContextMessageUpdate>(
    type: tt.ChatType | tt.ChatType[],
    ...middleware: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware which passes through when the requested chat type is not a private chat.
   * @param middleware Middleware function
   */
  static privateChat<TContext extends ContextMessageUpdate>(
    ...middleware: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware which passes through when the requested chat type is not a group.
   * @param middleware Middleware function
   */
  static groupChat<TContext extends ContextMessageUpdate>(
    ...middleware: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>
}
