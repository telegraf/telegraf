const test = require('ava')

// The client sends through the package `node-fetch`. Bun puts its own fetch in that
// package's place, and its errors are not node-fetch's. A stand-in is put there the same
// way, before the client loads it, that rejects with whatever a test asks for.
let rejection
const nodeFetch = require.resolve('node-fetch')
require.cache[nodeFetch] = {
  id: nodeFetch,
  filename: nodeFetch,
  loaded: true,
  exports: (url) => Promise.reject(rejection(String(url))),
}
const { default: ApiClient } = require('../lib/core/network/client')

const TOKEN = '123456:SECRET-abc_DEF'
const SECRET = 'SECRET-abc_DEF'
const ADDRESS = 'https://api.telegram.org/bot[REDACTED]/getMe'

// What a call rejects with when the request rejects with this.
const failing = (make, token = TOKEN) => {
  rejection = make
  return new ApiClient(token).callApi('getMe', {}).then(
    () => undefined,
    (reason) => reason
  )
}

test.serial('the token is removed from a failed request', async (t) => {
  // As node-fetch reports it.
  let thrown
  const error = await failing((url) => {
    thrown = new Error(`request to ${url} failed, reason: ECONNREFUSED`)
    // A stack is written when it is first read, as by anything that logged the error.
    t.true(thrown.stack.includes(SECRET))
    return thrown
  })

  t.is(error, thrown)
  t.is(error.message, `request to ${ADDRESS} failed, reason: ECONNREFUSED`)
  t.false(error.stack.includes(SECRET))
})

test.serial(
  'an error whose message cannot be assigned is passed on',
  async (t) => {
    // Issue 2078. Where the request is the runtime's own, an aborted one rejects with a
    // DOMException, and assigning its message throws.
    const aborted = new DOMException('The operation was aborted.', 'AbortError')

    t.is(await failing(() => aborted), aborted)
  }
)

test.serial(
  'the token is removed from where a runtime puts the address',
  async (t) => {
    // Bun: not in the message, but in a property that cannot be redefined.
    const error = await failing((url) =>
      Object.defineProperty(new TypeError('Unable to connect'), 'path', {
        value: url,
        writable: true,
        enumerable: true,
      })
    )

    t.true(error instanceof TypeError)
    t.is(error.path, ADDRESS)
  }
)

test.serial('a rejection that is not an error is passed on', async (t) => {
  // A signal can be aborted with any reason.
  t.is(await failing(() => 'shutting down'), 'shutting down')
})

test.serial('ApiClient trims the token', async (t) => {
  // A newline often follows a token that was read from a file.
  for (const token of [TOKEN + '\n', TOKEN + '\r\n', ` ${TOKEN} `]) {
    t.is(new ApiClient(token).token, TOKEN)

    const error = await failing(
      (url) => new Error(`request to ${url} failed`),
      token
    )
    t.is(error.message, `request to ${ADDRESS} failed`, JSON.stringify(token))
  }
})

test.serial('a missing token is reported by the call', async (t) => {
  // As with `new Telegraf(process.env.BOT_TOKEN)` when the variable is not set.
  const client = new ApiClient(undefined)

  await t.throwsAsync(client.callApi('getMe', {}), {
    message: '401: Bot Token is required',
  })
})

test.serial(
  'the token is removed from the error of an address that cannot be built',
  async (t) => {
    const apiRoot = 'localhost:8081'
    const raw = t.throws(() => new URL(`./bot${TOKEN}/getMe`, apiRoot))
    t.true(raw.input.includes(SECRET), 'the runtime reports the address')

    const client = new ApiClient(TOKEN, { apiRoot })
    const error = await t.throwsAsync(client.callApi('getMe', {}))
    t.is(error.input, './bot[REDACTED]/getMe')
    t.false(String(error.stack).includes(SECRET))
  }
)
