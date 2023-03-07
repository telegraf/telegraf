/** @format */

import * as tg from './core/types/typegram'
import * as tt from './telegram-types'
import { Middleware, MiddlewareFn, MiddlewareObj } from './middleware'
import Context, { FilteredContext, NarrowedContext } from './context'
import { MaybeArray, NonemptyReadonlyArray, MaybePromise, Guard } from './util'
import { type CallbackQuery } from './core/types/typegram'
import { message, callbackQuery } from './filters'

export type Triggers<C> = MaybeArray<
  string | RegExp | ((value: string, ctx: C) => RegExpExecArray | null)
>
export type Predicate<T> = (t: T) => boolean
export type AsyncPredicate<T> = (t: T) => Promise<boolean>

export type MatchedMiddleware<
  C extends Context,
  T extends tt.UpdateType | tt.MessageSubType = 'message' | 'channel_post'
> = NonemptyReadonlyArray<
  Middleware<NarrowedContext<C & { match: RegExpExecArray }, tt.MountMap[T]>>
>

/** Takes: a context type and an update type (or message subtype).
    Produces: a context that has some properties required, and some undefined.
    The required ones are those that are always present when the given update (or message) arrives.
    The undefined ones are those that are always absent when the given update (or message) arrives. */
/** @deprecated */
type MatchedContext<
  C extends Context,
  T extends tt.UpdateType | tt.MessageSubType
> = NarrowedContext<C, tt.MountMap[T]>

function always<T>(x: T) {
  return () => x
}
const anoop = always(Promise.resolve())

export class Composer<C extends Context> implements MiddlewareObj<C> {
  private handler: MiddlewareFn<C>

  constructor(...fns: ReadonlyArray<Middleware<C>>) {
    this.handler = Composer.compose(fns)
  }

  /**
   * Registers a middleware.
   */
  use(...fns: ReadonlyArray<Middleware<C>>) {
    this.handler = Composer.compose([this.handler, ...fns])
    return this
  }

  /**
   * Registers middleware for handling updates
   * matching given type guard function.
   * @deprecated use `Composer::on`
   */
  guard<U extends tg.Update>(
    guardFn: (update: tg.Update) => update is U,
    ...fns: NonemptyReadonlyArray<Middleware<NarrowedContext<C, U>>>
  ) {
    return this.use(Composer.guard<C, U>(guardFn, ...fns))
  }

  /**
   * Registers middleware for handling updates narrowed by update types or filter queries.
   */
  on<Filter extends tt.UpdateType | Guard<C['update']>>(
    filters: MaybeArray<Filter>,
    ...fns: NonemptyReadonlyArray<Middleware<FilteredContext<C, Filter>>>
  ): this

  /**
   * Registers middleware for handling updates narrowed by update types or message subtypes.
   * @deprecated Use filter utils instead. Support for Message subtype in `Composer::on` will be removed in Telegraf v5.
   */
  on<Filter extends tt.UpdateType | tt.MessageSubType>(
    filters: MaybeArray<Filter>,
    ...fns: NonemptyReadonlyArray<
      Middleware<NarrowedContext<C, tt.MountMap[Filter]>>
    >
  ): this

  on<Filter extends tt.UpdateType | tt.MessageSubType | Guard<C['update']>>(
    filters: MaybeArray<Filter>,
    ...fns: NonemptyReadonlyArray<
      Middleware<
        Filter extends tt.MessageSubType
          ? MatchedContext<C, Filter>
          : Filter extends tt.UpdateType | Guard<C['update']>
          ? FilteredContext<C, Filter>
          : never
      >
    >
  ): this {
    // @ts-expect-error This should get resolved when the overloads are removed in v5
    return this.use(Composer.on(filters, ...fns))
  }

  /**
   * Registers middleware for handling matching text messages.
   */
  hears(triggers: Triggers<C>, ...fns: MatchedMiddleware<C, 'text'>) {
    return this.use(Composer.hears<C>(triggers, ...fns))
  }

