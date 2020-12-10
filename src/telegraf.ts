import * as crypto from 'crypto'
import * as http from 'http'
import * as https from 'https'
import * as tt from './telegram-types'
import * as util from 'util'
import ApiClient from './core/network/client'
import Composer from './composer'
import Context from './context'
import { compactOptions } from './core/helpers/compact'
import d from 'debug'
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
const wait = util.promisify(setTimeout)

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
    // FIXME: not honored by webhook
    /** List the types of updates you want your bot to receive */
    allowedUpdates?: tt.UpdateType[]
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

  private handleError = async (err: unknown, ctx: C): Promise<void> => {
    // set exit code to emulate `warn-with-error-code` behavior of
    // https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
    // to prevent a clean exit despite an error being thrown
    process.exitCode = 1
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

  webhookCallback(path = '/') {
    return generateCallback(
      path,
      (update: tt.Update, res: http.ServerResponse) =>
        this.handleUpdate(update, res),
      debug
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
    this.webhookServer = tlsOptions
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
    await this.telegram.setWebhook(`https://${domain}${hookPath}`)
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

  private handleUpdates(updates: readonly tt.Update[]) {
    if (!Array.isArray(updates)) {
      throw new TypeError(util.format('Updates must be an array, got', updates))
    }
    // prettier-ignore
    const processAll = Promise.all(updates.map((update) => this.handleUpdate(update)))
    if (this.options.handlerTimeout === Infinity) {
      return processAll
    }
    return Promise.race([processAll, wait(this.options.handlerTimeout)])
  }

  private botInfoCall?: Promise<tt.UserFromGetMe>
  async handleUpdate(update: tt.Update, webhookResponse?: http.ServerResponse) {
    debug('Processing update', update.update_id)
    this.botInfo ??=
      (debug(
        'Update',
        update.update_id,
        'is waiting for `botInfo` to be initialized'
      ),
      await (this.botInfoCall ??= this.telegram.getMe()))
    const tg = new Telegram(this.token, this.telegram.options, webhookResponse)
    const TelegrafContext = this.options.contextType
    const ctx = new TelegrafContext(update, tg, this.botInfo)
    Object.assign(ctx, this.context)
    try {
      await this.middleware()(ctx, anoop)
    } catch (err) {
      return await this.handleError(err, ctx)
    } finally {
      if (webhookResponse !== undefined && !webhookResponse.writableEnded) {
        webhookResponse.end()
      }
    }
  }
}
