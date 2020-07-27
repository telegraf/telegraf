import type * as tt from '../typings/telegram-types'
import type ApiClient from './core/network/client'
import BaseScene from './scenes/base'
import Composer from './composer'
import Context from './context'
import crypto from 'crypto'
import Debug from 'debug'
import Extra from './extra'
import generateCallback from './core/network/webhook'
import http from 'http'
import https from 'https'
import Markup from './markup'
import { promisify } from 'util'
import Router from './router'
import session from './session'
import Stage from './stage'
import Telegram from './telegram'
import type { TlsOptions } from 'tls'
import { URL } from 'url'

const debug = Debug('telegraf:core')

const DEFAULT_OPTIONS: Telegraf.Options<any> = {
  telegram: {},
  retryAfter: 1,
  handlerTimeout: 0,
  channelMode: false,
  contextType: Context,
}

const noop: () => void = () => undefined
function always<T>(x: T) {
  return () => x
}
const anoop = always(Promise.resolve())
const sleep = promisify(setTimeout)

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Telegraf {
  export interface Options<TContext extends Context> {
    channelMode: boolean
    contextType: new (
      ...args: ConstructorParameters<typeof Context>
    ) => TContext
    handlerTimeout: number
    retryAfter: number
    telegram: Partial<ApiClient.Options>
    username?: string
  }

  export interface LaunchOptions {
    polling?: {
      timeout?: number

      /** Limits the number of updates to be retrieved in one call */
      limit?: number

      /** List the types of updates you want your bot to receive */
      allowedUpdates?: tt.UpdateType[]

      stopCallback?: () => void
    }
    webhook?: {
      /** Public domain for webhook. If domain is not specified, hookPath should contain a domain name as well (not only path component). */
      domain?: string

      /** Webhook url path; will be automatically generated if not specified */
      hookPath?: string

      host?: string
      port?: number

      /** TLS server options. Omit to use http. */
      tlsOptions?: TlsOptions

      cb?: http.RequestListener
    }
  }
}

const allowedUpdates: tt.UpdateType[] | undefined = undefined

// eslint-disable-next-line no-redeclare
class Telegraf<TContext extends Context = Context> extends Composer<TContext> {
  private readonly options: Telegraf.Options<TContext>
  private webhookServer?: http.Server | https.Server
  public telegram: Telegram
  readonly context: Partial<TContext> = {}
  private readonly polling = {
    allowedUpdates,
    limit: 100,
    offset: 0,
    started: false,
    stopCallback: noop,
    timeout: 30,
  }

  handleError: (err: any, ctx: TContext) => void = (err) => {
    console.error()
    console.error(
      ('stack' in err ? err.stack : err.toString()).replace(/^/gm, '  ')
    )
    console.error()
    throw err
  }

