const TelegrafContext = require('./core/context')

class Composer {
  constructor (...fns) {
    this.handler = Composer.compose(fns)
  }

  use (...fns) {
    this.handler = Composer.compose([this.handler, ...fns])
    return this
  }

  on (updateTypes, ...fns) {
    return this.use(Composer.mount(updateTypes, ...fns))
  }

  hears (triggers, ...fns) {
    return this.use(Composer.hears(triggers, ...fns))
  }

  command (commands, ...fns) {
    return this.use(Composer.command(commands, ...fns))
  }

  action (triggers, ...fns) {
    return this.use(Composer.action(triggers, ...fns))
  }

  inlineQuery (triggers, ...fns) {
    return this.use(Composer.inlineQuery(triggers, ...fns))
  }

  gameQuery (...fns) {
    return this.use(Composer.gameQuery(...fns))
  }

  drop (predicate) {
    return this.use(Composer.drop(predicate))
  }

  filter (predicate) {
    return this.use(Composer.filter(predicate))
  }

  entity (...args) {
    return this.use(Composer.entity(...args))
  }

  email (...args) {
    return this.use(Composer.email(...args))
  }

  url (...args) {
    return this.use(Composer.url(...args))
  }

  textLink (...args) {
    return this.use(Composer.textLink(...args))
  }

  textMention (...args) {
    return this.use(Composer.textMention(...args))
  }

  mention (...args) {
    return this.use(Composer.mention(...args))
  }

  phone (...args) {
    return this.use(Composer.phone(...args))
  }

  hashtag (...args) {
    return this.use(Composer.hashtag(...args))
  }

  cashtag (...args) {
    return this.use(Composer.cashtag(...args))
  }

  start (...fns) {
    return this.command('start', Composer.tap((ctx) => {
      ctx.startPayload = ctx.message.text.substring(7)
    }), ...fns)
  }

  help (...fns) {
    return this.command('help', ...fns)
  }

  settings (...fns) {
    return this.command('settings', ...fns)
  }

  middleware () {
    return this.handler
  }

  static reply (...args) {
    return (ctx) => ctx.reply(...args)
  }

  static fork (middleware) {
    return (ctx, next) => {
      setImmediate(Composer.unwrap(middleware), ctx, Composer.safePassThru())
      return next(ctx)
    }
  }

  static tap (middleware) {
    const handler = Composer.unwrap(middleware)
    return (ctx, next) => Promise.resolve(handler(ctx, Composer.safePassThru())).then(() => next(ctx))
  }

  static passThru () {
    return (ctx, next) => next(ctx)
  }

  static safePassThru () {
    return (ctx, next) => typeof next === 'function' ? next(ctx) : Promise.resolve()
  }

  static lazy (factoryFn) {
    if (typeof factoryFn !== 'function') {
      throw new Error('Argument must be a function')
    }
    return (ctx, next) => Promise.resolve(factoryFn(ctx))
      .then((middleware) => Composer.unwrap(middleware)(ctx, next))
  }

  static log (logFn = console.log) {
    return Composer.fork((ctx) => logFn(JSON.stringify(ctx.update, null, 2)))
  }

  static branch (predicate, trueMiddleware, falseMiddleware) {
    if (typeof predicate !== 'function') {
      return predicate ? trueMiddleware : falseMiddleware
    }
    return Composer.lazy((ctx) => Promise.resolve(predicate(ctx))
      .then((value) => value ? trueMiddleware : falseMiddleware))
  }

  static optional (predicate, ...fns) {
    return Composer.branch(predicate, Composer.compose(fns), Composer.safePassThru())
  }

  static filter (predicate) {
    return Composer.branch(predicate, Composer.safePassThru(), () => { })
  }

  static drop (predicate) {
    return Composer.branch(predicate, () => { }, Composer.safePassThru())
  }

  static dispatch (routeFn, handlers) {
    return typeof routeFn === 'function'
      ? Composer.lazy((ctx) => Promise.resolve(routeFn(ctx)).then((value) => handlers[value]))
      : handlers[routeFn]
  }

  static mount (updateType, ...fns) {
    const updateTypes = normalizeTextArguments(updateType)
    const predicate = (ctx) => updateTypes.includes(ctx.updateType) || updateTypes.some((type) => ctx.updateSubTypes.includes(type))
    return Composer.optional(predicate, ...fns)
  }

  static entity (predicate, ...fns) {
    if (typeof predicate !== 'function') {
      const entityTypes = normalizeTextArguments(predicate)
      return Composer.entity(({ type }) => entityTypes.includes(type), ...fns)
    }
    return Composer.optional((ctx) => {
      const message = ctx.message || ctx.channelPost
      const entities = message && (message.entities || message.caption_entities)
      const text = message && (message.text || message.caption)
      return entities && entities.some((entity) =>
        predicate(entity, text.substring(entity.offset, entity.offset + entity.length), ctx)
      )
    }, ...fns)
  }

  static entityText (entityType, predicate, ...fns) {
    if (fns.length === 0) {
      return Array.isArray(predicate)
        ? Composer.entity(entityType, ...predicate)
        : Composer.entity(entityType, predicate)
    }
    const triggers = normalizeTriggers(predicate)
    return Composer.entity(({ type }, value, ctx) => {
      if (type !== entityType) {
        return false
      }
      for (let trigger of triggers) {
        ctx.match = trigger(value, ctx)
        if (ctx.match) {
          return true
        }
      }
    }, ...fns)
  }

