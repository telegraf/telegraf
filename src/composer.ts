/** @format */

import * as tt from './telegram-types'
import { Middleware, NonemptyReadonlyArray } from './types'
import Context from './context'
import { SnakeToCamelCase } from './core/helpers/string'

type MaybeArray<T> = T | T[]
type MaybePromise<T> = T | Promise<T>
type Triggers<C> = MaybeArray<
  string | RegExp | ((value: string, ctx: C) => RegExpExecArray | null)
>
type Predicate<T> = (t: T) => boolean
type AsyncPredicate<T> = (t: T) => Promise<boolean>

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never
type PropOr<T, P extends string, D> = T extends Record<P, infer V> ? V : D

type MatchedMiddleware<
  C extends Context,
  T extends tt.UpdateType | tt.MessageSubType = 'message' | 'channel_post'
> = NonemptyReadonlyArray<
  Middleware<MatchedContext<C & { match: RegExpExecArray }, T>>
>

/** Takes: a context type and an update type (or message subtype).
    Produces: a context that has some properties required, and some undefined.
    The required ones are those that are always present when the given update (or message) arrives.
    The undefined ones are those that are always absent when the given update (or message) arrives. */
type MatchedContext<
  C extends Context,
  T extends tt.UpdateType | tt.MessageSubType
> = GuardedContext<C, MountMap[T]>

/**
 * Narrows down `Context['update']` and some derived properties.
 */
type GuardedContext<
  C extends Context,
  U extends Omit<tt.Update, 'update_id'>
> = C &
  {
    [P in tt.UpdateType as SnakeToCamelCase<P>]: PropOr<U, P, undefined>
  } & {
    update: U
    updateType: keyof UnionToIntersection<U>
  }
/**
 * Maps `Composer.mount`'s `updateType` to a type
 * that narrows down `tt.Update` when intersected with it.
 */
type MountMap = {
  [T in tt.UpdateType]: Record<T, object>
} &
  {
    [T in tt.MessageSubType]: {
      message: Pick<UnionToIntersection<tt.Message>, T>
    }
  }

interface GameQueryUpdate extends tt.Update.CallbackQueryUpdate {
  callback_query: tt.CallbackQuery.GameShortGameCallbackQuery
}

function always<T>(x: T) {
  return () => x
}
const anoop = always(Promise.resolve())

export class Composer<C extends Context> implements Middleware.Obj<C> {
  private handler: Middleware.Fn<C>

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
   */
  guard<U extends tt.Update>(
    guardFn: (update: tt.Update) => update is U,
    ...fns: NonemptyReadonlyArray<Middleware<GuardedContext<C, U>>>
  ) {
    return this.use(Composer.guard<C, U>(guardFn, ...fns))
  }

  /**
   * Registers middleware for handling provided update types.
   */
  on<T extends tt.UpdateType | tt.MessageSubType>(
    updateType: MaybeArray<T>,
    ...fns: NonemptyReadonlyArray<Middleware<MatchedContext<C, T>>>
  ) {
    return this.use(Composer.mount<C, T>(updateType, ...fns))
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
  command(command: MaybeArray<string>, ...fns: MatchedMiddleware<C, 'text'>) {
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
      Middleware<GuardedContext<C, GameQueryUpdate>>
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
      | ((entity: tt.MessageEntity, s: string, ctx: C) => boolean),
    ...fns: ReadonlyArray<Middleware<MatchedContext<C, T>>>
  ) {
    return this.use(Composer.entity<C, T>(predicate, ...fns))
  }

  email(email: MaybeArray<string>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.email<C>(email, ...fns))
  }

