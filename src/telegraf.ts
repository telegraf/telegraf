import * as http from 'http'
import * as https from 'https'
import * as tt from './telegram-types'
import ApiClient from './core/network/client'
import Composer from './composer'
import Context from './context'
import crypto from 'crypto'
import d from 'debug'
import generateCallback from './core/network/webhook'
import { promisify } from 'util'
import Telegram from './telegram'
import { TlsOptions } from 'tls'
import { URL } from 'url'
const debug = d('telegraf:core')

const DEFAULT_OPTIONS: Telegraf.Options<Context> = {
  telegram: {},
  retryAfter: 1,
  handlerTimeout: 0,
  channelMode: false,
  contextType: Context,
}

const noop = () => {}
function always<T>(x: T) {
  return () => x
}
const anoop = always(Promise.resolve())
const sleep = promisify(setTimeout)

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Telegraf {
  export interface Options<C extends Context> {
    channelMode: boolean
    contextType: new (...args: ConstructorParameters<typeof Context>) => C
    handlerTimeout: number
    retryAfter: number
    telegram: Partial<ApiClient.Options>
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

export class Telegraf<C extends Context = Context> extends Composer<C> {
  private readonly options: Telegraf.Options<C>
  private webhookServer?: http.Server | https.Server
  /** Set manually to avoid implicit `getMe` call in `launch` or `webhookCallback` */
  public botInfo?: tt.UserFromGetMe
  public telegram: Telegram
  readonly context: Partial<C> = {}
  private readonly polling = {
    allowedUpdates,
    limit: 100,
    offset: 0,
    started: false,
    stopCallback: noop,
    timeout: 30,
  }

  private handleError: (err: any, ctx: C) => void = (err) => {
    console.error()
    console.error((err.stack ?? err.toString()).replace(/^/gm, '  '))
    console.error()
    throw err
  }

  constructor(token: string, options?: Partial<Telegraf.Options<C>>) {
    super()
    // @ts-expect-error
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    }
    this.telegram = new Telegram(token, this.options.telegram)
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

  catch(handler: (err: any, ctx: C) => void) {
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

  private startPolling(
    timeout = 30,
    limit = 100,
    allowedUpdates: tt.UpdateType[] = [],
    stopCallback = noop
  ) {
    this.polling.timeout = timeout
    this.polling.limit = limit
    this.polling.allowedUpdates = allowedUpdates
    this.polling.stopCallback = stopCallback
    if (!this.polling.started) {
      this.polling.started = true
      this.fetchUpdates()
    }
    return this
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
      cb && typeof cb === 'function'
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
    if (!config.webhook) {
      const { timeout, limit, allowedUpdates, stopCallback } =
        config.polling ?? {}
      await this.telegram.deleteWebhook()
      this.startPolling(timeout, limit, allowedUpdates, stopCallback)
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
    debug('Stopping bot...')
    await new Promise<void>((resolve, reject) => {
      if (this.webhookServer) {
        this.webhookServer.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      } else if (!this.polling.started) {
        resolve()
      } else {
        this.polling.stopCallback = resolve
        this.polling.started = false
      }
    })
  }

  handleUpdates(updates: readonly tt.Update[]) {
    if (!Array.isArray(updates)) {
      return Promise.reject(new Error('Updates must be an array'))
    }
    // prettier-ignore
    const processAll = Promise.all(updates.map((update) => this.handleUpdate(update)))
    if (this.options.handlerTimeout === 0) {
      return processAll
    }
    return Promise.race([processAll, sleep(this.options.handlerTimeout)])
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
    const ctx = new TelegrafContext(update, tg, this.botInfo, this.options)
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

  private fetchUpdates() {
    if (!this.polling.started) {
      this.polling.stopCallback()
      return
    }
    const { timeout, limit, offset, allowedUpdates } = this.polling
    this.telegram
      .getUpdates(timeout, limit, offset, allowedUpdates)
      .catch((err) => {
        if (err.code === 401 || err.code === 409) {
          throw err
        }
        const wait = err.parameters?.retry_after ?? this.options.retryAfter
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
