import * as crypto from 'crypto'
import * as http from 'http'
import * as https from 'https'
import * as tg from './core/types/typegram'
import * as tt from './telegram-types'
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
import safeCompare = require('safe-compare')
const debug = d('telegraf:main')

const DEFAULT_OPTIONS: Telegraf.Options<Context> = {
  telegram: {},
  handlerTimeout: 90_000, // 90s in ms
  contextType: Context,
}

function always<T>(x: T) {
  return () => x
}

const anoop = always(Promise.resolve())

// eslint-disable-next-line
export namespace Telegraf {
  export interface Options<TContext extends Context> {
    contextType: new (
      ...args: ConstructorParameters<typeof Context>
    ) => TContext
    handlerTimeout: number
    telegram?: Partial<ApiClient.Options>
  }

  export interface LaunchOptions {
    dropPendingUpdates?: boolean
    /** List the types of updates you want your bot to receive */
    allowedUpdates?: tt.UpdateType[]
    /** Configuration options for when the bot is run via webhooks */
    webhook?: {
      /** Public domain for webhook. */
      domain: string

      /** Webhook url path; will be automatically generated if not specified */
      hookPath?: string

      host?: string
      port?: number

      /** The fixed IP address which will be used to send webhook requests instead of the IP address resolved through DNS */
      ipAddress?: string

      /**
       * Maximum allowed number of simultaneous HTTPS connections to the webhook for update delivery, 1-100. Defaults to 40.
       * Use lower values to limit the load on your bot's server, and higher values to increase your bot's throughput.
       */
      maxConnections?: number

      /** TLS server options. Omit to use http. */
      tlsOptions?: TlsOptions

      secretToken?: string

      cb?: http.RequestListener
    }
  }
}

const TOKEN_HEADER = 'x-telegram-bot-api-secret-token'

export class Telegraf<C extends Context = Context> extends Composer<C> {
  private readonly options: Telegraf.Options<C>
  private webhookServer?: http.Server | https.Server
  private polling?: Polling
  /** Set manually to avoid implicit `getMe` call in `launch` or `webhookCallback` */
  public botInfo?: tg.UserFromGetMe
  public telegram: Telegram
  readonly context: Partial<C> = {}

  /** Assign to this to customise the webhook filter middleware.
   * `{ hookPath, secretToken }` will be bound to this rather than the Telegraf instance.
   * Remember to assign a regular function and not an arrow function so it's bindable.
   */
  public webhookFilter = function (
    // NOTE: this function is assigned to a variable instead of being a method to signify that it's assignable
    // NOTE: the `this` binding is so custom impls don't need to double wrap
    this: { hookPath: string; secretToken?: string },
    req: http.IncomingMessage
  ) {
    const debug = d('telegraf:webhook')

    if (req.method === 'POST') {
      if (safeCompare(this.hookPath, req.url as string)) {
        // no need to check if secret_token was not set
        if (!this.secretToken) return true
        else {
          const token = req.headers[TOKEN_HEADER] as string
          if (safeCompare(token, this.secretToken)) return true
          else debug('Secret token does not match:', token, this.secretToken)
        }
      } else debug('Path does not match:', req.url, this.hookPath)
    } else debug('Unexpected request method, not POST. Received:', req.method)

    return false
  }

  private handleError = (err: unknown, ctx: C): MaybePromise<void> => {
    // set exit code to emulate `warn-with-error-code` behavior of
    // https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
    // to prevent a clean exit despite an error being thrown
    process.exitCode = 1
    console.error('Unhandled error while processing', ctx.update)
    throw err
  }

  constructor(token: string, options?: Partial<Telegraf.Options<C>>) {
    super()
    // @ts-expect-error Trust me, TS
    this.options = {
      ...DEFAULT_OPTIONS,
      ...compactOptions(options),
    }
    this.telegram = new Telegram(token, this.options.telegram)
    debug('Created a `Telegraf` instance')
  }

  private get token() {
    return this.telegram.token
  }

  /** @deprecated use `ctx.telegram.webhookReply` */
  set webhookReply(webhookReply: boolean) {
    this.telegram.webhookReply = webhookReply
  }

