#!/usr/bin/env node

import debug from 'debug'
import path from 'path'
import parse from 'minimist'
import { addAlias } from 'module-alias'

// @ts-expect-error Telegraf doesn't build JS and d.ts in the same place, that needs to be fixed
import { Telegraf as _Telegraf } from '../lib/index.js'
import type { Telegraf as Tf, Context, Middleware } from '../typings/index.js'
import type { RequestListener } from 'http'
import type { TlsOptions } from 'tls'

import esMain from 'es-main'

// hack to type Telegraf correctly
const Telegraf: typeof Tf = _Telegraf

const log = debug('telegraf:cli')

const helpMsg = `Usage: telegraf [opts] <bot-file>

  -t  Bot token [$BOT_TOKEN]
  -d  Webhook domain [$BOT_DOMAIN]
  -H  Webhook host [0.0.0.0]
  -p  Webhook port [$PORT or 3000]
  -l  Enable logs
  -h  Show this help message
  -m  Bot API method to run directly
  -D  Data to pass to the Bot API method`

const help = () => console.log(helpMsg)

export type Expand<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: O[K] }
    : never
  : T

type Parsed = {
  // string params, all optional
  token?: string
  domain?: string
  method?: string
  data?: string

  // defaults exist
  host: string
  port: string

  // boolean params
  logs: boolean
  help: boolean

  // argv
  _: [program: string, entryfile: string, ...paths: string[]]
}

type Env = {
  BOT_TOKEN?: string
  BOT_DOMAIN?: string
  PORT?: string
}

/**
 * Runs the cli program and returns exit code
 */
export async function main(argv: string[], env: Env = {}) {
  const args = parse(argv, {
    alias: {
      // string params, all optional
      t: 'token',
      d: 'domain',
      m: 'method',
      D: 'data',

      // defaults exist
      H: 'host',
      p: 'port',

      // boolean params
      l: 'logs',
      h: 'help',
    },
    boolean: ['h', 'l'],
    default: {
      H: '0.0.0.0',
      p: env.PORT || '3000',
    },
  }) as Parsed

  if (args.help) {
    help()
    return 0
  }

  const token = args.token || env.BOT_TOKEN
  const domain = args.domain || env.BOT_DOMAIN

  if (!token) {
    console.error('Please supply Bot Token')
    help()
    return 1
  }

  const bot = new Telegraf(token)

  if (args.method) {
    const method = args.method as Parameters<typeof bot.telegram.callApi>[0]
    console.log(
      await bot.telegram.callApi(method, JSON.parse(args.data || '{}'))
    )
    return 0
  }

  let [, , file] = args._

  if (!file) {
    try {
      const packageJson = (await import(
        path.resolve(process.cwd(), 'package.json')
      )) as { main?: string }
      file = packageJson.main || 'index.js'
    } catch (err) {}
  }

  if (!file) {
    console.error('Please supply a bot handler file.\n')
    help()
    return 2
  }

  if (file[0] !== '/') file = path.resolve(process.cwd(), file)

  type Mod =
    | {
        default: Middleware<Context>
        botHandler: undefined
        httpHandler: undefined
        tlsOptions: undefined
      }
    | {
        default: undefined
        botHandler: Middleware<Context>
        httpHandler?: RequestListener
        tlsOptions?: TlsOptions
      }

  try {
    if (args.logs) debug.enable('telegraf:*')

    addAlias('telegraf', path.join(import.meta.url, '../'))
    const mod: Mod = await import(file)
    const botHandler = mod.botHandler || mod.default
    const httpHandler = mod.httpHandler
    const tlsOptions = mod.tlsOptions

    const config: Tf.LaunchOptions = {}
    if (domain) {
      config.webhook = {
        domain,
        host: args.host,
        port: Number(args.port),
        tlsOptions,
        cb: httpHandler,
      }
    }

    bot.use(botHandler)

    log(`Starting module ${file}`)
    await bot.launch(config)
  } catch (err) {
    console.error(`Error launching bot from ${file}`, (err as Error)?.stack)
    return 3
  }

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))

  return 0
}

// run main if called from command line and not imported from another file
if (esMain(import.meta))
  process.exitCode = await main(process.argv, process.env as Env)