  constructor(token: string, options?: Partial<Telegraf.Options<TContext>>) {
    super()
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    }
    this.telegram = new Telegram(token, this.options.telegram)
  }

  set token(token: string) {
    this.telegram.token = token
  }

  get token() {
    return this.telegram.token
  }

  set webhookReply(webhookReply: boolean) {
    this.telegram.webhookReply = webhookReply
  }

  get webhookReply() {
    return this.telegram.webhookReply
  }

  catch(handler: (err: any, ctx: TContext) => void) {
    this.handleError = handler
    return this
  }

  webhookCallback(path = '/') {
    return generateCallback(
      path,
      (update, res) => this.handleUpdate(update, res),
      debug
    )
  }

  startPolling(
    timeout = 30,
    limit = 100,
    allowedUpdates?: tt.UpdateType[] | tt.UpdateType,
    stopCallback = noop
  ) {
    this.polling.timeout = timeout
    this.polling.limit = limit
    this.polling.allowedUpdates =
      allowedUpdates != null
        ? Array.isArray(allowedUpdates)
          ? allowedUpdates
          : [allowedUpdates]
        : undefined
    this.polling.stopCallback = stopCallback
    if (!this.polling.started) {
      this.polling.started = true
      this.fetchUpdates()
    }
    return this
  }

  startWebhook(
    hookPath: string,
    tlsOptions?: TlsOptions,
    port?: number,
    host?: string,
    cb?: http.RequestListener
  ) {
    const webhookCb = this.webhookCallback(hookPath)
    const callback: http.RequestListener =
      typeof cb === 'function'
        ? (req, res) => webhookCb(req, res, () => cb(req, res))
        : webhookCb
    this.webhookServer =
      tlsOptions != null
        ? https.createServer(tlsOptions, callback)
        : http.createServer(callback)
    this.webhookServer.listen(port, host, () => {
      debug('Webhook listening on port: %s', port)
    })
    return this
  }

  launch(config: Telegraf.LaunchOptions = {}) {
    debug('Connecting to Telegram')
    return this.telegram.getMe().then((botInfo) => {
      debug(
        `Launching ${botInfo.username == null ? 'bot' : '@' + botInfo.username}`
      )
      this.options.username = botInfo.username
      this.context.botInfo = botInfo
      if (config.webhook == null) {
        const { timeout, limit, allowedUpdates, stopCallback } =
          config.polling ?? {}
        return this.telegram
          .deleteWebhook()
          .then(() =>
            this.startPolling(timeout, limit, allowedUpdates, stopCallback)
          )
          .then(() => debug('Bot started with long-polling'))
      }
      if (
        typeof config.webhook.domain !== 'string' &&
        typeof config.webhook.hookPath !== 'string'
      ) {
        throw new Error('Webhook domain or webhook path is required')
      }
      let domain = config.webhook.domain ?? ''
      if (domain.startsWith('https://') || domain.startsWith('http://')) {
        domain = new URL(domain).host
      }
      const hookPath =
        config.webhook.hookPath ??
        `/telegraf/${crypto.randomBytes(32).toString('hex')}`
      const { port, host, tlsOptions, cb } = config.webhook
      this.startWebhook(hookPath, tlsOptions, port, host, cb)
      if (domain == null) {
        debug('Bot started with webhook')
        return
      }
      return this.telegram
        .setWebhook(`https://${domain}${hookPath}`)
        .then(() => debug(`Bot started with webhook @ https://${domain}`))
    })
  }

  stop(cb = noop) {
    debug('Stopping bot...')
    return new Promise((resolve) => {
      if (this.webhookServer != null) {
        return this.webhookServer.close(resolve)
      } else if (!this.polling.started) {
        return resolve()
      }
      this.polling.stopCallback = resolve
      this.polling.started = false
    }).then(cb)
  }

  handleUpdates(updates: readonly tt.Update[]) {
    if (!Array.isArray(updates)) {
      return Promise.reject(new Error('Updates must be an array'))
    }
    const processAll = Promise.all(
      updates.map((update) => this.handleUpdate(update))
    )
    if (this.options.handlerTimeout === 0) {
      return processAll
    }
    return Promise.race([processAll, sleep(this.options.handlerTimeout)])
  }

  async handleUpdate(update: tt.Update, webhookResponse?) {
    debug('Processing update', update.update_id)
    const tg = new Telegram(this.token, this.telegram.options, webhookResponse)
    const TelegrafContext = this.options.contextType
    const ctx = new TelegrafContext(update, tg, this.options)
    Object.assign(ctx, this.context)
    try {
      await this.middleware()(ctx, anoop)
    } catch (err) {
      return this.handleError(err, ctx)
    }
  }

  fetchUpdates() {
    if (!this.polling.started) {
      this.polling?.stopCallback()
      return
    }
    const { timeout, limit, offset, allowedUpdates } = this.polling
    this.telegram
      .getUpdates(timeout, limit, offset, allowedUpdates)
      .catch((err) => {
        if (err.code === 401 || err.code === 409) {
          throw err
        }
        const wait =
          typeof 'retry_after' in err.parameters
            ? Number(err.parameters.retry_after)
            : this.options.retryAfter
        console.error(`Failed to fetch updates. Waiting: ${wait}s`, err.message)
        return sleep(wait * 1000, [])
      })
      .then((updates) =>
        this.polling.started
          ? this.handleUpdates(updates).then(() => updates)
          : []
      )
      .catch((err) => {
        console.error('Failed to process updates.', err)
        this.polling.started = false
        this.polling.offset = 0
        return []
      })
      .then((updates) => {
        if (updates.length > 0) {
          this.polling.offset = updates[updates.length - 1].update_id + 1
        }
        this.fetchUpdates()
      })
      .catch(noop)
  }
}

export = Object.assign(Telegraf, {
  Context,
  Composer,
  default: Telegraf,
  Extra,
  Markup,
  Router,
  Telegraf,
  Telegram,
  Stage,
  BaseScene,
  session,
})
