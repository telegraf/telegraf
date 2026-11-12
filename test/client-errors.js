const test = require('ava')

// The client sends through the `node-fetch` package. Bun swaps that package for its own
// fetch, whose errors differ from node-fetch's. This stubs the package the same way, before
// the client loads it, with a fetch that rejects with whatever a test asks for.
let createRejection
const nodeFetch = require.resolve('node-fetch')
require.cache[nodeFetch] = {
  id: nodeFetch,
  filename: nodeFetch,
  loaded: true,
  exports: (url) => Promise.reject(createRejection(String(url))),
}
const { default: ApiClient } = require('../lib/core/network/client')

const TOKEN = '123456:SECRET-abc_DEF'
const SECRET = 'SECRET-abc_DEF'
const ADDRESS = 'https://api.telegram.org/bot[REDACTED]/getMe'

// Returns what a call rejects with when the request rejects with the given value.
const getRejection = (create, token = TOKEN) => {
  createRejection = create
  return new ApiClient(token).callApi('getMe', {}).then(
    () => undefined,
    (reason) => reason
  )
}

test.serial('should redact the token from a request error', async (t) => {
  // The message node-fetch produces.
  let thrown
  const error = await getRejection((url) => {
    thrown = new Error(`request to ${url} failed, reason: ECONNREFUSED`)
    // V8 builds the stack lazily on first read, e.g. when something logs the error.
    t.true(thrown.stack.includes(SECRET))
    return thrown
  })

  t.is(error, thrown)
  t.is(error.message, `request to ${ADDRESS} failed, reason: ECONNREFUSED`)
  t.false(error.stack.includes(SECRET))
})

test.serial('should rethrow an error with a read-only message', async (t) => {
  // Issue 2078. A runtime's own fetch rejects an aborted request with a DOMException,
  // and assigning to its message throws.
  const aborted = new DOMException('The operation was aborted.', 'AbortError')

  t.is(await getRejection(() => aborted), aborted)
})

test.serial('should redact the token from an error property', async (t) => {
  // Bun puts the URL in a non-configurable property, not in the message.
  const error = await getRejection((url) =>
    Object.defineProperty(new TypeError('Unable to connect'), 'path', {
      value: url,
      writable: true,
      enumerable: true,
    })
  )

  t.true(error instanceof TypeError)
  t.is(error.path, ADDRESS)
})

test.serial('should rethrow a non-Error rejection', async (t) => {
  // A signal can be aborted with any reason.
  t.is(await getRejection(() => 'shutting down'), 'shutting down')
})

test.serial('should trim the token', async (t) => {
  // A token read from a file may end with a newline.
  for (const token of [TOKEN + '\n', TOKEN + '\r\n', ` ${TOKEN} `]) {
    t.is(new ApiClient(token).token, TOKEN)

    const error = await getRejection(
      (url) => new Error(`request to ${url} failed`),
      token
    )
    t.is(error.message, `request to ${ADDRESS} failed`, JSON.stringify(token))
  }
})

test.serial('should throw 401 for a missing token', async (t) => {
  // e.g. `new Telegraf(process.env.BOT_TOKEN)` with the variable unset.
  const client = new ApiClient(undefined)

  await t.throwsAsync(client.callApi('getMe', {}), {
    message: '401: Bot Token is required',
  })
})

test.serial(
  'should redact the token from an invalid apiRoot error',
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