  /**
   * Registers middleware for handling specified commands.
   */
  command(
    command: Triggers<C>,
    ...fns: NonemptyReadonlyArray<
      Middleware<NarrowedContext<C, tt.MountMap['text']>>
    >
  ) {
    return this.use(Composer.command<C>(command, ...fns))
  }

  /**
   * Registers middleware for handling matching callback queries.
   */
  action(
    triggers: Triggers<C>,
    ...fns: MatchedMiddleware<C, 'callback_query'>
  ) {
    return this.use(Composer.action<C>(triggers, ...fns))
  }

  /**
   * Registers middleware for handling matching inline queries.
   */
  inlineQuery(
    triggers: Triggers<C>,
    ...fns: MatchedMiddleware<C, 'inline_query'>
  ) {
    return this.use(Composer.inlineQuery<C>(triggers, ...fns))
  }

  /**
   * Registers middleware for handling game queries
   */
  gameQuery(
    ...fns: NonemptyReadonlyArray<
      Middleware<
        NarrowedContext<
          C,
          tg.Update.CallbackQueryUpdate<CallbackQuery.GameQuery>
        >
      >
    >
  ) {
    return this.use(Composer.gameQuery(...fns))
  }

  /**
   * Registers middleware for dropping matching updates.
   */
  drop(predicate: Predicate<C>) {
    return this.use(Composer.drop(predicate))
  }

  /** @deprecated use `Composer::drop` */
  filter(predicate: Predicate<C>) {
    return this.use(Composer.filter(predicate))
  }

  private entity<
    T extends 'message' | 'channel_post' | tt.MessageSubType =
      | 'message'
      | 'channel_post'
  >(
    predicate:
      | MaybeArray<string>
      | ((entity: tg.MessageEntity, s: string, ctx: C) => boolean),
    ...fns: ReadonlyArray<Middleware<NarrowedContext<C, tt.MountMap[T]>>>
  ) {
    return this.use(Composer.entity<C, T>(predicate, ...fns))
  }

