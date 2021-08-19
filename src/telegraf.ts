import * as crypto from 'crypto'
import * as http from 'http'
import * as https from 'https'
import * as tg from './core/types/typegram'
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

// eslint-disable-next-line import/export
export class Telegraf<C extends Context = Context> extends Composer<C> {
  private readonly options: Telegraf.Options<C>
  private webhookServer?: http.Server | https.Server
  private polling?: Polling
  /** Set manually to avoid implicit `getMe` call in `launch` or `webhookCallback` */
  public botInfo?: tg.UserFromGetMe
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

  constructor(token: string, options?: Partial<Telegraf.Options<C>>) {
    super()
    // @ts-expect-error
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
      (update: tg.Update, res: http.ServerResponse) =>
        this.handleUpdate(update, res)
    )
  }

  private startPolling(allowedUpdates: tt.UpdateType[] = []) {
    this.polling = new Polling(this.telegram, allowedUpdates)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.polling.loop(async (updates) => {
      await this.handleUpdates(updates)
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
      config.webhook.hookPath ?? `/telegraf/${this.secretPathComponent()}`
    const { port, host, tlsOptions, cb } = config.webhook
    this.startWebhook(hookPath, tlsOptions, port, host, cb)
    if (!domain) {
      debug('Bot started with webhook')
      return
    }
    await this.telegram.setWebhook(`https://${domain}${hookPath}`, {
      drop_pending_updates: config.dropPendingUpdates,
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

  private handleUpdates(updates: readonly tg.Update[]) {
    if (!Array.isArray(updates)) {
      throw new TypeError(util.format('Updates must be an array, got', updates))
    }
    return Promise.all(updates.map((update) => this.handleUpdate(update)))
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