  static email (email, ...fns) {
    return Composer.entityText('email', email, ...fns)
  }

  static phone (number, ...fns) {
    return Composer.entityText('phone_number', number, ...fns)
  }

  static url (url, ...fns) {
    return Composer.entityText('url', url, ...fns)
  }

  static textLink (link, ...fns) {
    return Composer.entityText('text_link', link, ...fns)
  }

  static textMention (mention, ...fns) {
    return Composer.entityText('text_mention', mention, ...fns)
  }

  static mention (mention, ...fns) {
    return Composer.entityText('mention', normalizeTextArguments(mention, '@'), ...fns)
  }

  static hashtag (hashtag, ...fns) {
    return Composer.entityText('hashtag', normalizeTextArguments(hashtag, '#'), ...fns)
  }

  static cashtag (cashtag, ...fns) {
    return Composer.entityText('cashtag', normalizeTextArguments(cashtag, '$'), ...fns)
  }

  static match (triggers, ...fns) {
    return Composer.optional((ctx) => {
      const text = (
        (ctx.message && (ctx.message.caption || ctx.message.text)) ||
        (ctx.callbackQuery && ctx.callbackQuery.data) ||
        (ctx.inlineQuery && ctx.inlineQuery.query)
      )
      for (let trigger of triggers) {
        ctx.match = trigger(text, ctx)
        if (ctx.match) {
          return true
        }
      }
    }, ...fns)
  }

  static hears (triggers, ...fns) {
    return Composer.mount('text', Composer.match(normalizeTriggers(triggers), ...fns))
  }

  static command (command, ...fns) {
    if (fns.length === 0) {
      return Composer.entity(['bot_command'], command)
    }
    const commands = normalizeTextArguments(command, '/')
    return Composer.mount('text', Composer.lazy((ctx) => {
      const groupCommands = ctx.me && (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup')
        ? commands.map((command) => `${command}@${ctx.me}`)
        : []
      return Composer.entity(({ offset, type }, value) =>
        offset === 0 &&
        type === 'bot_command' &&
        (commands.includes(value) || groupCommands.includes(value))
      , ...fns)
    }))
  }

  static action (triggers, ...fns) {
    return Composer.mount('callback_query', Composer.match(normalizeTriggers(triggers), ...fns))
  }

  static inlineQuery (triggers, ...fns) {
    return Composer.mount('inline_query', Composer.match(normalizeTriggers(triggers), ...fns))
  }

  static acl (userId, ...fns) {
    if (typeof userId === 'function') {
      return Composer.optional(userId, ...fns)
    }
    const allowed = Array.isArray(userId) ? userId : [userId]
    return Composer.optional((ctx) => !ctx.from || allowed.includes(ctx.from.id), ...fns)
  }

  static memberStatus (status, ...fns) {
    const statuses = Array.isArray(status) ? status : [status]
    return Composer.optional((ctx) => ctx.message && ctx.getChatMember(ctx.message.from.id)
      .then(member => member && statuses.includes(member.status))
    , ...fns)
  }

  static admin (...fns) {
    return Composer.memberStatus(['administrator', 'creator'], ...fns)
  }

  static creator (...fns) {
    return Composer.memberStatus('creator', ...fns)
  }

  static chatType (type, ...fns) {
    const types = Array.isArray(type) ? type : [type]
    return Composer.optional((ctx) => ctx.chat && types.includes(ctx.chat.type), ...fns)
  }

  static privateChat (...fns) {
    return Composer.chatType('private', ...fns)
  }

  static groupChat (...fns) {
    return Composer.chatType(['group', 'supergroup'], ...fns)
  }

  static gameQuery (...fns) {
    return Composer.mount('callback_query', Composer.optional((ctx) => ctx.callbackQuery.game_short_name, ...fns))
  }

  static unwrap (handler) {
    return handler && typeof handler.middleware === 'function'
      ? handler.middleware()
      : handler
  }

  static compose (middlewares) {
    if (!Array.isArray(middlewares)) {
      throw new Error('Middlewares must be an array')
    }
    if (middlewares.length === 0) {
      return Composer.safePassThru()
    }
    if (middlewares.length === 1) {
      return Composer.unwrap(middlewares[0])
    }
    return (ctx, next) => {
      let index = -1
      return execute(0, ctx)
      function execute (i, context) {
        if (!(context instanceof TelegrafContext)) {
          return Promise.reject(new Error('next(ctx) called with invalid context'))
        }
        if (i <= index) {
          return Promise.reject(new Error('next() called multiple times'))
        }
        index = i
        const handler = Composer.unwrap(middlewares[i]) || next
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

function normalizeTriggers (triggers) {
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
      return (value) => {
        trigger.lastIndex = 0
        return trigger.exec(value || '')
      }
    }
    return (value) => trigger === value ? value : null
  })
}

function normalizeTextArguments (argument, prefix) {
  const args = Array.isArray(argument) ? argument : [argument]
  return args
    .filter(Boolean)
    .map((arg) => prefix && typeof arg === 'string' && !arg.startsWith(prefix) ? `${prefix}${arg}` : arg)
}

module.exports = Composer
