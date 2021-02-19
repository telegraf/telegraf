export type PropOr<
  T extends object | undefined,
  P extends string | symbol | number,
  D
> = T extends Partial<Record<P, unknown>> ? T[P] : D

export type UnionKeys<T> = T extends unknown ? keyof T : never

export type Deunionize<T extends object | undefined> =
  | ([undefined] extends [T] ? undefined : never)
  | {
      [K in UnionKeys<T>]: PropOr<NonNullable<T>, K, undefined>
    }

export function deunionize<T extends object | undefined>(t: T) {
  return t as Deunionize<T>
}
