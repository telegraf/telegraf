// for https://gist.github.com/2b1b226d52d675ec246c6f8abdab81ef
export type { Update, UserFromGetMe } from 'typegram'
import type { ApiResponse, File, Typegram } from 'typegram'
import createDebug from 'debug'
import { fetch, type RequestInit } from '../../vendor/fetch'
import { createPayload, type InputFile } from './payload'

const debug = createDebug('telegraf:client')

export const defaultOpts = {
  /**
   * If you use a Bot API server [that supports user accounts](https://github.com/tdlight-team/tdlight-telegram-bot-api),
   * you may use this feature. `bot` is used by default.
   */
  apiMode: 'bot' as 'bot' | 'user',
  /**
   * Root URL for the API.
   * If you host your own [Bot API server](https://github.com/tdlib/telegram-bot-api),
   * you must set the new base URL here. https://api.telegram.org is used by default.
   */
  apiRoot: 'https://api.telegram.org',
  /**
   * Pass `true` to use test environment.
   * The test environment is completely separate from the main environment, so you will need to
   * create a new user account and a new bot with [@BotFather](https://t.me/BotFather).
   * @see https://core.telegram.org/bots/webapps#testing-web-apps
   * */
  testEnv: false,
}

export type ClientOptions = Partial<typeof defaultOpts>

export type TelegrafTypegram = Typegram<InputFile>
export type TelegramP = TelegrafTypegram['TelegramP']
export type Opts = TelegrafTypegram['Opts']
export type Ret = TelegrafTypegram['Ret']

type Telegram = TelegrafTypegram['Telegram']

function redactToken(error: Error): never {
  error.message = error.message.replace(
    /\/(bot|user)(\d+):[^/]+\//,
    '/$1$2:[REDACTED]/'
  )
  throw error
}

export interface Invocation<M extends keyof Opts> {
  method: M
  payload: Opts[M]
  signal?: AbortSignal
}

export function createClient(token: string, opts: ClientOptions = {}) {
  // override options that are explicitly passed
  const { apiMode, apiRoot, testEnv } = { ...defaultOpts, ...opts }

  const call = async <M extends keyof Telegram>({
    method,
    payload,
    signal,
  }: Invocation<M>): Promise<ApiResponse<Ret[M]>> => {
    debug('HTTP call', method, payload)
    const url = new URL(
      `./${apiMode}${token}${testEnv ? '/test' : ''}/${method}`,
      apiRoot
    )
    const init: RequestInit = { ...createPayload(payload), signal }
    const res = await fetch(url.href, init).catch(redactToken)
    if (res.status >= 500) {
      res.body?.cancel()
      return {
        ok: false,
        error_code: res.status,
        description: res.statusText,
      }
    }

    return (await res.json()) as ApiResponse<Ret[M]>
  }

  const download = async (file: File) => {
    const url = new URL(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      `./file/${apiMode}${token}/${file.file_path!}`,
      apiRoot
    )
    return await fetch(url)
  }

  return { call, download }
}

export type Client = ReturnType<typeof createClient>
