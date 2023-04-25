import type { HasRequiredKeys, IsEqual } from 'type-fest'

// These are the magic utility types

export type RequireAllOptionalProps<T extends object> =
  HasRequiredKeys<T> extends true ? never : T

// This ensures T extends RequireAllOptionalProps<T>
// AND RequireAllOptionalProps<T> extend T
// so in both directions
export type HasAllOptionalProps<T extends object> = IsEqual<
  T,
  RequireAllOptionalProps<T>
> extends true
  ? T
  : never
