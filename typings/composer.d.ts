import * as tt from './telegram-types.d'
import { ContextMessageUpdate } from './context'

type HearsTriggers = string[] | string | RegExp | RegExp[] | Function

export interface MiddlewareFn<TContext extends ContextMessageUpdate> {
  (ctx: TContext, next: (ctx?: TContext) => Promise<void>): void
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
    middleware: MiddlewareFn<TContext>,
    ...middlewares: Array<MiddlewareFn<TContext>>
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
    middleware: MiddlewareFn<TContext>,
    ...middlewares: Array<MiddlewareFn<TContext>>
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
    middleware: MiddlewareFn<TContext>,
    ...middlewares: Array<MiddlewareFn<TContext>>
  ): this

  /**
   * Registers middleware for handling callbackQuery data with regular expressions
   * @param triggers Triggers
   * @param middlewares Middleware functions
   */
  action(
    triggers: HearsTriggers,
    middleware: MiddlewareFn<TContext>,
    ...middlewares: Array<MiddlewareFn<TContext>>
  ): this

  /**
   * Command handling.
   * @param command Commands
   * @param middlewares Middleware functions
   */
  command(
    command: string | string[],
    middleware: MiddlewareFn<TContext>,
    ...middlewares: Array<MiddlewareFn<TContext>>
  ): this

  /**
   * Registers middleware for handling callback_data actions with game query.
   * @param middlewares Middleware functions
   */
  gameQuery(
    middleware: MiddlewareFn<TContext>,
    ...middlewares: Array<MiddlewareFn<TContext>>
  ): this

  /**
   * Registers middleware for handling callback_data actions on start.
   * @param middlewares Middleware functions
   */
  start(
    middleware: MiddlewareFn<TContext>,
    ...middlewares: Array<MiddlewareFn<TContext>>
  ): this

  /**
   * Registers middleware for handling callback_data actions on help.
   * @param middlewares Middleware functions
   */
  help(
    middleware: MiddlewareFn<TContext>,
    ...middlewares: Array<MiddlewareFn<TContext>>
  ): this

  constructor(...middlewares: Array<MiddlewareFn<TContext>>)

  /**
   * Compose middlewares returning a fully valid middleware comprised of all those which are passed.
   * @param middlewares Array of middlewares functions
   */
  static compose<TContext extends ContextMessageUpdate>(
    middlewares: Array<MiddlewareFn<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling provided update types.
   * @param updateTypes Update type
   * @param middleware Middleware function
   */
  static mount<
    TContext extends ContextMessageUpdate,
    UContext extends ContextMessageUpdate
  >(
    updateTypes: tt.UpdateType | tt.UpdateType[],
    ...middleware: Array<MiddlewareFn<TContext>>
  ): MiddlewareFn<UContext>

  /**
   * Generates middleware for handling text messages with regular expressions.
   * @param triggers Triggers
   * @param handler Handler
   */
  static hears<
    TContext extends ContextMessageUpdate,
    UContext extends ContextMessageUpdate
  >(
    triggers: HearsTriggers,
    ...handler: Array<MiddlewareFn<TContext>>
  ): MiddlewareFn<UContext>

  /**
   * Generates middleware for handling callbackQuery data with regular expressions.
   * @param triggers Triggers
   * @param handler Handler
   */
  static action<
    TContext extends ContextMessageUpdate,
    UContext extends ContextMessageUpdate
  >(
    triggers: HearsTriggers,
    ...handler: Array<MiddlewareFn<TContext>>
  ): MiddlewareFn<UContext>

  /**
   * Generates pass thru middleware.
   */
  static passThru<TContext extends ContextMessageUpdate>(): MiddlewareFn<
    TContext
  >

  /**
   * Generates safe version of pass thru middleware.
   */
  static safePassThru<TContext extends ContextMessageUpdate>(): MiddlewareFn<
    TContext
  >

  /**
   * Generates optional middleware.
   * @param test Value or predicate (ctx) => bool
   * @param middleware Middleware function
   */
  static optional<
    TContext extends ContextMessageUpdate,
    UContext extends ContextMessageUpdate
  >(
    test: boolean | ((ctx: TContext) => boolean),
    ...middleware: Array<MiddlewareFn<TContext>>
  ): MiddlewareFn<UContext>

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
  static branch<
    TContext extends ContextMessageUpdate,
    UContext extends ContextMessageUpdate,
    VContext extends ContextMessageUpdate,
    WContext extends ContextMessageUpdate
  >(
    test: boolean | ((ctx: TContext) => boolean),
    trueMiddleware: MiddlewareFn<UContext>,
    falseMiddleware: MiddlewareFn<VContext>
  ): MiddlewareFn<WContext>

  static reply<TContext extends ContextMessageUpdate>(
    text: string,
    extra?: tt.ExtraReplyMessage
  ): MiddlewareFn<TContext>

  /**
   * Allows it to console.log each request received.
   */
  static fork<TContext extends ContextMessageUpdate>(
    middleware: MiddlewareFn<TContext>
  ): Function

  static log(logFn?: Function): MiddlewareFn<ContextMessageUpdate>

  /**
   * Generates middleware which passes through when the requested chat type is not in the request.
   * @param Chat Type to trigger the given middleware. Other types will pass through
   * @param middleware Middleware function
   */
  static chatType<
    TContext extends ContextMessageUpdate,
    UContext extends ContextMessageUpdate
  >(
    type: tt.ChatType | tt.ChatType[],
    ...middleware: Array<MiddlewareFn<TContext>>
  ): MiddlewareFn<UContext>

  /**
   * Generates middleware which passes through when the requested chat type is not a private chat.
   * @param middleware Middleware function
   */
  static privateChat<
    TContext extends ContextMessageUpdate,
    UContext extends ContextMessageUpdate
  >(...middleware: Array<MiddlewareFn<TContext>>): MiddlewareFn<UContext>

  /**
   * Generates middleware which passes through when the requested chat type is not a group.
   * @param middleware Middleware function
   */
  static groupChat<
    TContext extends ContextMessageUpdate,
    UContext extends ContextMessageUpdate
  >(...middleware: Array<MiddlewareFn<TContext>>): MiddlewareFn<UContext>
}
