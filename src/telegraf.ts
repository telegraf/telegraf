import * as crypto from 'crypto'
import * as http from 'http'
import * as https from 'https'
import * as tt from './telegram-types'
import * as util from 'util'
import ApiClient from './core/network/client'
import { compactOptions } from './core/helpers/compact'
import Composer from './composer'
import Context from './context'
import d from 'debug'
import { DecayingDeque } from './core/processing/queue'
import generateCallback from './core/network/webhook'
import { Polling } from './core/network/polling'
import Telegram from './telegram'
import { TlsOptions } from 'tls'
import { URL } from 'url'
const debug = d('telegraf:main')

const DEFAULT_OPTIONS: Telegraf.Options<Context> = {
  telegram: {},
  handlerTimeout: 5000,
  contextType: Context,
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
    telegram?: Partial<ApiClient.Options>
  }

  export interface LaunchOptions {
    /** List the types of updates you want your bot to receive */
    allowedUpdates?: tt.UpdateType[]
    /**
     * **In long polling mode,** when your bot receives one or more updates,
     * `telegraf` calls the middleware stack and waits for it to complete before
     * calling `getUpdates` again. This is important: calling `getUpdates`
     * [confirms the previously received updates to Telegram via the `offset`
     * parameter](https://core.telegram.org/bots/api#getupdates), but if your
     * middleware crashes, you may want to request them again, which would
     * become impossible then.
     *
     * The `concurrency` flag (default: `false`) allows you to adjust this
     * behavior. It determines the maximum number of updates your bot may
     * already be processing concurrently before making the next `getUpdates`
     * request. The higher the number, the earlier `telegraf` will make the next
     * request. **Caution:** setting this value to anything greater than `1` may
     * cause your bot to miss updates if it crashes!
     *
     * **In webhook mode,** it is possible to receive old updates again while
     * new ones have already been processed, so this is not an issue. The flag
     * behaves exactly the same way, but its default value is `true`. If you set
     * it to a lower value, `telegraf` will simply not answer the HTTP requests
     * until enough of your middleware completed.
     *
     * `false` is an alias for `1`. `true` is an alias for `Infinity`. Values
     * below `1` will be interpreted as `1`.
     */
    concurrency?: boolean | number
    /** Configuration options for when the bot is run via long polling */
    polling?: {
      /** Determines the timout of the `getUpdates` calls */
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

interface Task<C extends Context> {
  ctx: C
  webhookResponse?: http.ServerResponse
}

export class Telegraf<C extends Context = Context> extends Composer<C> {
  private readonly options: Telegraf.Options<C>
  private webhookServer?: http.Server | https.Server
  private polling?: Polling
  /** Set manually to avoid implicit `getMe` call in `launch` or `webhookCallback` */
  public botInfo?: tt.UserFromGetMe
  public telegram: Telegram
  readonly context: Partial<C> = {}
  private updateQueue: DecayingDeque<Task<C>> | undefined

  private handleError = async (err: unknown, ctx: C): Promise<void> => {
    // set exit code to emulate `warn-with-error-code` behavior of
    // https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
    // to prevent a clean exit despite an error being thrown
    process.exitCode = 1
    throw err
  }

  private handleTimeout = (ctx: C, middleware: Promise<void>): void => {
    middleware.finally(() =>
      debug(
        'Middleware completed after timeout for update',
        ctx.update.update_id
      )
    )
    // set exit code to emulate `warn-with-error-code` behavior of
    // https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
    // to prevent a clean exit despite an error being thrown
    process.exitCode = 1
    throw new Error(`Timeout in middleware for update ${ctx.update.update_id}`)
  }

  constructor(token: string, options?: Partial<Telegraf.Options<C>>) {
    super()
    // @ts-expect-error
    this.options = {
      ...DEFAULT_OPTIONS,
      ...compactOptions(options),
    }
    this.telegram = new Telegram(token, this.options.telegram)
  }

  private get token() {
    return this.telegram.token
  }

  set webhookReply(webhookReply: boolean) {
    this.telegram.webhookReply = webhookReply
  }

  get webhookReply() {
    return this.telegram.webhookReply
  }

  catch(handler: (err: unknown, ctx: C) => Promise<void>) {
    this.handleError = handler
    return this
  }

  catchTimeout(handler: (ctx: C, middleware: Promise<void>) => void) {
    this.handleTimeout = handler
    return this
  }

  webhookCallback(path = '/') {
    return generateCallback(
      path,
      async (update: tt.Update, res: http.ServerResponse) => {
        await this.handleUpdates([update], res)
      },
      debug
    )
  }

  private startPolling(allowedUpdates: tt.UpdateType[] = []) {
    const polling = (this.polling = new Polling(this.telegram, allowedUpdates))
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    polling.loop(async (updates) => {
      const capacity = await this.handleUpdates(updates)
      // request at least 10 updates, or undefined (=100) if unknown
      polling.limit = capacity === undefined || capacity > 10 ? capacity : 10
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
    this.webhookServer = tlsOptions
      ? https.createServer(tlsOptions, callback)
      : http.createServer(callback)
    this.webhookServer.listen(port, host, () => {
      debug('Webhook listening on port: %s', port)
    })
    return this
  }

  initializeQueue(concurrency: boolean | number) {
    this.updateQueue ??= new DecayingDeque(
      this.options.handlerTimeout,
      (t: Task<C>) => this.invokeMiddleware(t),
      concurrency,
      (err: unknown, t: Task<C>) => this.handleError(err, t.ctx),
      (t: Task<C>, p: Promise<void>) => this.handleTimeout(t.ctx, p)
    )
  }

  async launch(config: Telegraf.LaunchOptions = {}) {
    this.initializeQueue(config.concurrency ?? config.webhook !== undefined)

    debug('Connecting to Telegram')
    this.botInfo ??= await this.telegram.getMe()
    debug(`Launching @${this.botInfo.username}`)
    if (config.webhook === undefined) {
      await this.telegram.deleteWebhook()
      this.startPolling(config.allowedUpdates)
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

  async handleUpdate(update: tt.Update, webhookResponse?: http.ServerResponse) {
    await this.handleUpdates([update], webhookResponse)
  }

  private botInfoCall?: Promise<tt.UserFromGetMe>
  private async handleUpdates(
    updates: readonly tt.Update[],
    webhookResponse?: http.ServerResponse
  ) {
    if (!Array.isArray(updates)) {
      throw new TypeError(util.format('Updates must be an array, got', updates))
    }
    const botInfo = (this.botInfo ??=
      (debug(
        'Updates are waiting for `botInfo` to be initialized:',
        ...updates.map((u) => u.update_id)
      ),
      await (this.botInfoCall ??= this.telegram.getMe())))

    const tasks: Array<Task<C>> = updates.map((update) => {
      const tg = new Telegram(
        this.token,
        this.telegram.options,
        webhookResponse
      )
      const TelegrafContext = this.options.contextType
      const ctx = new TelegrafContext(update, tg, botInfo)
      Object.assign(ctx, this.context)
      return { ctx, webhookResponse }
    })
    return await this.updateQueue?.add(tasks)
  }

  private async invokeMiddleware(t: Task<C>): Promise<void> {
    try {
      await this.middleware()(t.ctx, anoop)
    } finally {
      if (t.webhookResponse?.writableEnded === false) t.webhookResponse?.end()
    }
  }
}
