/** @format */

import * as tt from '../typings/telegram-types.d'
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

class Composer<TContext extends Context> implements Middleware.Obj<TContext> {
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
  on(
    updateTypes: MaybeArray<tt.UpdateType | tt.MessageSubTypes>,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return this.use(Composer.mount(updateTypes, ...fns))
  }

  /**
   * Registers middleware for handling matching text messages.
   */
  hears(
    triggers: Triggers<TContext>,
    ...fns: ReadonlyArray<Middleware<TContext>>
  ) {
    return this.use(Composer.hears(triggers, ...fns))
  }

  /**
   * Registers middleware for handling specified commands.
   */
  command(
    commands: MaybeArray<string>,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return this.use(Composer.command(commands, ...fns))
  }

  /**
   * Registers middleware for handling matching callback queries.
   */
  action(
    triggers: Triggers<TContext>,
    ...fns: ReadonlyArray<Middleware<TContext>>
  ) {
    return this.use(Composer.action(triggers, ...fns))
  }

  /**
   * Registers middleware for handling matching inline queries.
   */
  inlineQuery(
    triggers: Triggers<TContext>,
    ...fns: ReadonlyArray<Middleware<TContext>>
  ) {
    return this.use(Composer.inlineQuery(triggers, ...fns))
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

  private entity(...args: Parameters<typeof Composer['entity']>) {
    return this.use(Composer.entity(...args))
  }

  email(...args: Parameters<typeof Composer['email']>) {
    return this.use(Composer.email(...args))
  }

  url(...args: Parameters<typeof Composer['url']>) {
    return this.use(Composer.url(...args))
  }

  textLink(...args: Parameters<typeof Composer['textLink']>) {
    return this.use(Composer.textLink(...args))
  }

  textMention(...args: Parameters<typeof Composer['textMention']>) {
    return this.use(Composer.textMention(...args))
  }

  mention(...args: Parameters<typeof Composer['mention']>) {
    return this.use(Composer.mention(...args))
  }

  phone(...args: Parameters<typeof Composer['phone']>) {
    return this.use(Composer.phone(...args))
  }

  hashtag(...args: Parameters<typeof Composer['hashtag']>) {
    return this.use(Composer.hashtag(...args))
  }

  cashtag(...args: Parameters<typeof Composer['cashtag']>) {
    return this.use(Composer.cashtag(...args))
  }

  /**
   * Registers a middleware for handling /start
   */
  start(
    ...fns: ReadonlyArray<Middleware<TContext & { startPayload: string }>>
  ) {
    const handler = Composer.compose(fns)
    return this.command('start', (ctx, next) => {
      const startPayload = ctx.message!.text!.substring(7)
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

  static reply(...args: Parameters<Context['reply']>) {
    return (ctx: Context) => ctx.reply(...args)
  }

  private static catchAll<TContext extends Context>(
    ...fns: ReadonlyArray<Middleware<TContext>>
  ) {
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
   * @deprecated
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

  private static safePassThru() {
    // prettier-ignore
    // @ts-expect-error
    return (ctx, next) => typeof next === 'function' ? next(ctx) : Promise.resolve()
  }

  static lazy<TContext extends Context>(
    factoryFn: (ctx: TContext) => MaybePromise<Middleware<TContext>>
  ): Middleware.Fn<TContext> {
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
  ) {
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
  ) {
    return Composer.branch(
      predicate,
      Composer.compose(fns),
      Composer.passThru()
    )
  }

  static filter<TContext extends Context>(predicate: Predicate<TContext>) {
    return Composer.branch(predicate, Composer.passThru(), anoop)
  }

  static drop<TContext extends Context>(predicate: Predicate<TContext>) {
    return Composer.branch(predicate, anoop, Composer.passThru())
  }

  static dispatch<
    TContext extends Context,
    Handlers extends Record<string | number | symbol, Middleware<TContext>>
  >(routeFn: (ctx: TContext) => keyof Handlers, handlers: Handlers) {
    return typeof routeFn === 'function'
      ? Composer.lazy<TContext>((ctx) =>
          Promise.resolve(routeFn(ctx)).then((value) => handlers[value])
        )
      : handlers[routeFn]
  }

  /**
   * Generates middleware for handling provided update types.
   */
  static mount<TContext extends Context>(
    updateType: MaybeArray<tt.UpdateType | tt.MessageSubTypes>,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    const updateTypes = normalizeTextArguments(updateType)
    const predicate = (ctx: TContext) =>
      updateTypes.includes(ctx.updateType) ||
      // @ts-expect-error
      updateTypes.some((type) => ctx.updateSubTypes.includes(type))
    return Composer.optional(predicate, ...fns)
  }

  private static entity<TContext extends Context>(
    predicate: (entity: tt.MessageEntity, s: string, ctx: TContext) => boolean,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ): Middleware<TContext> {
    if (typeof predicate !== 'function') {
      const entityTypes = normalizeTextArguments(predicate)
      return Composer.entity(({ type }) => entityTypes.includes(type), ...fns)
    }
    return Composer.optional((ctx) => {
      const message = ctx.message ?? ctx.channelPost
      const entities = message?.entities ?? message?.caption_entities ?? []
      const text = message?.text ?? message?.caption
      if (text === undefined) return false
      return entities.some((entity) =>
        predicate(
          entity,
          text.substring(entity.offset, entity.offset + entity.length),
          ctx
        )
      )
    }, ...fns)
  }

  static entityText<TContext extends Context>(
    entityType: string,
    predicate: Triggers<TContext>,
    ...fns: NonemptyReadonlyArray<
      Middleware<TContext & { match: RegExpExecArray }>
    >
  ): Middleware<TContext> {
    if (fns.length === 0) {
      // prettier-ignore
      return Array.isArray(predicate)
        // @ts-expect-error
        ? Composer.entity(entityType, ...predicate)
        // @ts-expect-error
        : Composer.entity(entityType, predicate)
    }
    const triggers = normalizeTriggers(predicate)
    // @ts-expect-error
    return Composer.entity(({ type }, value, ctx) => {
      if (type !== entityType) {
        return false
      }
      for (const trigger of triggers) {
        // @ts-expect-error
        ctx.match = trigger(value, ctx)
        if (ctx.match) {
          return true
        }
      }
      return false
    }, ...fns)
  }

  static email<TContext extends Context>(
    email: string,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return Composer.entityText('email', email, ...fns)
  }

  static phone<TContext extends Context>(
    number: string,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return Composer.entityText('phone_number', number, ...fns)
  }

  static url<TContext extends Context>(
    url: string,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return Composer.entityText('url', url, ...fns)
  }

  static textLink<TContext extends Context>(
    link: string,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return Composer.entityText('text_link', link, ...fns)
  }

  static textMention<TContext extends Context>(
    mention: string,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return Composer.entityText('text_mention', mention, ...fns)
  }

  static mention<TContext extends Context>(
    mention: string,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return Composer.entityText(
      'mention',
      normalizeTextArguments(mention, '@'),
      ...fns
    )
  }

  static hashtag<TContext extends Context>(
    hashtag: string,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return Composer.entityText(
      'hashtag',
      normalizeTextArguments(hashtag, '#'),
      ...fns
    )
  }

  static cashtag<TContext extends Context>(
    cashtag: string,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return Composer.entityText(
      'cashtag',
      normalizeTextArguments(cashtag, '$'),
      ...fns
    )
  }

  private static match<TContext extends Context>(
    triggers: ReadonlyArray<
      (text: string, ctx: TContext) => RegExpExecArray | null
    >,
    ...fns: ReadonlyArray<Middleware<TContext & { match: RegExpExecArray }>>
  ): Middleware.Fn<TContext> {
    const handler = Composer.compose(fns)
    return (ctx, next) => {
      const text =
        ctx.message?.caption ??
        ctx.message?.text ??
        ctx.channelPost?.caption ??
        ctx.channelPost?.text ??
        ctx.callbackQuery?.data ??
        ctx.inlineQuery?.query
      if (text === undefined) return next()
      for (const trigger of triggers) {
        const match = trigger(text, ctx)
        if (match) {
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
    ...fns: ReadonlyArray<Middleware<TContext & { match: RegExpExecArray }>>
  ) {
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
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    if (fns.length === 0) {
      // @ts-expect-error
      return Composer.entity(['bot_command'], command)
    }
    const commands = normalizeTextArguments(command, '/')
    return Composer.mount(
      'text',
      Composer.lazy<TContext>((ctx) => {
        const groupCommands =
          ctx.me && ctx.chat?.type.endsWith('group')
            ? // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              commands.map((command) => `${command}@${ctx.me}`)
            : []
        return Composer.entity(
          ({ offset, type }, value) =>
            offset === 0 &&
            type === 'bot_command' &&
            (commands.includes(value) || groupCommands.includes(value)),
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
    ...fns: ReadonlyArray<Middleware<TContext & { match: RegExpExecArray }>>
  ) {
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
    ...fns: ReadonlyArray<Middleware<TContext & { match: RegExpExecArray }>>
  ) {
    return Composer.mount(
      'inline_query',
      Composer.match(normalizeTriggers(triggers), ...fns)
    )
  }

  static acl<TContext extends Context>(
    userId: MaybeArray<number>,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
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
  ) {
    const statuses = Array.isArray(status) ? status : [status]
    return Composer.optional(async (ctx) => {
      if (ctx.message === undefined) return false
      const member = await ctx.getChatMember(ctx.message.from!.id)
      return statuses.includes(member.status)
    }, ...fns)
  }

  static admin<TContext extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return Composer.memberStatus(['administrator', 'creator'], ...fns)
  }

  static creator<TContext extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return Composer.memberStatus('creator', ...fns)
  }

  static chatType<TContext extends Context>(
    type: MaybeArray<tt.ChatType>,
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    const types = Array.isArray(type) ? type : [type]
    // @ts-expect-error
    // prettier-ignore
    return Composer.optional((ctx) => ctx.chat && types.includes(ctx.chat.type), ...fns)
  }

  static privateChat<TContext extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return Composer.chatType('private', ...fns)
  }

  static groupChat<TContext extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return Composer.chatType(['group', 'supergroup'], ...fns)
  }

  static gameQuery<TContext extends Context>(
    ...fns: NonemptyReadonlyArray<Middleware<TContext>>
  ) {
    return Composer.optional(
      (ctx) => ctx.callbackQuery?.game_short_name !== undefined,
      ...fns
    )
  }

  static unwrap<TContext extends Context>(handler: Middleware<TContext>) {
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
      function execute(i: number, context: TContext): Promise<void> {
        if (!(context instanceof Context)) {
          // prettier-ignore
          return Promise.reject(new Error('next(ctx) called with invalid context'))
        }
        if (i <= index) {
          return Promise.reject(new Error('next() called multiple times'))
        }
        index = i
        const handler = middlewares[i] ? Composer.unwrap(middlewares[i]) : next
        if (!handler) {
          return Promise.resolve()
        }
        try {
          return Promise.resolve(
            handler(context, (ctx = context) => execute(i + 1, ctx))
          )
        } catch (err) {
          return Promise.reject(err)
        }
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
) {
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

export = Composer
