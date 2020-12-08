import * as crypto from 'crypto'
import * as http from 'http'
import * as https from 'https'
import * as tt from './telegram-types'
import ApiClient from './core/network/client'
import Composer from './composer'
import Context from './context'
import { compactOptions } from './core/helpers/compact'
import d from 'debug'
import generateCallback from './core/network/webhook'
import { Polling } from './core/network/polling'
import { promisify } from 'util'
import Telegram from './telegram'
import { TlsOptions } from 'tls'
import { URL } from 'url'
const debug = d('telegraf:core')

const DEFAULT_OPTIONS: Telegraf.Options<Context> = {
  telegram: {},
  retryAfter: 1,
  handlerTimeout: 5000,
  contextType: Context,
}

function always<T>(x: T) {
  return () => x
}
const anoop = always(Promise.resolve())
const wait = promisify(setTimeout)

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Telegraf {
  export interface Options<TContext extends Context> {
    contextType: new (
      ...args: ConstructorParameters<typeof Context>
    ) => TContext
    handlerTimeout: number
    retryAfter: number
    telegram: Partial<ApiClient.Options>
  }

  export interface LaunchOptions {
    polling?: {
      /** List the types of updates you want your bot to receive */
      allowedUpdates?: tt.UpdateType[]
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

export class Telegraf<
  TContext extends Context = Context
> extends Composer<TContext> {
  private readonly options: Telegraf.Options<TContext>
  private webhookServer?: http.Server | https.Server
  /** Set manually to avoid implicit `getMe` call in `launch` or `webhookCallback` */
  public botInfo?: tt.UserFromGetMe
  public telegram: Telegram
  readonly context: Partial<TContext> = {}
  private polling?: Polling

  private handleError: (err: unknown, ctx: TContext) => void = (err: any) => {
    console.error()
    console.error((err.stack ?? err.toString()).replace(/^/gm, '  '))
    console.error()
    throw err
  }

  constructor(token: string, options?: Partial<Telegraf.Options<TContext>>) {
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

  catch(handler: (err: unknown, ctx: TContext) => void) {
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
    this.polling.consume(async (updates) => {
      const processAll = Promise.all(
        updates.map((update) => this.handleUpdate(update))
      )
      if (this.options.handlerTimeout === 0) {
        await processAll
        return
      }
      await Promise.race([processAll, wait(this.options.handlerTimeout)])
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
      this.startPolling(config.polling?.allowedUpdates)
      debug('Bot started with long-polling')
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

  async stop() {
    await this.polling?.stop()
    if (this.webhookServer !== undefined) {
      debug('Stopping webhook server...')
      await promisify(this.webhookServer.close).call(this.webhookServer)
    }
    debug('Bot stopped gracefully')
  }

  private botInfoCall?: Promise<tt.UserFromGetMe>
  async handleUpdate(update: tt.Update, webhookResponse?: http.ServerResponse) {
    debug('Processing update', update.update_id)
    this.botInfo ??=
      (debug(
        'Update',
        update.update_id,
        'waiting for `botInfo` to be initialized'
      ),
      await (this.botInfoCall ??= this.telegram.getMe()))
    const tg = new Telegram(this.token, this.telegram.options, webhookResponse)
    const TelegrafContext = this.options.contextType
    const ctx = new TelegrafContext(update, tg, this.botInfo)
    Object.assign(ctx, this.context)
    try {
      await this.middleware()(ctx, anoop)
    } catch (err) {
      return this.handleError(err, ctx)
    } finally {
      if (webhookResponse !== undefined && !webhookResponse.writableEnded) {
        webhookResponse.end()
      }
    }
  }
}
