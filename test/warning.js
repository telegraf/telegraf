const test = require('ava')
const { warnOnce } = require('../lib/core/network/warning')

// Stubs both warning outputs for one test and records what they receive.
function stubWarnings(t, { emitWarning = true, userAgent } = {}) {
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

test.serial('warnOnce should emit a DeprecationWarning once per code', (t) => {
  const { emitted, printed } = stubWarnings(t)
  warnOnce('TEST_FIRST', 'first')
  warnOnce('TEST_FIRST', 'first again')
  warnOnce('TEST_SECOND', 'second')

  t.deepEqual(emitted, [
    ['first', 'DeprecationWarning', 'TEST_FIRST'],
    ['second', 'DeprecationWarning', 'TEST_SECOND'],
  ])
  t.deepEqual(printed, [])
})

test.serial(
  'warnOnce should use console.warn without process.emitWarning',
  (t) => {
    const { printed } = stubWarnings(t, { emitWarning: false })
    warnOnce('TEST_NO_PROCESS', 'printed')

    t.deepEqual(printed, [['printed']])
  }
)

test.serial('warnOnce should use console.warn on Cloudflare Workers', (t) => {
  // With `nodejs_compat`, Cloudflare Workers has `emitWarning`, but no builtin listener
  // prints it.
  const { emitted, printed } = stubWarnings(t, {
    userAgent: 'Cloudflare-Workers',
  })
  warnOnce('TEST_WORKERS', 'printed')

  t.deepEqual(printed, [['printed']])
  t.deepEqual(emitted, [])
})
