import { Update } from './deps/typegram.ts'
import { Client } from './core/network/client.ts'
import { FmtString } from './format.ts'

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export type Expand<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: O[K] }
    : never
  : T

export type Any = {} | null | undefined
export type MaybeArray<T> = T | T[]
export type MaybePromise<T> = T | Promise<T>
export type NonemptyReadonlyArray<T> = readonly [T, ...T[]]

type MaybeExtra<Extra> = (Extra & { caption?: string }) | undefined

export function fmtCaption<
  Extra extends {
    caption?: string | FmtString
  } & Record<string, unknown>
>(extra?: Extra): MaybeExtra<Extra> {
  const caption = extra?.caption
  if (!caption || typeof caption === 'string') return extra as MaybeExtra<Extra>
  const { text, entities } = caption
  return {
    ...extra,
    caption: text,
    ...(entities && {
      caption_entities: entities,
      parse_mode: undefined,
    }),
  }
}

/** Construct a generic type guard */
export type Guard<X = unknown, Y extends X = X> = (x: X) => x is Y

/** Extract the guarded type from a type guard, defaults to never. */
export type Guarded<F> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  F extends (x: any) => x is infer T ? T : never

export type Transformer = (call: Client['call']) => Client['call']

export type UpdateHandler = (
  update: Update,
  transformer?: Transformer
) => Promise<void>

export const sleep = (t: number) => new Promise((r) => setTimeout(r, t))
