export type PropOr<
  T extends object | undefined,
  P extends string | symbol | number,
  D = undefined
> = T extends Partial<Record<P, unknown>> ? T[P] : D

export type UnionKeys<T> = T extends unknown ? keyof T : never

type AddOptionalKeys<K extends PropertyKey> = { readonly [P in K]?: never }

/**
 * @see https://millsp.github.io/ts-toolbelt/modules/union_strict.html
 */
export type Deunionize<
  B extends object | undefined,
  T extends B = B
> = T extends object ? T & AddOptionalKeys<Exclude<UnionKeys<B>, keyof T>> : T

/**
 * Expose properties from all union variants.
 * @deprectated
 * @see https://github.com/telegraf/telegraf/issues/1388#issuecomment-791573609
 * @see https://millsp.github.io/ts-toolbelt/modules/union_strict.html
 */
export function deunionize<T extends object | undefined>(t: T) {
  return t as Deunionize<T>
}
