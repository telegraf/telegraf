import { http, https, TlsOptions } from './platform/network.ts'
import type * as tg from './deps/typegram.ts'
import * as tt from './telegram-types.ts'
import { Composer, noop } from './composer.ts'
import { compactOptions } from './core/helpers/compact.ts'
import Context from './context.ts'
import { debug } from './deps/debug.ts'
import generateCallback from './core/network/webhook.ts'
import { Polling } from './core/network/polling.ts'
import Telegram, { Transformer } from './telegram.ts'
import { createClient, type ClientOptions } from './core/network/client.ts'
import { hash } from './platform/crypto.ts'
import { safeCompare } from './vendor/safe-compare.ts'
import { sleep } from './util.ts'
import { TimeoutError } from './core/network/error.ts'

const d = debug('telegraf:main')

const DEFAULT_OPTIONS: Telegraf.Options<Context> = {
  handlerTimeout: 90_000, // 90s in ms
  contextType: Context,
}

const identity = <T>(t: T) => t

export namespace Telegraf {
  export interface Options<TContext extends Context> {
    contextType: new (
      ...args: ConstructorParameters<typeof Context>
    ) => TContext
    handlerTimeout: number
    client?: ClientOptions
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

      /**
       * A secret token to be sent in a header `“X-Telegram-Bot-Api-Secret-Token”` in every webhook request.
       * 1-256 characters. Only characters `A-Z`, `a-z`, `0-9`, `_` and `-` are allowed.
       * The header is useful to ensure that the request comes from a webhook set by you.
       */
      secretToken?: string

      /**
       * Upload your public key certificate so that the root certificate in use can be checked.
       * See [self-signed guide](https://core.telegram.org/bots/self-signed) for details.
       */
      certificate?: tg.InputFile

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
  readonly #token: string

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
    const d = debug('telegraf:webhook')

    if (req.method === 'POST') {
      if (safeCompare(this.hookPath, req.url as string)) {
        // no need to check if secret_token was not set
        if (!this.secretToken) return true
        else {
          const token = req.headers[TOKEN_HEADER] as string
          if (safeCompare(this.secretToken, token)) return true
          else d('Secret token does not match:', token, this.secretToken)
        }
      } else d('Path does not match:', req.url, this.hookPath)
    } else d('Unexpected request method, not POST. Received:', req.method)

    return false
  }

  private handleError = (err: unknown, ctx: C): Promise<void> => {
    if (ctx) console.error('Unhandled error while processing', ctx.update)
    throw err
  }

  constructor(token: string, options?: Partial<Telegraf.Options<C>>) {
    super()
    // @ts-expect-error Trust me, TS
    this.options = {
      ...DEFAULT_OPTIONS,
      ...compactOptions(options),
    }
    this.#token = token
    this.telegram = new Telegram(createClient(token, this.options.client))
    d('Created a `Telegraf` instance')
  }

  /**
   * _Override_ error handling
   */
  catch(handler: Telegraf['handleError']) {
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
      this.handleUpdate
    )
  }

  private getDomainOpts(opts: { domain: string; path?: string }) {
    const protocol =
      opts.domain.startsWith('https://') || opts.domain.startsWith('http://')

    if (protocol)
      d('Unexpected protocol in domain, telegraf will use https:', opts.domain)

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
    d(`Webhook set to ${domainOpts.url}`)

    return this.webhookCallback(domainOpts.path, {
      secretToken: extra.secret_token,
    })
  }

  private startPolling(allowedUpdates: tt.UpdateType[] = []) {
    this.polling = new Polling(this.telegram, allowedUpdates)
    return this.polling.loop(this.handleUpdate)
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
      d('Webhook listening on port: %s', port)
    })
    return this
  }

  secretPathComponent() {
    return hash(this.#token)
  }

  /**
   * @see https://github.com/telegraf/telegraf/discussions/1344#discussioncomment-335700
   */
  async launch(config: Telegraf.LaunchOptions = {}) {
    d('Connecting to Telegram')
    this.botInfo ??= await this.telegram.getMe()
    d(`Launching @${this.botInfo.username}`)

    if (config.webhook === undefined) {
      await this.telegram.deleteWebhook({
        drop_pending_updates: config.dropPendingUpdates,
      })
      d('Bot started with long polling')
      await this.startPolling(config.allowedUpdates)
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
      certificate: config.webhook.certificate,
    })

    d(`Bot started with webhook @ ${domainOpts.url}`)
  }

  stop(reason = 'unspecified') {
    d('Stopping bot... Reason:', reason)
    // https://github.com/telegraf/telegraf/pull/1224#issuecomment-742693770
    if (this.polling === undefined && this.webhookServer === undefined) {
      throw new Error('Bot is not running!')
    }
    this.webhookServer?.close()
    this.polling?.stop()
  }

  private botInfoCall?: Promise<tg.UserFromGetMe>
  readonly handleUpdate = async (
    update: tg.Update,
    transform: Transformer = identity
  ) => {
    this.botInfo ??=
      (d(
        'Update %d is waiting for `botInfo` to be initialized',
        update.update_id
      ),
      await (this.botInfoCall ??= this.telegram.getMe()))
    d('Processing update', update.update_id)
    const tg = new Telegram(this.telegram)
    tg.use(transform)
    const TelegrafContext = this.options.contextType
    const ctx = new TelegrafContext(update, tg, this.botInfo)
    Object.assign(ctx, this.context)

    const { handlerTimeout } = this.options
    try {
      await Promise.race([
        Promise.resolve(this.middleware()(ctx, noop)),
        sleep(handlerTimeout).then(() =>
          Promise.reject(new TimeoutError(handlerTimeout))
        ),
      ])
    } catch (err) {
      return await this.handleError(err, ctx)
    } finally {
      d('Finished processing update', update.update_id)
    }
  }
}
