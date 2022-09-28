/* eslint-disable @typescript-eslint/no-explicit-any */
// for https://gist.github.com/2b1b226d52d675ec246c6f8abdab81ef
export type { Update, UserFromGetMe } from 'typegram'
import type { ApiResponse, File, Typegram } from 'typegram'
import createDebug from 'debug'
import { fetch, FormData, type RequestInit } from '../../vendor/fetch'

const debug = createDebug('telegraf:client')

export const defaultOptions = {
  api: {
    mode: 'bot' as 'bot' | 'user',
    root: new URL('https://api.telegram.org'),
  },
}

export type ClientOptions = typeof defaultOptions
export type TelegrafTypegram = Typegram<InputFile>
export type InputFile = Blob | StreamFile
export type TelegramP = TelegrafTypegram['TelegramP']
export type Opts = TelegrafTypegram['Opts']

type Telegram = TelegrafTypegram['Telegram']

export type Ret = {
  [M in keyof Opts]: ReturnType<Telegram[M]>
}

export class StreamFile {
  readonly size = NaN
  constructor(
    readonly stream: () => AsyncIterable<Uint8Array>,
    readonly name: string
  ) {}
}

Object.defineProperty(StreamFile.prototype, Symbol.toStringTag, {
  value: 'File',
})

// based on https://github.com/node-fetch/fetch-blob/blob/8ab587d34080de94140b54f07168451e7d0b655e/index.js#L229-L241 (MIT License)
export function isInputFile(value: any): value is InputFile {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.size === 'number' &&
    typeof value.stream === 'function' &&
    typeof value.constructor === 'function' &&
    /^(?:Blob|File)$/.test(value[Symbol.toStringTag])
  )
}

function stringify(value: unknown) {
  if (typeof value === 'string') return value
  if (isInputFile(value)) return value
  return JSON.stringify(value)
}

function serialize(payload: Record<string, any>) {
  const formData = new FormData()
  const attach = (entry: any, index: number) => {
    const result = { ...entry }
    if (isInputFile(entry.media)) {
      const id = entry.type + index
      result.media = `attach://${id}`
      formData.append(id, entry.media)
    }
    if (isInputFile(entry.thumb)) {
      const id = 'thumb' + index
      result.thumb = `attach://${id}`
      formData.append(id, entry.thumb)
    }
    return result
  }

  // eslint-disable-next-line prefer-const
  for (let [key, value] of Object.entries(payload)) {
    if (key === 'media') value = value.map(attach)
    if (value != null) formData.append(key, stringify(value) as any)
  }
  return formData
}

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

export function createClient(token: string, { api } = defaultOptions) {
  const call = async <M extends keyof Telegram>({
    method,
    payload,
    signal,
  }: Invocation<M>): Promise<ApiResponse<Ret[M]>> => {
    debug('HTTP call', method, payload)
    const body = serialize(payload)
    const url = new URL(`./${api.mode}${token}/${method}`, api.root)
    const init: RequestInit = { body, signal, method: 'post' }
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
      `./file/${api.mode}${token}/${file.file_path!}`,
      api.root
    )
    return await fetch(url)
  }

  return { call, download }
}

export type Client = ReturnType<typeof createClient>
