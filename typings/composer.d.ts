/** @format */

import * as tt from './telegram-types.d'
import { TelegrafContext } from './context'

type MaybeArray<T> = T | T[]
type MaybePromise<T> = T | Promise<T>

type NormalizedTrigger<TContext> = (value: string, ctx: TContext) => RegExpExecArray | null
type HearsTriggers<TContext> = MaybeArray<string | RegExp | NormalizedTrigger<TContext>>

type Predicate<TContext> = (ctx: TContext) => MaybePromise<boolean>
type BranchPredicate<TContext> = boolean | Predicate<TContext>

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

  constructor(...middlewares: ReadonlyArray<Middleware<TContext>>)

  /**
   * Registers a middleware.
   */
  use(...middlewares: ReadonlyArray<Middleware<TContext>>): this

  /**
   * Registers middleware for provided update type.
   */
  on(
    updateTypes: MaybeArray<tt.UpdateType | tt.MessageSubTypes>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling text messages.
   */
  hears(
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
   * Registers middleware for handling callbackQuery data with regular expressions
   */
  action(
    triggers: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling inlineQuery data with regular expressions
   */
  inlineQuery(
    triggers: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling callback_data actions with game query.
   */
  gameQuery(...middlewares: ReadonlyArray<Middleware<TContext>>): this

  /**
   * Generates drop middleware.
   */
  drop<TContext extends TelegrafContext>(
    predicate: BranchPredicate<TContext>
  ): this

  /**
   * Generates filter middleware.
   */
  filter<TContext extends TelegrafContext>(
    predicate: BranchPredicate<TContext>
  ): this

  /**
   * Registers middleware for handling entities
   */
  entity<TContext extends TelegrafContext>(
    predicate: MaybeArray<tt.MessageEntityType> | ((entity: tt.MessageEntity, entityText: string, ctx: TContext) => MaybePromise<boolean>),
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling messages with matching emails.
   */
  email<TContext extends TelegrafContext>(
    email: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling messages with matching phones.
   */
  phone<TContext extends TelegrafContext>(
    number: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling messages with matching urls.
   */
  url<TContext extends TelegrafContext>(
    url: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling messages with matching text links.
   */
  textLink<TContext extends TelegrafContext>(
    link: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling messages with matching text mentions.
   */
  textMention<TContext extends TelegrafContext>(
    mention: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling messages with matching mentions.
   */
  mention<TContext extends TelegrafContext>(
    mention: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling messages with matching hashtags.
   */
  hashtag<TContext extends TelegrafContext>(
    hashtag: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling messages with matching cashtags.
   */
  cashtag<TContext extends TelegrafContext>(
    cashtag: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): this

  /**
   * Registers middleware for handling /start command.
   */
  start(...middlewares: ReadonlyArray<Middleware<TContext>>): this

  /**
   * Registers middleware for handling /help command.
   */
  help(...middlewares: ReadonlyArray<Middleware<TContext>>): this

  /**
   * Registers middleware for handling /ыуеештпы command.
   */
  settings(...middlewares: ReadonlyArray<Middleware<TContext>>): this

  /**
   * Return the middleware created by this Composer
   */
  middleware(): MiddlewareFn<TContext>

  static reply(
    text: string,
    extra?: tt.ExtraSendMessage
  ): MiddlewareFn<TelegrafContext>

  static catchAll<TContext extends TelegrafContext>(
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  static catch<TContext extends TelegrafContext>(
    errorHandler: (error: Error, ctx: TContext) => void,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware that runs in the background.
   */
  static fork<TContext extends TelegrafContext>(
    middleware: Middleware<TContext>
  ): MiddlewareFn<TContext>

  /**
   * Generates tap middleware.
   */
  static tap<TContext extends TelegrafContext>(
    middleware: Middleware<TContext>
  ): MiddlewareFn<TContext>

  /**
   * Generates pass thru middleware.
   */
  static passThru(): MiddlewareFn<TelegrafContext>

  /**
   * Generates safe version of pass thru middleware.
   */
  static safePassThru(): MiddlewareFn<TelegrafContext>

  static lazy<TContext extends TelegrafContext>(
    factoryFn: (ctx: TContext) => MaybePromise<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  static log(logFn?: (s: string) => void): MiddlewareFn<TelegrafContext>

  /**
   * @param predicate function that returns boolean or Promise<boolean>
   * @param trueMiddleware middleware to run if the predicate returns true
   * @param falseMiddleware middleware to run if the predicate returns false
   */
  static branch<TContext extends TelegrafContext>(
    predicate: BranchPredicate<TContext>,
    trueMiddleware: Middleware<TContext>,
    falseMiddleware: Middleware<TContext>
  ): MiddlewareFn<TContext>

  /**
   * Generates optional middleware.
   * @param predicate function that returns boolean or Promise<boolean>
   * @param middlewares middleware to run if the predicate returns true
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

  static dispatch<
    C extends TelegrafContext,
    Handlers extends Record<string | number | symbol, Middleware<C>>
    >(
    routeFn: (ctx: C) => MaybePromise<keyof Handlers>,
    handlers: Handlers
  ): Middleware<C>

  /**
   * Generates middleware for handling provided update types.
   */
  static mount<TContext extends TelegrafContext>(
    updateType: tt.UpdateType | tt.UpdateType[],
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  static entity<TContext extends TelegrafContext>(
    predicate: MaybeArray<tt.MessageEntityType> | ((entity: tt.MessageEntity, entityText: string, ctx: TContext) => MaybePromise<boolean>),
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  static entityText<TContext extends TelegrafContext>(
    entityType: tt.MessageEntityType,
    triggers: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling messages with matching emails.
   */
  static email<TContext extends TelegrafContext>(
    email: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling messages with matching phones.
   */
  static phone<TContext extends TelegrafContext>(
    number: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling messages with matching urls.
   */
  static url<TContext extends TelegrafContext>(
    url: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling messages with matching text links.
   */
  static textLink<TContext extends TelegrafContext>(
    link: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling messages with matching text mentions.
   */
  static textMention<TContext extends TelegrafContext>(
    mention: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling messages with matching mentions.
   */
  static mention<TContext extends TelegrafContext>(
    mention: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling messages with matching hashtags.
   */
  static hashtag<TContext extends TelegrafContext>(
    hashtag: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling messages with matching cashtags.
   */
  static cashtag<TContext extends TelegrafContext>(
    cashtag: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  static match<TContext extends TelegrafContext>(
    triggers: NormalizedTrigger<TContext>[],
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
   * Generates middleware for handling messages with matching commands.
   */
  static command<TContext extends TelegrafContext>(
    command: string | string[],
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  /**
   * Generates middleware for handling messages with commands.
   */
  static command<TContext extends TelegrafContext>(
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
   * Generates middleware for handling matching inline queries.
   */
  static inlineQuery<TContext extends TelegrafContext>(
    triggers: HearsTriggers<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  static acl<TContext extends TelegrafContext>(
    status: number | number[] | BranchPredicate<TContext>,
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  static memberStatus<TContext extends TelegrafContext>(
    status: tt.ChatMemberStatus | tt.ChatMemberStatus[],
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  static admin<TContext extends TelegrafContext>(
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  static creator<TContext extends TelegrafContext>(
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

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

  static gameQuery<TContext extends TelegrafContext>(
    ...middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>

  static unwrap<TContext extends TelegrafContext>(
    middleware: Middleware<TContext>
  ): MiddlewareFn<TContext>

  /**
   * Compose middlewares returning a fully valid middleware comprised of all those which are passed.
   */
  static compose<TContext extends TelegrafContext>(
    middlewares: ReadonlyArray<Middleware<TContext>>
  ): MiddlewareFn<TContext>
}
