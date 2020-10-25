interface Mapping {
  string: string
  number: number
  bigint: bigint
  boolean: boolean
  symbol: symbol
  undefined: undefined
  object: object
  function: Function
}

/**
 * Checks if a given object has a property with a given name.
 *
 * Example invocation:
 * ```js
 * let obj = { 'foo': 'bar', 'baz': () => {} }
 * hasProp(obj, 'foo') // true
 * hasProp(obj, 'baz') // true
 * hasProp(obj, 'abc') // false
 * ```
 *
 * @param obj An object to test
 * @param prop The name of the property
 */
export function hasProp<O extends {}, K extends PropertyKey>(
  obj: O | undefined,
  prop: K
): obj is O & Record<K, unknown> {
  return obj !== undefined && prop in obj
}
/**
 * Checks if a given object has a property with a given name.
 * Furthermore performs a `typeof` check on the property if it exists.
 *
 * Example invocation:
 * ```js
 * let obj = { 'foo': 'bar', 'baz': () => {} }
 * hasPropType(obj, 'foo', 'string') // true
 * hasPropType(obj, 'baz', 'function') // true
 * hasPropType(obj, 'abc', 'number') // false
 * ```
 *
 * @param obj An object to test
 * @param prop The name of the property
 * @param type The type the property is expected to have
 */
export function hasPropType<
  O extends {},
  K extends PropertyKey,
  T extends keyof Mapping,
  V extends Mapping[T]
>(obj: O | undefined, prop: K, type: T): obj is O & Record<K, V> {
  // eslint-disable-next-line valid-typeof
  return hasProp(obj, prop) && type === typeof obj[prop]
}

/**
 * Checks if the supplied array has two dimensions or not.
 *
 * Example invocations:
 * is2D([]) // false
 * is2D([[]]) // true
 * is2D([[], []]) // true
 * is2D([42]) // false
 *
 * @param arr an array with one or two dimensions
 */
export function is2D<E>(arr: E[] | E[][]): arr is E[][] {
  return Array.isArray(arr[0])
}
