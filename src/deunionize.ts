export type PropOr<
  T extends object | undefined,
  P extends string | symbol | number,
  D
> = T extends Partial<Record<P, unknown>> ? T[P] : D

export type UnionKeys<T> = T extends unknown ? keyof T : never

type AddOptionalKeys<K extends PropertyKey> = { [P in K]?: undefined }

export type Deunionize<
  B extends object | undefined,
  T extends B = B
> = T extends object ? T & AddOptionalKeys<Exclude<UnionKeys<B>, keyof T>> : T

/**
 * Expose properties from all union variants
 */
export function deunionize<T extends object | undefined>(t: T) {
  return t as Deunionize<T>
}