  url(url: MaybeArray<string>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.url<C>(url, ...fns))
  }

  textLink(link: MaybeArray<string>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.textLink<C>(link, ...fns))
  }

  textMention(mention: MaybeArray<string>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.textMention<C>(mention, ...fns))
  }

  mention(mention: MaybeArray<string>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.mention<C>(mention, ...fns))
  }

  phone(number: MaybeArray<string>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.phone<C>(number, ...fns))
  }

  hashtag(hashtag: MaybeArray<string>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.hashtag<C>(hashtag, ...fns))
  }

  cashtag(cashtag: MaybeArray<string>, ...fns: MatchedMiddleware<C>) {
    return this.use(Composer.cashtag<C>(cashtag, ...fns))
  }

  /**
   * Registers a middleware for handling /start
   */
  start(...fns: ReadonlyArray<Middleware<C & { startPayload: string }>>) {
    const handler = Composer.compose(fns)
    return this.command('start', (ctx, next) => {
      const startPayload = ctx.message.text.substring(7)
      return handler(Object.assign(ctx, { startPayload }), next)
    })
  }

  /**
   * Registers a middleware for handling /help
   */
  help(...fns: NonemptyReadonlyArray<Middleware<C>>) {
    return this.command('help', ...fns)
  }

  /**
   * Registers a middleware for handling /settings
   */
  settings(...fns: NonemptyReadonlyArray<Middleware<C>>) {
    return this.command('settings', ...fns)
  }

  middleware() {
    return this.handler
  }

  static reply(...args: Parameters<Context['reply']>): Middleware.Fn<Context> {
    return (ctx) => ctx.reply(...args)
  }

  static catch<C extends Context>(
    errorHandler: (err: unknown, ctx: C) => void,
    ...fns: ReadonlyArray<Middleware<C>>
  ): Middleware.Fn<C> {
    const handler = Composer.compose(fns)
    // prettier-ignore
    return (ctx, next) => Promise.resolve(handler(ctx, next))
      .catch((err) => errorHandler(err, ctx))
  }

  /**
   * Generates middleware that runs in the background.
   */
  static fork<C extends Context>(middleware: Middleware<C>): Middleware.Fn<C> {
    const handler = Composer.unwrap(middleware)
    return async (ctx, next) => {
      await Promise.all([handler(ctx, anoop), next()])
    }
  }

  static tap<C extends Context>(middleware: Middleware<C>): Middleware.Fn<C> {
    const handler = Composer.unwrap(middleware)
    return (ctx, next) =>
      Promise.resolve(handler(ctx, anoop)).then(() => next())
  }

  /**
   * Generates middleware that gives up control to the next middleware.
   */
  static passThru(): Middleware.Fn<Context> {
    return (ctx, next) => next()
  }

  static lazy<C extends Context>(
    factoryFn: (ctx: C) => MaybePromise<Middleware<C>>
  ): Middleware.Fn<C> {
    if (typeof factoryFn !== 'function') {
      throw new Error('Argument must be a function')
    }
    return (ctx, next) =>
      Promise.resolve(factoryFn(ctx)).then((middleware) =>
        Composer.unwrap(middleware)(ctx, next)
      )
  }

  static log(logFn: (s: string) => void = console.log): Middleware.Fn<Context> {
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
  ): Middleware.Fn<C> {
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
  ): Middleware.Fn<C> {
    return Composer.branch(
      predicate,
      Composer.compose(fns),
      Composer.passThru()
    )
  }

  static filter<C extends Context>(predicate: Predicate<C>): Middleware.Fn<C> {
    return Composer.branch(predicate, Composer.passThru(), anoop)
  }

  /**
   * Generates middleware for dropping matching updates.
   */
  static drop<C extends Context>(predicate: Predicate<C>): Middleware.Fn<C> {
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
   * Note that `Composer.mount('message')` is preferred over this.
   *
   * @param guardFn predicate to decide whether to run the middleware based on the `ctx.update` object
   * @param fns middleware to run if the predicate returns true
   * @see `Composer.optional` for a more generic version of this method that allows the predicate to operate on `ctx` itself
   */
  static guard<C extends Context, U extends tt.Update>(
    guardFn: (u: tt.Update) => u is U,
    ...fns: NonemptyReadonlyArray<Middleware<GuardedContext<C, U>>>
  ): Middleware.Fn<C> {
    return Composer.optional<C>(
      (ctx) => guardFn(ctx.update),
      // @ts-expect-error see explanation above
      ...fns
    )
  }

  /**
   * Generates middleware for handling provided update types.
   */
  static mount<C extends Context, T extends tt.UpdateType | tt.MessageSubType>(
    updateType: MaybeArray<T>,
    ...fns: NonemptyReadonlyArray<Middleware<MatchedContext<C, T>>>
  ): Middleware.Fn<C> {
    const updateTypes = normalizeTextArguments(updateType)

    const predicate = (update: tt.Update): update is tt.Update & MountMap[T] =>
      updateTypes.some(
        (type) =>
          // Check update type
          type in update ||
          // Check message sub-type
          ('message' in update && type in update.message)
      )

    return Composer.guard(predicate, ...fns)
  }

  private static entity<
    C extends Context,
    T extends 'message' | 'channel_post' | tt.MessageSubType =
      | 'message'
      | 'channel_post'
  >(
    predicate:
      | MaybeArray<string>
      | ((entity: tt.MessageEntity, s: string, ctx: C) => boolean),
    ...fns: ReadonlyArray<Middleware<MatchedContext<C, T>>>
  ): Middleware.Fn<C> {
    if (typeof predicate !== 'function') {
      const entityTypes = normalizeTextArguments(predicate)
      return Composer.entity(({ type }) => entityTypes.includes(type), ...fns)
    }
    return Composer.optional<C>((ctx) => {
      const msg: tt.Message | undefined = ctx.message ?? ctx.channelPost
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
  ): Middleware.Fn<C> {
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
    email: MaybeArray<string>,
    ...fns: MatchedMiddleware<C>
  ): Middleware.Fn<C> {
    return Composer.entityText<C>('email', email, ...fns)
  }

  static phone<C extends Context>(
    number: MaybeArray<string>,
    ...fns: MatchedMiddleware<C>
  ): Middleware.Fn<C> {
    return Composer.entityText<C>('phone_number', number, ...fns)
  }

  static url<C extends Context>(
    url: MaybeArray<string>,
    ...fns: MatchedMiddleware<C>
  ): Middleware.Fn<C> {
    return Composer.entityText<C>('url', url, ...fns)
  }

  static textLink<C extends Context>(
    link: MaybeArray<string>,
    ...fns: MatchedMiddleware<C>
  ): Middleware.Fn<C> {
    return Composer.entityText<C>('text_link', link, ...fns)
  }

  static textMention<C extends Context>(
    mention: MaybeArray<string>,
    ...fns: MatchedMiddleware<C>
  ): Middleware.Fn<C> {
    return Composer.entityText<C>('text_mention', mention, ...fns)
  }

  static mention<C extends Context>(
    mention: MaybeArray<string>,
    ...fns: MatchedMiddleware<C>
  ): Middleware.Fn<C> {
    return Composer.entityText<C>(
      'mention',
      normalizeTextArguments(mention, '@'),
      ...fns
    )
  }

  static hashtag<C extends Context>(
    hashtag: MaybeArray<string>,
    ...fns: MatchedMiddleware<C>
  ): Middleware.Fn<C> {
    return Composer.entityText<C>(
      'hashtag',
      normalizeTextArguments(hashtag, '#'),
      ...fns
    )
  }

  static cashtag<C extends Context>(
    cashtag: MaybeArray<string>,
    ...fns: MatchedMiddleware<C>
  ): Middleware.Fn<C> {
    return Composer.entityText<C>(
      'cashtag',
      normalizeTextArguments(cashtag, '$'),
      ...fns
    )
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
  ): Middleware.Fn<C> {
    const handler = Composer.compose(fns)
    return (ctx, next) => {
      const text =
        getText(ctx.message) ??
        getText(ctx.channelPost) ??
        getText(ctx.callbackQuery) ??
        ctx.inlineQuery?.query
      if (text === undefined) return next()
      for (const trigger of triggers) {
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
  ): Middleware.Fn<C> {
    return Composer.mount(
      'text',
      Composer.match<C, 'text'>(normalizeTriggers(triggers), ...fns)
    )
  }

  /**
   * Generates middleware for handling specified commands.
   */
  static command<C extends Context>(
    command: MaybeArray<string>,
    ...fns: MatchedMiddleware<C, 'text'>
  ): Middleware.Fn<C> {
    if (fns.length === 0) {
      // @ts-expect-error command is really the middleware
      return Composer.entity('bot_command', command)
    }
    const commands = normalizeTextArguments(command, '/')
    return Composer.mount<C, 'text'>(
      'text',
      Composer.lazy<MatchedContext<C, 'text'>>((ctx) => {
        const groupCommands =
          ctx.me && ctx.chat?.type.endsWith('group')
            ? commands.map((command) => `${command}@${ctx.me}`)
            : []
        return Composer.entity<MatchedContext<C, 'text'>>(
          ({ offset, type }, value) =>
            offset === 0 &&
            type === 'bot_command' &&
            (commands.includes(value) || groupCommands.includes(value)),
          // @ts-expect-error see explanation above
          ...fns
        )
      })
    )
  }

  /**
   * Generates middleware for handling matching callback queries.
   */
  static action<C extends Context>(
    triggers: Triggers<C>,
    ...fns: MatchedMiddleware<C, 'callback_query'>
  ): Middleware.Fn<C> {
    return Composer.mount(
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
  ): Middleware.Fn<C> {
    return Composer.mount(
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
  ): Middleware.Fn<C> {
    if (typeof userId === 'function') {
      return Composer.optional(userId, ...fns)
    }
    const allowed = Array.isArray(userId) ? userId : [userId]
    // prettier-ignore
    return Composer.optional((ctx) => !ctx.from || allowed.includes(ctx.from.id), ...fns)
  }

  private static memberStatus<C extends Context>(
    status: MaybeArray<tt.ChatMember['status']>,
    ...fns: NonemptyReadonlyArray<Middleware<C>>
  ): Middleware.Fn<C> {
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
  ): Middleware.Fn<C> {
    return Composer.memberStatus(['administrator', 'creator'], ...fns)
  }

  /**
   * Generates middleware responding only to chat creator.
   */
  static creator<C extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<C>>
  ): Middleware.Fn<C> {
    return Composer.memberStatus('creator', ...fns)
  }

  /**
   * Generates middleware running only in specified chat types.
   */
  static chatType<C extends Context>(
    type: MaybeArray<tt.ChatType>,
    ...fns: NonemptyReadonlyArray<Middleware<C>>
  ): Middleware.Fn<C> {
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
  ): Middleware.Fn<C> {
    return Composer.chatType('private', ...fns)
  }

  /**
   * Generates middleware running only in groups and supergroups.
   */
  static groupChat<C extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<C>>
  ): Middleware.Fn<C> {
    return Composer.chatType(['group', 'supergroup'], ...fns)
  }

  /**
   * Generates middleware for handling game queries.
   */
  static gameQuery<C extends Context>(
    ...fns: NonemptyReadonlyArray<
      Middleware<GuardedContext<C, GameQueryUpdate>>
    >
  ): Middleware.Fn<C> {
    return Composer.guard(
      (u): u is GameQueryUpdate =>
        'callback_query' in u && 'game_short_name' in u.callback_query,
      ...fns
    )
  }

  static unwrap<C extends Context>(handler: Middleware<C>): Middleware.Fn<C> {
    if (!handler) {
      throw new Error('Handler is undefined')
    }
    return 'middleware' in handler ? handler.middleware() : handler
  }

  static compose<C extends Context, Extension extends object>(
    middlewares: readonly [
      Middleware.Ext<C, Extension>,
      ...ReadonlyArray<Middleware<Extension & C>>
    ]
  ): Middleware.Fn<C>
  static compose<C extends Context>(
    middlewares: ReadonlyArray<Middleware<C>>
  ): Middleware.Fn<C>
  static compose<C extends Context>(
    middlewares: ReadonlyArray<Middleware<C>>
  ): Middleware.Fn<C> {
    if (!Array.isArray(middlewares)) {
      throw new Error('Middlewares must be an array')
    }
    if (middlewares.length === 0) {
      return Composer.passThru()
    }
    if (middlewares.length === 1) {
      return Composer.unwrap(middlewares[0])
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
        const handler = middlewares[i] ? Composer.unwrap(middlewares[i]) : next
        if (!handler) {
          return
        }
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
  if (!Array.isArray(triggers)) {
    triggers = [triggers]
  }
  return triggers.map((trigger) => {
    if (!trigger) {
      throw new Error('Invalid trigger')
    }
    if (typeof trigger === 'function') {
      return trigger
    }
    if (trigger instanceof RegExp) {
      return (value = '') => {
        trigger.lastIndex = 0
        return trigger.exec(value)
      }
    }
    const regex = new RegExp(`^${escapeRegExp(trigger)}$`)
    return (value: string) => regex.exec(value)
  })
}

function getEntities(msg: tt.Message | undefined): tt.MessageEntity[] {
  if (msg == null) return []
  if ('caption_entities' in msg) return msg.caption_entities ?? []
  if ('entities' in msg) return msg.entities ?? []
  return []
}
function getText(
  msg: tt.Message | tt.CallbackQuery | undefined
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
