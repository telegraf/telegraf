export function hasProp<X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  return prop in obj
}
export function hasPropType<
  X extends {},
  Y extends PropertyKey,
  Z extends
    | 'string'
    | 'number'
    | 'bigint'
    | 'boolean'
    | 'symbol'
    | 'undefined'
    | 'object'
    | 'function'
>(obj: X, prop: Y, type: Z): obj is X & Record<Y, Z> {
  // eslint-disable-next-line valid-typeof
  return hasProp(obj, prop) && type === typeof obj[prop]
}
