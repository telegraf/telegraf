const test = require('ava')
const { warnOnce } = require('../lib/core/network/warning')

// Replaces where a warning can go, for one test, and records what arrives there.
function record(t, { emitWarning = true, userAgent } = {}) {
  const emitted = []
  const printed = []
  const original = {
    emitWarning: process.emitWarning,
    warn: console.warn,
    navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
  }
  process.emitWarning = emitWarning
    ? (...args) => emitted.push(args)
    : undefined
  console.warn = (...args) => printed.push(args)
  if (userAgent !== undefined) {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent },
      configurable: true,
    })
  }
  t.teardown(() => {
    process.emitWarning = original.emitWarning
    console.warn = original.warn
    if (original.navigator === undefined) delete globalThis.navigator
    else Object.defineProperty(globalThis, 'navigator', original.navigator)
  })
  return { emitted, printed }
}

test.serial('a warning is a deprecation, issued once for each code', (t) => {
  const { emitted, printed } = record(t)
  warnOnce('TEST_FIRST', 'first')
  warnOnce('TEST_FIRST', 'first again')
  warnOnce('TEST_SECOND', 'second')

  t.deepEqual(emitted, [
    ['first', 'DeprecationWarning', 'TEST_FIRST'],
    ['second', 'DeprecationWarning', 'TEST_SECOND'],
  ])
  t.deepEqual(printed, [])
})

test.serial('it is printed where there is nothing to emit it through', (t) => {
  const { printed } = record(t, { emitWarning: false })
  warnOnce('TEST_NO_PROCESS', 'printed')

  t.deepEqual(printed, [['printed']])
})

test.serial('it is printed on Cloudflare Workers', (t) => {
  // With `nodejs_compat` there is an `emitWarning` there, and nothing prints what it emits.
  const { emitted, printed } = record(t, { userAgent: 'Cloudflare-Workers' })
  warnOnce('TEST_WORKERS', 'printed')

  t.deepEqual(printed, [['printed']])
  t.deepEqual(emitted, [])
})
