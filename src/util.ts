export const env = process.env

export function deprecate(
  method: string,
  ignorable: string | undefined,
  use: string | undefined,
  see?: string
) {
  // don't use deprecate() yet
  // wait for a couple minor releases of telegraf so the news reaches more people
  return

  const ignorer = `IGNORE_DEPRECATED_${ignorable}`
  if (env[ignorer]) return

  const stack: { stack: string } = { stack: '' }
  Error.captureStackTrace(stack)
  const line = (stack.stack.split('\n')[3] || '').trim()

  const useOther = use ? `; use ${use} instead` : ''
  const pad = ' '.repeat('[WARN]'.length)

  console.warn(`[WARN] ${method} is deprecated${useOther}`)
  if (line) console.warn(pad, line)
  if (see) console.warn(pad, `SEE ${see}`)
}
