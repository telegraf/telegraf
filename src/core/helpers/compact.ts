export function compactOptions<T extends { [key: string]: unknown }>(
  options?: T
): T | undefined {
  if (!options) {
    return options
  }

  const keys = Object.keys(options) as Array<keyof T>
  const compactKeys = keys.filter((key) => options[key] !== undefined)
  const compactEntries = compactKeys.map((key) => [key, options[key]])
  return Object.fromEntries(compactEntries)
}
