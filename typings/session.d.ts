/** @format */

import { TelegrafContext } from './context'
import { Middleware } from './composer'

export declare function session<TContext extends TelegrafContext>(opts?: {
  property?: string
  store?: Map<string, any>
  getSessionKey?: (ctx: TContext) => string
  ttl?: number
}): Middleware<TContext>