  email(email: Triggers<C>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.email<C>(email, ...fns))
  }

  url(url: Triggers<C>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.url<C>(url, ...fns))
  }

  textLink(link: Triggers<C>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.textLink<C>(link, ...fns))
  }

  textMention(mention: Triggers<C>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.textMention<C>(mention, ...fns))
  }

  mention(mention: MaybeArray<string>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.mention<C>(mention, ...fns))
  }

  phone(number: Triggers<C>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.phone<C>(number, ...fns))
  }

  hashtag(hashtag: MaybeArray<string>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.hashtag<C>(hashtag, ...fns))
  }

  cashtag(cashtag: MaybeArray<string>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.cashtag<C>(cashtag, ...fns))
  }

  spoiler(text: Triggers<C>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.spoiler<C>(text, ...fns))
  }

  /**
   * Registers a middleware for handling /start
   */
  start(
    ...fns: NonemptyReadonlyArray<
      Middleware<
        NarrowedContext<C, tt.MountMap['text']> & { startPayload: string }
      >
    >
  ) {
    const handler = Composer.compose(fns)
    return this.command('start', (ctx, next) => {
      // First entity is the /start bot_command itself
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const entity = ctx.message.entities![0]!
      const startPayload = ctx.message.text.slice(entity.length + 1)
      return handler(Object.assign(ctx, { startPayload }), next)
    })
  }

  /**
   * Registers a middleware for handling /help
   */
  help(
    ...fns: NonemptyReadonlyArray<
      Middleware<NarrowedContext<C, tt.MountMap['text']>>
    >
  ) {
    return this.command('help', ...fns)
  }

  /**
   * Registers a middleware for handling /settings
   */
  settings(
    ...fns: NonemptyReadonlyArray<
      Middleware<NarrowedContext<C, tt.MountMap['text']>>
    >
  ) {
    return this.command('settings', ...fns)
  }

  middleware() {
    return this.handler
  }

  static reply(...args: Parameters<Context['reply']>): MiddlewareFn<Context> {
    return (ctx) => ctx.reply(...args)
  }

  static catch<C extends Context>(
    errorHandler: (err: unknown, ctx: C) => void,
    ...fns: ReadonlyArray<Middleware<C>>
  ): MiddlewareFn<C> {
    const handler = Composer.compose(fns)
    // prettier-ignore
    return (ctx, next) => Promise.resolve(handler(ctx, next))
      .catch((err) => errorHandler(err, ctx))
  }

  /**
   * Generates middleware that runs in the background.
   */
  static fork<C extends Context>(middleware: Middleware<C>): MiddlewareFn<C> {
    const handler = Composer.unwrap(middleware)
    return async (ctx, next) => {
      await Promise.all([handler(ctx, anoop), next()])
    }
  }

  static tap<C extends Context>(middleware: Middleware<C>): MiddlewareFn<C> {
    const handler = Composer.unwrap(middleware)
    return (ctx, next) =>
      Promise.resolve(handler(ctx, anoop)).then(() => next())
  }

  /**
   * Generates middleware that gives up control to the next middleware.
   */
  static passThru(): MiddlewareFn<Context> {
    return (ctx, next) => next()
  }

  static lazy<C extends Context>(
    factoryFn: (ctx: C) => MaybePromise<Middleware<C>>
  ): MiddlewareFn<C> {
    if (typeof factoryFn !== 'function') {
      throw new Error('Argument must be a function')
    }
    return (ctx, next) =>
      Promise.resolve(factoryFn(ctx)).then((middleware) =>
        Composer.unwrap(middleware)(ctx, next)
      )
  }

  static log(logFn: (s: string) => void = console.log): MiddlewareFn<Context> {
    return (ctx, next) => {
      logFn(JSON.stringify(ctx.update, null, 2))
      return next()
    }
  }

  /**
   * @param trueMiddleware middleware to run if the predicate returns true
   * @param falseMiddleware middleware to run if the predicate returns false
   */
  static branch<C extends Context>(
    predicate: Predicate<C> | AsyncPredicate<C>,
    trueMiddleware: Middleware<C>,
    falseMiddleware: Middleware<C>
  ): MiddlewareFn<C> {
    if (typeof predicate !== 'function') {
      return Composer.unwrap(predicate ? trueMiddleware : falseMiddleware)
    }
    return Composer.lazy<C>((ctx) =>
      Promise.resolve(predicate(ctx)).then((value) =>
        value ? trueMiddleware : falseMiddleware
      )
    )
  }

  /**
   * Generates optional middleware.
   * @param predicate predicate to decide on a context object whether to run the middleware
   * @param middleware middleware to run if the predicate returns true
   */
  static optional<C extends Context>(
    predicate: Predicate<C> | AsyncPredicate<C>,
    ...fns: NonemptyReadonlyArray<Middleware<C>>
  ): MiddlewareFn<C> {
    return Composer.branch(
      predicate,
      Composer.compose(fns),
      Composer.passThru()
    )
  }

  /** @deprecated use `Composer.drop` */
  static filter<C extends Context>(predicate: Predicate<C>): MiddlewareFn<C> {
    return Composer.branch(predicate, Composer.passThru(), anoop)
  }

  /**
   * Generates middleware for dropping matching updates.
   */
  static drop<C extends Context>(predicate: Predicate<C>): MiddlewareFn<C> {
    return Composer.branch(predicate, anoop, Composer.passThru())
  }

  static dispatch<
    C extends Context,
    Handlers extends Record<string | number | symbol, Middleware<C>>
  >(
    routeFn: (ctx: C) => MaybePromise<keyof Handlers>,
    handlers: Handlers
  ): Middleware<C> {
    return Composer.lazy<C>((ctx) =>
      Promise.resolve(routeFn(ctx)).then((value) => handlers[value])
    )
  }

  // EXPLANATION FOR THE ts-expect-error ANNOTATIONS

  // The annotations around function invocations with `...fns` are there
  // whenever we perform validation logic that the flow analysis of TypeScript
  // cannot comprehend. We always make sure that the middleware functions are
  // only invoked with properly constrained context objects, but this cannot be
  // determined automatically.

  /**
   * Generates optional middleware based on a predicate that only operates on `ctx.update`.
   *
   * Example:
   * ```ts
   * import { Composer, Update } from 'telegraf'
   *
   * const predicate = (u): u is Update.MessageUpdate => 'message' in u
   * const middleware = Composer.guard(predicate, (ctx) => {
   *   const message = ctx.update.message
   * })
   * ```
   *
   * Note that `Composer.on('message')` is preferred over this.
   *
   * @param guardFn predicate to decide whether to run the middleware based on the `ctx.update` object
   * @param fns middleware to run if the predicate returns true
   * @see `Composer.optional` for a more generic version of this method that allows the predicate to operate on `ctx` itself
   * @deprecated use `Composer.on`
   */
  static guard<C extends Context, U extends tg.Update>(
    guardFn: (u: tg.Update) => u is U,
    ...fns: NonemptyReadonlyArray<Middleware<NarrowedContext<C, U>>>
  ): MiddlewareFn<C> {
    return Composer.optional<C>(
      (ctx) => guardFn(ctx.update),
      // @ts-expect-error see explanation above
      ...fns
    )
  }

  /**
   * Generates middleware for handling updates narrowed by update types or filter queries.
   */
  static on<
    Ctx extends Context,
    Filter extends tt.UpdateType | Guard<Ctx['update']>
  >(
    filters: MaybeArray<Filter>,
    ...fns: NonemptyReadonlyArray<Middleware<FilteredContext<Ctx, Filter>>>
  ): MiddlewareFn<Ctx>

  /**
   * Generates middleware for handling updates narrowed by update types or message subtype.
   * @deprecated Use filter utils instead. Support for Message subtype in `Composer.on` will be removed in Telegraf v5.
   */
  static on<
    Ctx extends Context,
    Filter extends tt.UpdateType | tt.MessageSubType
  >(
    filters: MaybeArray<Filter>,
    ...fns: NonemptyReadonlyArray<
      Middleware<NarrowedContext<Ctx, tt.MountMap[Filter]>>
    >
  ): MiddlewareFn<Ctx>

  static on<
    Ctx extends Context,
    Filter extends tt.UpdateType | tt.MessageSubType | Guard<Ctx['update']>
  >(
    updateType: MaybeArray<Filter>,
    ...fns: NonemptyReadonlyArray<Middleware<Ctx>>
  ): MiddlewareFn<Ctx> {
    const filters = Array.isArray(updateType) ? updateType : [updateType]

    const predicate = (update: tg.Update): update is tg.Update => {
      for (const filter of filters) {
        if (
          // TODO: this should change to === 'function' once TS bug is fixed
          // https://github.com/microsoft/TypeScript/pull/51502
          typeof filter !== 'string'
            ? // filter is a type guard
              filter(update)
            : // check if filter is the update type
              filter in update ||
              // check if filter is the msg type
              // TODO: remove in v5!
              ('message' in update && filter in update.message)
        ) {
          return true
        }
      }

      return false
    }

    return Composer.optional((ctx) => predicate(ctx.update), ...fns)
  }

  /**
   * Generates middleware for handling provided update types.
   * @deprecated use `Composer.on` instead
   */
  static mount = Composer.on

  private static entity<
    C extends Context,
    T extends 'message' | 'channel_post' | tt.MessageSubType =
      | 'message'
      | 'channel_post'
  >(
    predicate:
      | MaybeArray<string>
      | ((entity: tg.MessageEntity, s: string, ctx: C) => boolean),
    ...fns: ReadonlyArray<Middleware<NarrowedContext<C, tt.MountMap[T]>>>
  ): MiddlewareFn<C> {
    if (typeof predicate !== 'function') {
      const entityTypes = normalizeTextArguments(predicate)
      return Composer.entity(({ type }) => entityTypes.includes(type), ...fns)
    }
    return Composer.optional<C>((ctx) => {
      const msg: tg.Message | undefined = ctx.message ?? ctx.channelPost
      if (msg === undefined) {
        return false
      }
      const text = getText(msg)
      const entities = getEntities(msg)
      if (text === undefined) return false
      return entities.some((entity) =>
        predicate(
          entity,
          text.substring(entity.offset, entity.offset + entity.length),
          ctx
        )
      )
      // @ts-expect-error see explanation above
    }, ...fns)
  }

  static entityText<C extends Context>(
    entityType: MaybeArray<string>,
    predicate: Triggers<C>,
    ...fns: MatchedMiddleware<C>
  ): MiddlewareFn<C> {
    if (fns.length === 0) {
      // prettier-ignore
      return Array.isArray(predicate)
        // @ts-expect-error predicate is really the middleware
        ? Composer.entity(entityType, ...predicate)
        // @ts-expect-error predicate is really the middleware
        : Composer.entity(entityType, predicate)
    }
    const triggers = normalizeTriggers(predicate)
    return Composer.entity<C>(({ type }, value, ctx) => {
      if (type !== entityType) {
        return false
      }
      for (const trigger of triggers) {
        // @ts-expect-error define so far unknown property `match`
        if ((ctx.match = trigger(value, ctx))) {
          return true
        }
      }
      return false
      // @ts-expect-error see explanation above
    }, ...fns)
  }

  static email<C extends Context>(
    email: Triggers<C>,
    ...fns: MatchedMiddleware<C>
  ): MiddlewareFn<C> {
    return Composer.entityText<C>('email', email, ...fns)
  }

  static phone<C extends Context>(
    number: Triggers<C>,
    ...fns: MatchedMiddleware<C>
  ): MiddlewareFn<C> {
    return Composer.entityText<C>('phone_number', number, ...fns)
  }

  static url<C extends Context>(
    url: Triggers<C>,
    ...fns: MatchedMiddleware<C>
  ): MiddlewareFn<C> {
    return Composer.entityText<C>('url', url, ...fns)
  }

  static textLink<C extends Context>(
    link: Triggers<C>,
    ...fns: MatchedMiddleware<C>
  ): MiddlewareFn<C> {
    return Composer.entityText<C>('text_link', link, ...fns)
  }

  static textMention<C extends Context>(
    mention: Triggers<C>,
    ...fns: MatchedMiddleware<C>
  ): MiddlewareFn<C> {
    return Composer.entityText<C>('text_mention', mention, ...fns)
  }

  static mention<C extends Context>(
    mention: MaybeArray<string>,
    ...fns: MatchedMiddleware<C>
  ): MiddlewareFn<C> {
    return Composer.entityText<C>(
      'mention',
      normalizeTextArguments(mention, '@'),
      ...fns
    )
  }

  static hashtag<C extends Context>(
    hashtag: MaybeArray<string>,
    ...fns: MatchedMiddleware<C>
  ): MiddlewareFn<C> {
    return Composer.entityText<C>(
      'hashtag',
      normalizeTextArguments(hashtag, '#'),
      ...fns
    )
  }

  static cashtag<C extends Context>(
    cashtag: MaybeArray<string>,
    ...fns: MatchedMiddleware<C>
  ): MiddlewareFn<C> {
    return Composer.entityText<C>(
      'cashtag',
      normalizeTextArguments(cashtag, '$'),
      ...fns
    )
  }

  static spoiler<C extends Context>(
    text: Triggers<C>,
    ...fns: MatchedMiddleware<C>
  ): MiddlewareFn<C> {
    return Composer.entityText<C>('spoiler', text, ...fns)
  }

  private static match<
    C extends Context,
    T extends
      | 'message'
      | 'channel_post'
      | 'callback_query'
      | 'inline_query'
      | tt.MessageSubType
  >(
    triggers: ReadonlyArray<(text: string, ctx: C) => RegExpExecArray | null>,
    ...fns: MatchedMiddleware<C, T>
  ): MiddlewareFn<NarrowedContext<C, tt.MountMap[T]>> {
    const handler = Composer.compose(fns)
    return (ctx, next) => {
      const text =
        getText(ctx.message) ??
        getText(ctx.channelPost) ??
        getText(ctx.callbackQuery) ??
        ctx.inlineQuery?.query
      if (text === undefined) return next()
      for (const trigger of triggers) {
        // @ts-expect-error Trust me, TS!
        const match = trigger(text, ctx)
        if (match) {
          // @ts-expect-error define so far unknown property `match`
          return handler(Object.assign(ctx, { match }), next)
        }
      }
      return next()
    }
  }

  /**
   * Generates middleware for handling matching text messages.
   */
  static hears<C extends Context>(
    triggers: Triggers<C>,
    ...fns: MatchedMiddleware<C, 'text'>
  ): MiddlewareFn<C> {
    return Composer.on(
      'text',
      Composer.match<C, 'text'>(normalizeTriggers(triggers), ...fns)
    )
  }

  /**
   * Generates middleware for handling specified commands.
   */
  static command<C extends Context>(
    command: Triggers<C>,
    ...fns: NonemptyReadonlyArray<
      Middleware<NarrowedContext<C, tt.MountMap['text']>>
    >
  ): MiddlewareFn<C> {
    if (fns.length === 0)
      // @ts-expect-error command is really the middleware
      return Composer.entity('bot_command', command)

    const triggers = normalizeTriggers<C>(command)
    const filter = message('text')

    return Composer.on<C, typeof filter>(filter, (ctx, next) => {
      const first = ctx.message.entities?.[0]
      if (first?.type !== 'bot_command') return next()
      if (first.offset > 0) return next()
      const [cmdPart, to] = ctx.message.text.slice(0, first.length).split('@')
      if (!cmdPart) return next()
      // always check for bot's own username case-insensitively
      if (to && to.toLowerCase() !== ctx.me.toLowerCase()) return next()
      const cmd = cmdPart.slice(1)
      for (const trigger of triggers)
        if (trigger(cmd, ctx as C)) return Composer.compose(fns)(ctx, next)
      return next()
    })
  }

  /**
   * Generates middleware for handling matching callback queries.
   */
  static action<C extends Context>(
    triggers: Triggers<C>,
    ...fns: MatchedMiddleware<C, 'callback_query'>
  ): MiddlewareFn<C> {
    return Composer.on(
      'callback_query',
      Composer.match<C, 'callback_query'>(normalizeTriggers(triggers), ...fns)
    )
  }

  /**
   * Generates middleware for handling matching inline queries.
   */
  static inlineQuery<C extends Context>(
    triggers: Triggers<C>,
    ...fns: MatchedMiddleware<C, 'inline_query'>
  ): MiddlewareFn<C> {
    return Composer.on(
      'inline_query',
      Composer.match<C, 'inline_query'>(normalizeTriggers(triggers), ...fns)
    )
  }

  /**
   * Generates middleware responding only to specified users.
   */
  static acl<C extends Context>(
    userId: MaybeArray<number>,
    ...fns: NonemptyReadonlyArray<Middleware<C>>
  ): MiddlewareFn<C> {
    if (typeof userId === 'function') {
      return Composer.optional(userId, ...fns)
    }
    const allowed = Array.isArray(userId) ? userId : [userId]
    // prettier-ignore
    return Composer.optional((ctx) => !ctx.from || allowed.includes(ctx.from.id), ...fns)
  }

  private static memberStatus<C extends Context>(
    status: MaybeArray<tg.ChatMember['status']>,
    ...fns: NonemptyReadonlyArray<Middleware<C>>
  ): MiddlewareFn<C> {
    const statuses = Array.isArray(status) ? status : [status]
    return Composer.optional(async (ctx) => {
      if (ctx.message === undefined) return false
      const member = await ctx.getChatMember(ctx.message.from.id)
      return statuses.includes(member.status)
    }, ...fns)
  }

  /**
   * Generates middleware responding only to chat admins and chat creator.
   */
  static admin<C extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<C>>
  ): MiddlewareFn<C> {
    return Composer.memberStatus(['administrator', 'creator'], ...fns)
  }

  /**
   * Generates middleware responding only to chat creator.
   */
  static creator<C extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<C>>
  ): MiddlewareFn<C> {
    return Composer.memberStatus('creator', ...fns)
  }

  /**
   * Generates middleware running only in specified chat types.
   */
  static chatType<C extends Context>(
    type: MaybeArray<tg.Chat['type']>,
    ...fns: NonemptyReadonlyArray<Middleware<C>>
  ): MiddlewareFn<C> {
    const types = Array.isArray(type) ? type : [type]
    return Composer.optional((ctx) => {
      const chat = ctx.chat
      return chat !== undefined && types.includes(chat.type)
    }, ...fns)
  }

  /**
   * Generates middleware running only in private chats.
   */
  static privateChat<C extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<C>>
  ): MiddlewareFn<C> {
    return Composer.chatType('private', ...fns)
  }

  /**
   * Generates middleware running only in groups and supergroups.
   */
  static groupChat<C extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<C>>
  ): MiddlewareFn<C> {
    return Composer.chatType(['group', 'supergroup'], ...fns)
  }

  /**
   * Generates middleware for handling game queries.
   */
  static gameQuery<C extends Context>(
    ...fns: NonemptyReadonlyArray<
      Middleware<
        NarrowedContext<
          C,
          tg.Update.CallbackQueryUpdate<CallbackQuery.GameQuery>
        >
      >
    >
  ): MiddlewareFn<C> {
    return Composer.guard(callbackQuery('game_short_name'), ...fns)
  }

  static unwrap<C extends Context>(handler: Middleware<C>): MiddlewareFn<C> {
    if (!handler) {
      throw new Error('Handler is undefined')
    }
    return 'middleware' in handler ? handler.middleware() : handler
  }

  static compose<C extends Context>(
    middlewares: ReadonlyArray<Middleware<C>>
  ): MiddlewareFn<C> {
    if (!Array.isArray(middlewares)) {
      throw new Error('Middlewares must be an array')
    }
    if (middlewares.length === 0) {
      return Composer.passThru()
    }
    if (middlewares.length === 1) {
      // Quite literally asserted in the above condition
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return Composer.unwrap(middlewares[0]!)
    }
    return (ctx, next) => {
      let index = -1
      return execute(0, ctx)
      async function execute(i: number, context: C): Promise<void> {
        if (!(context instanceof Context)) {
          throw new Error('next(ctx) called with invalid context')
        }
        if (i <= index) {
          throw new Error('next() called multiple times')
        }
        index = i
        const handler = Composer.unwrap(middlewares[i] ?? next)
        await handler(context, async (ctx = context) => {
          await execute(i + 1, ctx)
        })
      }
    }
  }
}

