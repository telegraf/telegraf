import * as crypto from 'crypto'
import * as http from 'http'
import * as https from 'https'
import * as tt from './telegram-types'
import * as util from 'util'
import { Composer, MaybePromise } from './composer'
import ApiClient from './core/network/client'
import { compactOptions } from './core/helpers/compact'
import Context from './context'
import d from 'debug'
import generateCallback from './core/network/webhook'
import { Polling } from './core/network/polling'
import pTimeout from 'p-timeout'
import Telegram from './telegram'
import { TlsOptions } from 'tls'
import { URL } from 'url'
const debug = d('telegraf:main')

const DEFAULT_OPTIONS: Telegraf.Options<Context> = {
  handlerTimeout: 5000,
  contextType: Context,
  concurrency: false,
}

function always<T>(x: T) {
  return () => x
}
const anoop = always(Promise.resolve())

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Telegraf {
  export interface Options<TContext extends Context> {
    contextType: new (
      ...args: ConstructorParameters<typeof Context>
    ) => TContext
    handlerTimeout: number
    concurrency: boolean | number
    telegram?: Partial<ApiClient.Options>
  }

  export interface LaunchOptions {
    /** List the types of updates you want your bot to receive */
    allowedUpdates?: tt.UpdateType[]
    /** Configuration options for when the bot is run via long polling */
    polling?: {
      timeout?: number
    }
    /** Configuration options for when the bot is run via webhooks */
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

export class Telegraf<C extends Context = Context> extends Composer<C> {
  private readonly options: Telegraf.Options<C>
  private webhookServer?: http.Server | https.Server
  private polling?: Polling
  /** Set manually to avoid implicit `getMe` call in `launch` or `webhookCallback` */
  public botInfo?: tt.UserFromGetMe
  public telegram: Telegram
  readonly context: Partial<C> = {}

  private handleError = (err: unknown, ctx: C): MaybePromise<void> => {
    // set exit code to emulate `warn-with-error-code` behavior of
    // https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
    // to prevent a clean exit despite an error being thrown
    process.exitCode = 1
    console.error('Unhandled error while processing', ctx.update)
    throw err
  }

  private processing = 0
  private readonly concurrency: number
  private subscribers: Array<(capacity: number) => void> = []

  constructor(token: string, options?: Partial<Telegraf.Options<C>>) {
    super()
    // @ts-expect-error
    this.options = {
      ...DEFAULT_OPTIONS,
      ...compactOptions(options),
    }
    this.telegram = new Telegram(token, this.options.telegram)

    const concurrency = this.options.concurrency
    if (concurrency === false) this.concurrency = 1
    else if (concurrency === true) this.concurrency = Infinity
    else this.concurrency = Math.max(1, concurrency)
  }

  private get token() {
    return this.telegram.token
  }

  /** @deprecated use `ctx.telegram.webhookReply` */
  set webhookReply(webhookReply: boolean) {
    this.telegram.webhookReply = webhookReply
  }

  get webhookReply() {
    return this.telegram.webhookReply
  }

  /**
   * _Override_ error handling
   */
  catch(handler: (err: unknown, ctx: C) => MaybePromise<void>) {
    this.handleError = handler
    return this
  }

  webhookCallback(path = '/') {
    return generateCallback(
      path,
      async (update: tt.Update, res: http.ServerResponse) => {
        await this.handleUpdate(update, res)
      }
    )
  }

  private startPolling(allowedUpdates: tt.UpdateType[] = [], timeout = 50) {
    const polling = (this.polling = new Polling(
      this.telegram,
      allowedUpdates,
      timeout
    ))
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    polling.loop(async (updates) => {
      const capacity = await this.handleUpdates(updates)
      // request at least 10 updates but no more than 5000
      polling.limit = Math.max(10, Math.min(5000, capacity))
    })
  }

  private startWebhook(
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
      tlsOptions !== undefined
        ? https.createServer(tlsOptions, callback)
        : http.createServer(callback)
    this.webhookServer.listen(port, host, () => {
      debug('Webhook listening on port: %s', port)
    })
    return this
  }

  async launch(config: Telegraf.LaunchOptions = {}) {
    debug('Connecting to Telegram')
    this.botInfo ??= await this.telegram.getMe()
    debug(`Launching @${this.botInfo.username}`)
    if (config.webhook === undefined) {
      await this.telegram.deleteWebhook()
      this.startPolling(config.allowedUpdates, config.polling?.timeout)
      debug('Bot started with long polling')
      return
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
    if (!domain) {
      debug('Bot started with webhook')
      return
    }
    await this.telegram.setWebhook(`https://${domain}${hookPath}`, {
      allowed_updates: config.allowedUpdates,
    })
    debug(`Bot started with webhook @ https://${domain}`)
  }

  stop(reason = 'unspecified') {
    debug('Stopping bot... Reason:', reason)
    // https://github.com/telegraf/telegraf/pull/1224#issuecomment-742693770
    if (this.polling === undefined && this.webhookServer === undefined) {
      throw new Error('Bot is not running!')
    }
    this.webhookServer?.close()
    this.polling?.stop()
  }

  private async handleUpdates(updates: readonly tt.Update[]) {
    if (!Array.isArray(updates)) {
      throw new TypeError(util.format('Updates must be an array, got', updates))
    }
    await Promise.all(updates.map((update) => this.handleUpdate(update)))
    return await this.bored()
  }

  private botInfoCall?: Promise<tt.UserFromGetMe>
  async handleUpdate(update: tt.Update, webhookResponse?: http.ServerResponse) {
    this.botInfo ??=
      (debug(
        'Update %d is waiting for `botInfo` to be initialized',
        update.update_id
      ),
      await (this.botInfoCall ??= this.telegram.getMe()))
    debug('Processing update', update.update_id)
    const tg = new Telegram(this.token, this.telegram.options, webhookResponse)
    const TelegrafContext = this.options.contextType
    const ctx = new TelegrafContext(update, tg, this.botInfo)
    Object.assign(ctx, this.context)
    this.invokeMiddleware(ctx, webhookResponse)
    return await this.bored()
  }

  private invokeMiddleware(ctx: C, webhookResponse?: http.ServerResponse) {
    this.processing++
    pTimeout(
      Promise.resolve(this.middleware()(ctx, anoop)),
      this.options.handlerTimeout
    )
      .catch((err) => this.handleError(err, ctx))
      .finally(() => {
        this.processing--
        const capacity = this.capacity()
        if (capacity > 0) {
          this.subscribers.forEach((resolve) => resolve(capacity))
          this.subscribers = []
        }
        if (webhookResponse !== undefined && !webhookResponse.writableEnded) {
          webhookResponse.end()
        }
      })
  }

  /**
   * Number of additional updates that may be processed until the `concurrency`
   * limit is reached
   */
  capacity() {
    return this.concurrency - this.processing
  }

  /**
   * The returned promise resolves with the value of `this.capacity()` once it
   * becomes positive
   */
  bored(): Promise<number> {
    return new Promise((resolve) => {
      const capacity = this.capacity()
      // Resolve immediately if there is free space, otherwise postpone this
      if (capacity > 0) resolve(capacity)
      else this.subscribers.push(resolve)
    })
  }
}