  /** @deprecated use `ctx.telegram.webhookReply` */
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

  /**
   * You must call `bot.telegram.setWebhook` for this to work.
   * You should probably use {@link Telegraf.createWebhook} instead.
   */
  webhookCallback(hookPath = '/', opts: { secretToken?: string } = {}) {
    const { secretToken } = opts
    return generateCallback(
      this.webhookFilter.bind({ hookPath, secretToken }),
      (update: tg.Update, res: http.ServerResponse) =>
        this.handleUpdate(update, res)
    )
  }

  private getDomainOpts(opts: { domain: string; path?: string }) {
    const protocol =
      opts.domain.startsWith('https://') || opts.domain.startsWith('http://')

    if (protocol)
      debug(
        'Unexpected protocol in domain, telegraf will use https:',
        opts.domain
      )

    const domain = protocol ? new URL(opts.domain).host : opts.domain
    const path = opts.path ?? `/telegraf/${this.secretPathComponent()}`
    const url = `https://${domain}${path}`

    return { domain, path, url }
  }

  /**
   * Specify a url to receive incoming updates via webhook.
   * Returns an Express-style middleware you can pass to app.use()
   */
  async createWebhook(
    opts: { domain: string; path?: string } & tt.ExtraSetWebhook
  ) {
    const { domain, path, ...extra } = opts

    const domainOpts = this.getDomainOpts({ domain, path })

    await this.telegram.setWebhook(domainOpts.url, extra)
    debug(`Webhook set to ${domainOpts.url}`)

    return this.webhookCallback(domainOpts.path, {
      secretToken: extra.secret_token,
    })
  }

  private startPolling(allowedUpdates: tt.UpdateType[] = []) {
    this.polling = new Polling(this.telegram, allowedUpdates)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.polling.loop(async (update) => {
      await this.handleUpdate(update)
    })
  }

  private startWebhook(
    hookPath: string,
    tlsOptions?: TlsOptions,
    port?: number,
    host?: string,
    cb?: http.RequestListener,
    secretToken?: string
  ) {
    const webhookCb = this.webhookCallback(hookPath, { secretToken })
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

  secretPathComponent() {
    return crypto
      .createHash('sha3-256')
      .update(this.token)
      .update(process.version) // salt
      .digest('hex')
  }

  /**
   * @see https://github.com/telegraf/telegraf/discussions/1344#discussioncomment-335700
   */
  async launch(config: Telegraf.LaunchOptions = {}) {
    debug('Connecting to Telegram')
    this.botInfo ??= await this.telegram.getMe()
    debug(`Launching @${this.botInfo.username}`)

    if (config.webhook === undefined) {
      await this.telegram.deleteWebhook({
        drop_pending_updates: config.dropPendingUpdates,
      })
      this.startPolling(config.allowedUpdates)
      debug('Bot started with long polling')
      return
    }

    const domainOpts = this.getDomainOpts({
      domain: config.webhook.domain,
      path: config.webhook.hookPath,
    })

    const { tlsOptions, port, host, cb, secretToken } = config.webhook

    this.startWebhook(domainOpts.path, tlsOptions, port, host, cb, secretToken)

    await this.telegram.setWebhook(domainOpts.url, {
      drop_pending_updates: config.dropPendingUpdates,
      allowed_updates: config.allowedUpdates,
      ip_address: config.webhook.ipAddress,
      max_connections: config.webhook.maxConnections,
      secret_token: config.webhook.secretToken,
    })

    debug(`Bot started with webhook @ ${domainOpts.url}`)
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

  private botInfoCall?: Promise<tg.UserFromGetMe>
  async handleUpdate(update: tg.Update, webhookResponse?: http.ServerResponse) {
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
    try {
      await pTimeout(
        Promise.resolve(this.middleware()(ctx, anoop)),
        this.options.handlerTimeout
      )
    } catch (err) {
      return await this.handleError(err, ctx)
    } finally {
      if (webhookResponse?.writableEnded === false) {
        webhookResponse.end()
      }
      debug('Finished processing update', update.update_id)
    }
  }
}
