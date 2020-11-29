/** @format */

import * as tt from './telegram-types'
import { Middleware, NonemptyReadonlyArray } from './types'
import Context from './context'

type MaybeArray<T> = T | T[]
type MaybePromise<T> = T | Promise<T>
type Triggers<TContext> = MaybeArray<
  string | RegExp | ((value: string, ctx: TContext) => RegExpExecArray | null)
>
type Predicate<T> = (t: T) => boolean
type AsyncPredicate<T> = (t: T) => Promise<boolean>

function always<T>(x: T) {
  return () => x
}
const anoop = always(Promise.resolve())

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

type Props = {
  [key in tt.UpdateType]: tt.UpdateProps[key] & tt.ContextProps[key]
}
type SubProps = {
  [key in tt.MessageSubType]: Props['message'] &
    tt.UpdateSubProps[key] &
    tt.ContextSubProps[key]
}

type MatchedContext<
  C extends Context,
  T extends tt.UpdateType | tt.MessageSubType
> = C &
  // TODO: support subtypes for: callback query, channel post, maybe more?
  (T extends tt.UpdateType ? Props[T] : SubProps[Exclude<T, tt.UpdateType>]) &
  tt.AbsentProps<
    Exclude<
      tt.UpdateType,
      T | (T extends tt.MessageSubType ? 'message' : never)
    >
  >

type EntityMatch<
  C extends Context,
  M = RegExpExecArray,
  T extends tt.UpdateType | tt.MessageSubType = 'message' | 'channel_post'
> = NonemptyReadonlyArray<Middleware<MatchedContext<C & { match: M }, T>>>

type Prefix<S extends MaybeArray<string>, P extends string> = S extends string
  ? `${P}${S}`
  : `${P}${S[number]}`