function escapeRegExp(s: string) {
  // $& means the whole matched string
  return s.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&')
}

function normalizeTriggers<C extends Context>(
  triggers: Triggers<C>
): Array<(value: string, ctx: C) => RegExpExecArray | null> {
  if (!Array.isArray(triggers)) triggers = [triggers]

  return triggers.map((trigger) => {
    if (!trigger) throw new Error('Invalid trigger')
    if (typeof trigger === 'function') return trigger

    if (trigger instanceof RegExp)
      return (value = '') => {
        trigger.lastIndex = 0
        return trigger.exec(value)
      }

    const regex = new RegExp(`^${escapeRegExp(trigger)}$`)
    return (value: string) => regex.exec(value)
  })
}

function getEntities(msg: tg.Message | undefined): tg.MessageEntity[] {
  if (msg == null) return []
  if ('caption_entities' in msg) return msg.caption_entities ?? []
  if ('entities' in msg) return msg.entities ?? []
  return []
}
function getText(
  msg: tg.Message | tg.CallbackQuery | undefined
): string | undefined {
  if (msg == null) return undefined
  if ('caption' in msg) return msg.caption
  if ('text' in msg) return msg.text
  if ('data' in msg) return msg.data
  if ('game_short_name' in msg) return msg.game_short_name
  return undefined
}

function normalizeTextArguments(argument: MaybeArray<string>, prefix = '') {
  const args = Array.isArray(argument) ? argument : [argument]
  // prettier-ignore
  return args
    .filter(Boolean)
    .map((arg) => prefix && typeof arg === 'string' && !arg.startsWith(prefix) ? `${prefix}${arg}` : arg)
}

export default Composer
