import { FmtString } from './formatting'
import { Deunionize, UnionKeys } from './deunionize'

export const env = process.env

// eslint-disable-next-line @typescript-eslint/ban-types
export type Any = {} | undefined | null

export type Expand<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: O[K] }
    : never
  : T

export type MaybeArray<T> = T | T[]
export type MaybePromise<T> = T | Promise<T>
export type NonemptyReadonlyArray<T> = readonly [T, ...T[]]

// prettier-ignore
export type ExclusiveKeys<A extends object, B extends object> = keyof Omit<A, keyof B>

export function fmtCaption<
  Extra extends { caption?: string | FmtString } | undefined,
>(
  extra?: Extra
): Extra extends undefined
  ? undefined
  : Omit<Extra, 'caption'> & { caption?: string }

export function fmtCaption(extra?: { caption?: string | FmtString }) {
  if (!extra) return
  const caption = extra.caption
  if (!caption || typeof caption === 'string') return extra
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

export type DistinctKeys<T extends object> = Exclude<UnionKeys<T>, keyof T>

// prettier-ignore
/* eslint-disable-next-line @typescript-eslint/ban-types */
export type KeyedDistinct<T extends object, K extends DistinctKeys<T>> = Record<K, {}> & Deunionize<Record<K, {}>, T>

// prettier-ignore
/* eslint-disable-next-line @typescript-eslint/ban-types */
export type Keyed<T extends object, K extends UnionKeys<T>> = Record<K, {}> & Deunionize<Record<K, {}>, T>

/** Construct a generic type guard */
export type Guard<X = unknown, Y extends X = X> = (x: X) => x is Y

/** Extract the guarded type from a type guard, defaults to never. */
export type Guarded<F> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  F extends (x: any) => x is infer T ? T : never

export function* zip<X, Y>(xs: Iterable<X>, ys: Iterable<Y>): Iterable<X | Y> {
  const x = xs[Symbol.iterator]()
  const y = ys[Symbol.iterator]()
  let x1 = x.next()
  let y1 = y.next()

  while (!x1.done) {
    yield x1.value
    if (!y1.done) yield y1.value
    x1 = x.next()
    y1 = y.next()
  }

  while (!y1.done) {
    yield y1.value
    y1 = y.next()
  }
}

export function indexed<T extends object, U>(
  target: T,
  indexer: (index: number) => U
) {
  return new Proxy(target, {
    get: function (target, prop, receiver) {
      if (
        (typeof prop === 'string' || typeof prop === 'number') &&
        !isNaN(+prop)
      )
        return indexer.call(target, +prop)
      return Reflect.get(target, prop, receiver)
    },
  })
}