export class Composer<TContext extends Context>
  implements Middleware.Obj<TContext> {
  private handler: Middleware.Fn<TContext>

  constructor(...fns: ReadonlyArray<Middleware<TContext>>) {
    this.handler = Composer.compose(fns)
  }

  /**
   * Registers a middleware.
   */
  use(...fns: ReadonlyArray<Middleware<TContext>>) {
    this.handler = Composer.compose([this.handler, ...fns])
    return this
  }

  /**
   * Registers middleware for handling provided update types.
   */
  on<U extends tt.UpdateType | tt.MessageSubType>(
    updateType: MaybeArray<U>,
    ...fns: NonemptyReadonlyArray<Middleware<MatchedContext<TContext, U>>>
  ) {
    return this.use(Composer.mount<TContext, U>(updateType, ...fns))
  }

  /**
   * Registers middleware for handling matching text messages.
   */
  hears(
    triggers: Triggers<TContext>,
    ...fns: EntityMatch<TContext, RegExpExecArray, 'text'>
  ) {
    return this.use(Composer.hears<TContext>(triggers, ...fns))
  }

  /**
   * Registers middleware for handling specified commands.
   */
  command(
    command: MaybeArray<string>,
    ...fns: EntityMatch<TContext, RegExpExecArray, 'text'>
  ) {
    return this.use(Composer.command<TContext>(command, ...fns))
  }

  /**
   * Registers middleware for handling matching callback queries.
   */
  action(
    triggers: Triggers<TContext>,
    ...fns: EntityMatch<TContext, RegExpExecArray, 'callback_query'>
  ) {
    return this.use(Composer.action<TContext>(triggers, ...fns))
  }

  /**
   * Registers middleware for handling matching inline queries.
   */
  inlineQuery(
    triggers: Triggers<TContext>,
    ...fns: EntityMatch<TContext, RegExpExecArray, 'inline_query'>
  ) {
    return this.use(Composer.inlineQuery<TContext>(triggers, ...fns))
  }

  gameQuery(...fns: NonemptyReadonlyArray<Middleware<TContext>>) {
    return this.use(Composer.gameQuery(...fns))
  }

  /**
   * Registers middleware for dropping matching updates.
   */
  drop(predicate: Predicate<TContext>) {
    return this.use(Composer.drop(predicate))
  }

  filter(predicate: Predicate<TContext>) {
    return this.use(Composer.filter(predicate))
  }

  private entity<
    T extends 'message' | 'channel_post' | tt.MessageSubType =
      | 'message'
      | 'channel_post'
  >(
    predicate:
      | MaybeArray<string>
      | ((entity: tt.MessageEntity, s: string, ctx: TContext) => boolean),
    ...fns: ReadonlyArray<Middleware<MatchedContext<TContext, T>>>
  ) {
    return this.use(Composer.entity<TContext, T>(predicate, ...fns))
  }

  email<P extends MaybeArray<string>>(
    email: P,
    ...fns: EntityMatch<TContext, P>
  ) {
    return this.use(Composer.email<TContext, P>(email, ...fns))
  }

  url<P extends MaybeArray<string>>(url: P, ...fns: EntityMatch<TContext, P>) {
    return this.use(Composer.url<TContext, P>(url, ...fns))
  }

  textLink<P extends MaybeArray<string>>(
    link: P,
    ...fns: EntityMatch<TContext, P>
  ) {
    return this.use(Composer.textLink<TContext, P>(link, ...fns))
  }

  textMention<P extends MaybeArray<string>>(
    mention: P,
    ...fns: EntityMatch<TContext, P>
  ) {
    return this.use(Composer.textMention<TContext, P>(mention, ...fns))
  }

  mention<P extends MaybeArray<string>>(
    mention: P,
    ...fns: EntityMatch<TContext, Prefix<P, '@'>>
  ) {
    return this.use(Composer.mention<TContext, P>(mention, ...fns))
  }

  phone<P extends MaybeArray<string>>(
    number: P,
    ...fns: EntityMatch<TContext, P>
  ) {
    return this.use(Composer.phone<TContext, P>(number, ...fns))
  }

  hashtag<P extends MaybeArray<string>>(
    hashtag: P,
    ...fns: EntityMatch<TContext, Prefix<P, '#'>>
  ) {
    return this.use(Composer.hashtag<TContext, P>(hashtag, ...fns))
  }

  cashtag<P extends MaybeArray<string>>(
    cashtag: P,
    ...fns: EntityMatch<TContext, Prefix<P, '$'>>
  ) {
    return this.use(Composer.cashtag<TContext, P>(cashtag, ...fns))
  }

  /**
   * Registers a middleware for handling /start
   */
  start(
    ...fns: ReadonlyArray<Middleware<TContext & { startPayload: string }>>
  ) {
    const handler = Composer.compose(fns)
    return this.command('start', (ctx, next) => {
      const startPayload = ctx.message.text.substring(7)
      return handler(Object.assign(ctx, { startPayload }), next)
    })
  }

  /**
   * Registers a middleware for handling /help
   */
  help(...fns: NonemptyReadonlyArray<Middleware<TContext>>) {
    return this.command('help', ...fns)
  }

  /**
   * Registers a middleware for handling /settings
   */
  settings(...fns: NonemptyReadonlyArray<Middleware<TContext>>) {
    return this.command('settings', ...fns)
  }

  middleware() {
    return this.handler
  }

  static reply<TContext extends Context>(
    ...args: Parameters<Context['reply']>
  ): Middleware.Fn<TContext> {
    return (ctx: TContext) => ctx.reply(...args)
  }

  private static catchAll<TContext extends Context>(
    ...fns: ReadonlyArray<Middleware<TContext>>
  ): Middleware.Fn<TContext> {
    return Composer.catch((err) => {
      console.error()
      console.error((err.stack || err.toString()).replace(/^/gm, '  '))
      console.error()
    }, ...fns)
  }

  static catch<TContext extends Context>(
    errorHandler: (err: any, ctx: TContext) => void,
    ...fns: ReadonlyArray<Middleware<TContext>>
  ): Middleware.Fn<TContext> {
    const handler = Composer.compose(fns)
    // prettier-ignore
    return (ctx, next) => Promise.resolve(handler(ctx, next))
      .catch((err) => errorHandler(err, ctx))
  }

  /**
   * Generates middleware that runs in the background.
   */
  static fork<TContext extends Context>(
    middleware: Middleware<TContext>
  ): Middleware.Fn<TContext> {
    const handler = Composer.unwrap(middleware)
    return async (ctx, next) => {
      await Promise.all([handler(ctx, anoop), next()])
    }
  }

  static tap<TContext extends Context>(
    middleware: Middleware<TContext>
  ): Middleware.Fn<TContext> {
    const handler = Composer.unwrap(middleware)
    return (ctx, next) =>
      Promise.resolve(handler(ctx, anoop)).then(() => next())
  }

  static passThru(): Middleware.Fn<Context> {
    return (ctx, next) => next()
  }

  static lazy<TContext extends Context, C extends TContext = TContext>(
    factoryFn: (ctx: TContext) => MaybePromise<Middleware<C>>
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
  static branch<TContext extends Context>(
    predicate: Predicate<TContext> | AsyncPredicate<TContext>,
    trueMiddleware: Middleware<TContext>,
    falseMiddleware: Middleware<TContext>
  ): Middleware.Fn<TContext> {
    if (typeof predicate !== 'function') {
      return Composer.unwrap(predicate ? trueMiddleware : falseMiddleware)
    }
    return Composer.lazy<TContext>((ctx) =>
      Promise.resolve(predicate(ctx)).then((value) =>
        value ? trueMiddleware : falseMiddleware
      )
    )
  }

  /**
   * Generates optional middleware.
   * @param middleware middleware to run if the predicate returns true
   */
  static optional<TContext extends Context>(
    predicate: Predicate<TContext> | AsyncPredicate<TContext>,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ): Middleware.Fn<TContext> {
    return Composer.branch(
      predicate,
      Composer.compose(fns),
      Composer.passThru()
    )
  }

  static filter<TContext extends Context>(
    predicate: Predicate<TContext>
  ): Middleware.Fn<TContext> {
    return Composer.branch(predicate, Composer.passThru(), anoop)
  }

  static drop<TContext extends Context>(
    predicate: Predicate<TContext>
  ): Middleware.Fn<TContext> {
    return Composer.branch(predicate, anoop, Composer.passThru())
  }

  static dispatch<
    TContext extends Context,
    Handlers extends Record<string | number | symbol, Middleware<TContext>>
  >(
    routeFn: keyof Handlers | ((ctx: TContext) => keyof Handlers),
    handlers: Handlers
  ): Middleware<TContext> {
    return typeof routeFn === 'function'
      ? Composer.lazy<TContext>((ctx) =>
          Promise.resolve(routeFn(ctx)).then((value) => handlers[value])
        )
      : handlers[routeFn]
  }

  // EXPLANATION FOR THE ts-expect-error ANNOTATIONS

  // The annotations around function invocations with `...fns` are there
  // whenever we perform validation logic that the flow analysis of TypeScript
  // cannot comprehend. We always make sure that the middleware functions are
  // only invoked with properly constrained context objects, but this cannot be
  // determined automatically.

  /**
   * Generates middleware for handling provided update types.
   */
  static mount<
    TContext extends Context,
    U extends tt.UpdateType | tt.MessageSubType
  >(
    updateType: MaybeArray<U>,
    ...fns: NonemptyReadonlyArray<Middleware<MatchedContext<TContext, U>>>
  ): Middleware.Fn<TContext> {
    const updateTypes = normalizeTextArguments(updateType)

    const predicate = (ctx: TContext) =>
      updateTypes.includes(ctx.updateType) ||
      // @ts-expect-error `type` is a string and not a union of literals
      updateTypes.some((type) => ctx.updateSubTypes.includes(type))

    // @ts-expect-error see explanation above
    return Composer.optional<TContext>(predicate, ...fns)
  }

  private static entity<
    TContext extends Context,
    T extends 'message' | 'channel_post' | tt.MessageSubType =
      | 'message'
      | 'channel_post'
  >(
    predicate:
      | MaybeArray<string>
      | ((entity: tt.MessageEntity, s: string, ctx: TContext) => boolean),
    ...fns: ReadonlyArray<Middleware<MatchedContext<TContext, T>>>
  ): Middleware.Fn<TContext> {
    if (typeof predicate !== 'function') {
      const entityTypes = normalizeTextArguments(predicate)
      return Composer.entity(({ type }) => entityTypes.includes(type), ...fns)
    }
    return Composer.optional<TContext>((ctx) => {
      // The expression `ctx.message ?? ctx.channelPost` generates a union type
      // that is too complex to represent, so we're working our way around that
      // by narrowing down the raw update type itself
      let msg: tt.Message
      if ('message' in ctx.update) {
        msg = ctx.update.message
      } else if ('channel_post' in ctx.update) {
        msg = ctx.update.channel_post
      } else {
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

  static entityText<TContext extends Context, P extends Triggers<TContext>>(
    entityType: MaybeArray<string>,
    predicate: P,
    ...fns: EntityMatch<TContext, P>
  ): Middleware.Fn<TContext> {
    if (fns.length === 0) {
      // prettier-ignore
      return Array.isArray(predicate)
        ? Composer.entity(entityType, ...predicate)
        // @ts-expect-error
        : Composer.entity(entityType, predicate)
    }
    const triggers = normalizeTriggers(predicate)
    return Composer.entity<TContext>(({ type }, value, ctx) => {
      if (type !== entityType) {
        return false
      }
      for (const trigger of triggers) {
        // @ts-expect-error
        if ((ctx.match = trigger(value, ctx))) {
          return true
        }
      }
      return false
      // @ts-expect-error see explanation above
    }, ...fns)
  }

  static email<TContext extends Context, P extends MaybeArray<string>>(
    email: P,
    ...fns: EntityMatch<TContext, P>
  ): Middleware.Fn<TContext> {
    return Composer.entityText<TContext, P>('email', email, ...fns)
  }

  static phone<TContext extends Context, P extends MaybeArray<string>>(
    number: P,
    ...fns: EntityMatch<TContext, P>
  ): Middleware.Fn<TContext> {
    return Composer.entityText<TContext, P>('phone_number', number, ...fns)
  }

  static url<TContext extends Context, P extends MaybeArray<string>>(
    url: P,
    ...fns: EntityMatch<TContext, P>
  ): Middleware.Fn<TContext> {
    return Composer.entityText<TContext, P>('url', url, ...fns)
  }

  static textLink<TContext extends Context, P extends MaybeArray<string>>(
    link: P,
    ...fns: EntityMatch<TContext, P>
  ): Middleware.Fn<TContext> {
    return Composer.entityText<TContext, P>('text_link', link, ...fns)
  }

  static textMention<TContext extends Context, P extends MaybeArray<string>>(
    mention: P,
    ...fns: EntityMatch<TContext, P>
  ): Middleware.Fn<TContext> {
    return Composer.entityText<TContext, P>('text_mention', mention, ...fns)
  }

  static mention<TContext extends Context, P extends MaybeArray<string>>(
    mention: P,
    ...fns: EntityMatch<TContext, Prefix<P, '@'>>
  ): Middleware.Fn<TContext> {
    return Composer.entityText<TContext, P>(
      'mention',
      // @ts-expect-error the normalization discards types
      normalizeTextArguments(mention, '@'),
      ...fns
    )
  }

  static hashtag<TContext extends Context, P extends MaybeArray<string>>(
    hashtag: P,
    ...fns: EntityMatch<TContext, Prefix<P, '#'>>
  ): Middleware.Fn<TContext> {
    return Composer.entityText<TContext, P>(
      'hashtag',
      // @ts-expect-error the normalization discards types
      normalizeTextArguments(hashtag, '#'),
      ...fns
    )
  }

  static cashtag<TContext extends Context, P extends MaybeArray<string>>(
    cashtag: P,
    ...fns: EntityMatch<TContext, Prefix<P, '$'>>
  ): Middleware.Fn<TContext> {
    return Composer.entityText<TContext, P>(
      'cashtag',
      // @ts-expect-error the normalization discards types
      normalizeTextArguments(cashtag, '$'),
      ...fns
    )
  }

  private static match<
    TContext extends Context,
    T extends
      | 'message'
      | 'channel_post'
      | 'callback_query'
      | 'inline_query'
      | tt.MessageSubType
  >(
    triggers: ReadonlyArray<
      (text: string, ctx: TContext) => RegExpExecArray | null
    >,
    ...fns: EntityMatch<TContext, RegExpExecArray, T>
  ): Middleware.Fn<TContext> {
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
  static hears<TContext extends Context>(
    triggers: Triggers<TContext>,
    ...fns: EntityMatch<TContext, RegExpExecArray, 'text'>
  ): Middleware.Fn<TContext> {
    return Composer.mount(
      'text',
      Composer.match(normalizeTriggers(triggers), ...fns)
    )
  }

  /**
   * Generates middleware for handling specified commands.
   */
  static command<TContext extends Context>(
    command: MaybeArray<string>,
    ...fns: EntityMatch<TContext, RegExpExecArray, 'text'>
  ): Middleware.Fn<TContext> {
    if (fns.length === 0) {
      // @ts-expect-error
      return Composer.entity(['bot_command'], command)
    }
    const commands = normalizeTextArguments(command, '/')
    return Composer.mount<TContext, 'text'>(
      'text',
      Composer.lazy<TContext, MatchedContext<TContext, 'text'>>((ctx) => {
        const groupCommands =
          ctx.me && ctx.chat?.type.endsWith('group')
            ? // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              commands.map((command) => `${command}@${ctx.me}`)
            : []
        return Composer.entity<MatchedContext<TContext, 'text'>>(
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
  static action<TContext extends Context>(
    triggers: Triggers<TContext>,
    ...fns: EntityMatch<TContext, RegExpExecArray, 'callback_query'>
  ): Middleware.Fn<TContext> {
    return Composer.mount(
      'callback_query',
      Composer.match(normalizeTriggers(triggers), ...fns)
    )
  }

  /**
   * Generates middleware for handling matching inline queries.
   */
  static inlineQuery<TContext extends Context>(
    triggers: Triggers<TContext>,
    ...fns: EntityMatch<TContext, RegExpExecArray, 'inline_query'>
  ): Middleware.Fn<TContext> {
    return Composer.mount(
      'inline_query',
      Composer.match(normalizeTriggers(triggers), ...fns)
    )
  }

  static acl<TContext extends Context>(
    userId: MaybeArray<number>,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ): Middleware.Fn<TContext> {
    if (typeof userId === 'function') {
      return Composer.optional(userId, ...fns)
    }
    const allowed = Array.isArray(userId) ? userId : [userId]
    // prettier-ignore
    return Composer.optional((ctx) => !ctx.from || allowed.includes(ctx.from.id), ...fns)
  }

  private static memberStatus<TContext extends Context>(
    status: MaybeArray<tt.ChatMember['status']>,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ): Middleware.Fn<TContext> {
    const statuses = Array.isArray(status) ? status : [status]
    return Composer.optional(async (ctx) => {
      if (ctx.message === undefined) return false
      const member = await ctx.getChatMember(ctx.message.from.id)
      return statuses.includes(member.status)
    }, ...fns)
  }

  static admin<TContext extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ): Middleware.Fn<TContext> {
    return Composer.memberStatus(['administrator', 'creator'], ...fns)
  }

  static creator<TContext extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ): Middleware.Fn<TContext> {
    return Composer.memberStatus('creator', ...fns)
  }

  static chatType<TContext extends Context>(
    type: MaybeArray<tt.ChatType>,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ): Middleware.Fn<TContext> {
    const types = Array.isArray(type) ? type : [type]
    // @ts-expect-error
    // prettier-ignore
    return Composer.optional((ctx) => ctx.chat && types.includes(ctx.chat.type), ...fns)
  }

  static privateChat<TContext extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ): Middleware.Fn<TContext> {
    return Composer.chatType('private', ...fns)
  }

  static groupChat<TContext extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ): Middleware.Fn<TContext> {
    return Composer.chatType(['group', 'supergroup'], ...fns)
  }

  static gameQuery<TContext extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ): Middleware.Fn<TContext> {
    return Composer.optional(
      (ctx) =>
        ctx.callbackQuery != null && 'game_short_name' in ctx.callbackQuery,
      ...fns
    )
  }

  static unwrap<TContext extends Context>(
    handler: Middleware<TContext>
  ): Middleware.Fn<TContext> {
    if (!handler) {
      throw new Error('Handler is undefined')
    }
    return 'middleware' in handler ? handler.middleware() : handler
  }

  static compose<TContext extends Context, Extension extends object>(
    middlewares: readonly [
      Middleware.Ext<TContext, Extension>,
      ...ReadonlyArray<Middleware<Extension & TContext>>
    ]
  ): Middleware.Fn<TContext>
  static compose<TContext extends Context>(
    middlewares: ReadonlyArray<Middleware<TContext>>
  ): Middleware.Fn<TContext>
  static compose<TContext extends Context>(
    middlewares: ReadonlyArray<Middleware<TContext>>
  ): Middleware.Fn<TContext> {
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
      async function execute(i: number, context: TContext): Promise<void> {
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

function normalizeTriggers<TContext extends Context>(
  triggers: Triggers<TContext>
): Array<(value: string, ctx: TContext) => RegExpExecArray | null> {
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

function normalizeTextArguments(argument: MaybeArray<string>, prefix = '') {
  const args = Array.isArray(argument) ? argument : [argument]
  // prettier-ignore
  return args
    .filter(Boolean)
    .map((arg) => prefix && typeof arg === 'string' && !arg.startsWith(prefix) ? `${prefix}${arg}` : arg)
}

export default Composer
