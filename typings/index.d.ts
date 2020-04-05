import { BaseScene, Stage } from './stage'
import { Composer, Middleware } from './composer'
import { ContextMessageUpdate } from './context'
import { Extra } from './extra'
import { Markup } from './markup'
import { Router } from './router'
import { session } from './session'
import { Telegram } from './telegram'

// works around https://github.com/microsoft/TypeScript/issues/37712
import { Telegraf as _Telegraf } from './telegraf'
declare class Telegraf<TContext extends ContextMessageUpdate> extends _Telegraf<
  TContext
> {}

declare namespace Telegraf {
  export {
    BaseScene,
    Composer,
    ContextMessageUpdate as Context,
    Extra,
    Markup,
    Middleware,
    Router,
    session,
    Stage,
    Telegram,
  }
}

export = Telegraf
