export type SnakeToCamelCase<
  S extends string
> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : `${S}`
