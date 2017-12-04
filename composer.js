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

  mention (...args) {
    return this.use(Composer.mention(...args))
  }

  hashtag (...args) {
    return this.use(Composer.hashtag(...args))
  }

  start (...fns) {
    return this.command('start', ...fns)
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

  static hears (triggers, ...fns) {
    return Composer.mount('text', Composer.match(normalizeTriggers(triggers), ...fns))
  }

  static entity (predicate, ...fns) {
    if (typeof predicate !== 'function') {
      const entityTypes = normalizeTextArguments(predicate)
      return Composer.entity(({ type }) => entityTypes.includes(type), ...fns)
    }
    return Composer.optional(({ message }) =>
      message &&
      message.entities &&
      message.entities.some((entity) => predicate(entity, message.text.substring(entity.offset, entity.offset + entity.length)))
      , ...fns)
  }

  static mention (username, ...fns) {
    if (fns.length === 0) {
      return Composer.entity(['mention'], username)
    }
    const usernames = normalizeTextArguments(username, '@')
    return Composer.entity(({ type }, value) => type === 'mention' && usernames.includes(value), ...fns)
  }

  static hashtag (hashtag, ...fns) {
    if (fns.length === 0) {
      return Composer.entity(['hashtag'], hashtag)
    }
    const hashtags = normalizeTextArguments(hashtag, '#')
    return Composer.entity(({ type }, value) => type === 'hashtag' && hashtags.includes(value), ...fns)
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

  static match (triggers, ...fns) {
    return Composer.lazy((ctx) => {
      const text = (
        (ctx.message && (ctx.message.caption || ctx.message.text)) ||
        (ctx.callbackQuery && ctx.callbackQuery.data)
      )
      for (let trigger of triggers) {
        ctx.match = trigger(text, ctx)
        if (ctx.match) {
          return Composer.compose(fns)
        }
      }
      return Composer.safePassThru()
    })
  }

  static acl (userId, ...fns) {
    if (typeof userId === 'function') {
      return Composer.optional(userId, ...fns)
    }
    const allowed = Array.isArray(userId) ? userId : [userId]
    return Composer.optional((ctx) => !ctx.from || allowed.includes(ctx.from.id), ...fns)
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
    .filter((item) => item)
    .map((arg) => arg && prefix && !arg.startsWith(prefix) ? `${prefix}${arg}` : arg)
}

module.exports = Composer
