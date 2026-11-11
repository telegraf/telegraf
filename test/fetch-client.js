const test = require('ava')
const http = require('http')
const { createClient } = require('../lib/core/network/fetch-client')
const { InputFile } = require('../lib/core/network/payload')

const TOKEN = '123456:SECRET-abc_DEF'
const SECRET = 'SECRET-abc_DEF'
const bytes = (text) => new TextEncoder().encode(text)
const soon = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function withServer(handler, run) {
  const server = http.createServer(handler)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    return await run(`http://127.0.0.1:${server.address().port}`)
  } finally {
    server.closeAllConnections()
    server.close()
  }
}

// Answers with what it received.
const echo = (req, res) => {
  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    const result = {
      url: req.url,
      type: req.headers['content-type'],
      length: req.headers['content-length'],
      encoding: req.headers['transfer-encoding'],
      body: Buffer.concat(chunks).toString(),
    }
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ ok: true, result }))
  })
}

// A fetch that records what it was given and answers with a fixed response.
function recorder(answer = { ok: true, result: true }) {
  const calls = []
  const fetch = async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(answer))
  }
  return { calls, fetch }
}

// A fetch that never answers. When its signal aborts it rejects with an error of its own,
// as some runtimes do.
const hanging = (url, init) =>
  new Promise((resolve, reject) => {
    const fail = () => reject(new TypeError('the request was cancelled'))
    if (init.signal.aborted) return fail()
    init.signal.addEventListener('abort', fail)
  })

// Every string on an error, on its causes and on the errors it aggregates.
const strings = (error, seen = new Set()) => {
  if (typeof error === 'string') return error
  if (!error || typeof error !== 'object' || seen.has(error)) return ''
  seen.add(error)
  const found = [String(error.message), String(error.stack)]
  for (const key of Object.getOwnPropertyNames(error)) {
    found.push(String(error[key]))
  }
  for (const inner of [error.cause, ...(error.errors ?? [])]) {
    found.push(strings(inner, seen))
  }
  return found.join('\n')
}

// --- these replace a global, so they run one at a time, before the rest ---------------------

test.serial(
  'agent and attachmentAgent are ignored, with one warning',
  async (t) => {
    const warnings = []
    const emitWarning = process.emitWarning
    process.emitWarning = (...args) => warnings.push(args)
    t.teardown(() => (process.emitWarning = emitWarning))

    const { calls, fetch } = recorder()
    const options = { fetch, agent: {}, attachmentAgent: {} }
    await createClient(TOKEN, options).call({ method: 'getMe' })
    createClient(TOKEN, options)

    t.is(warnings.length, 1)
    t.regex(warnings[0][0], /`agent` and `attachmentAgent` are ignored/)
    t.deepEqual(
      Object.keys(calls[0].init).sort(),
      ['body', 'duplex', 'headers', 'method', 'signal'],
      'nothing but standard options reaches fetch'
    )
  }
)

test.serial('a call leaves no timer and no listener behind', async (t) => {
  const { setTimeout, clearTimeout } = globalThis
  const timers = new Set()
  let started = 0
  globalThis.setTimeout = (callback, ms) => {
    const timer = setTimeout(callback, ms)
    if (ms !== 54321) return timer
    started++
    timers.add(timer)
    return timer
  }
  globalThis.clearTimeout = (timer) => {
    timers.delete(timer)
    clearTimeout(timer)
  }
  t.teardown(() => Object.assign(globalThis, { setTimeout, clearTimeout }))

  const { signal } = new AbortController()
  const listeners = new Set()
  let listened = 0
  const { addEventListener, removeEventListener } = signal
  signal.addEventListener = (type, listener, options) => {
    listened++
    listeners.add(listener)
    addEventListener.call(signal, type, listener, options)
  }
  signal.removeEventListener = (type, listener) => {
    listeners.delete(listener)
    removeEventListener.call(signal, type, listener)
  }

  let failing = false
  const fetch = async () => {
    if (failing) throw new Error('no network')
    return new Response('{"ok":true,"result":true}')
  }
  const client = createClient(TOKEN, { fetch, timeout: 54321 })
  await client.call({ method: 'getMe', signal })
  failing = true
  await t.throwsAsync(client.call({ method: 'getMe', signal }))

  t.is(started, 2)
  t.is(listened, 2)
  t.is(timers.size, 0)
  t.is(listeners.size, 0)
})

test.serial('a timeout too long for a timer is no timeout', async (t) => {
  const { setTimeout } = globalThis
  const delays = []
  globalThis.setTimeout = (callback, ms) => {
    delays.push(ms)
    return setTimeout(callback, ms)
  }
  t.teardown(() => (globalThis.setTimeout = setTimeout))

  const { calls, fetch } = recorder()
  for (const timeout of [Infinity, 2 ** 31, 2 ** 31 - 1]) {
    await createClient(TOKEN, { fetch, timeout }).call({ method: 'getMe' })
  }

  t.is(calls.length, 3)
  t.deepEqual(
    delays.filter((ms) => !(ms < 2 ** 30)),
    [2 ** 31 - 1],
    'only the longest delay a timer can hold was given to one'
  )
})

test.serial(
  'a runtime that cannot build a Request is taken for a browser',
  async (t) => {
    const Request = globalThis.Request
    globalThis.Request = undefined
    t.teardown(() => (globalThis.Request = Request))

    const { calls, fetch } = recorder()
    await createClient(TOKEN, { fetch }).call({ method: 'getMe' })

    t.true(calls[0].init.body instanceof Blob)
  }
)

// A Request as a browser builds it: forbidden headers are dropped.
function asBrowser(t) {
  const Request = globalThis.Request
  globalThis.Request = class {
    constructor() {
      this.headers = new Headers()
    }
  }
  t.teardown(() => (globalThis.Request = Request))
}

test.serial(
  'browser: a call without files is multipart, not JSON',
  async (t) => {
    asBrowser(t)
    await withServer(echo, async (apiRoot) => {
      const { result } = await createClient(TOKEN, { apiRoot }).call({
        method: 'sendMessage',
        payload: { chat_id: 1, text: 'hi' },
      })

      t.regex(result.type, /^multipart\/form-data; boundary=/)
      t.truthy(result.length, 'a body of known length')
      t.is(result.encoding, undefined)
      t.regex(result.body, /name="chat_id"\r\n\r\n1\r\n/)
      t.regex(result.body, /name="text"\r\n\r\nhi\r\n/)
    })
  }
)

test.serial(
  'browser: an upload is a Blob, with streams read into it',
  async (t) => {
    asBrowser(t)
    const { calls, fetch } = recorder()
    await createClient(TOKEN, { fetch }).call({
      method: 'sendDocument',
      payload: {
        chat_id: 1,
        document: new InputFile(async function* () {
          yield bytes('STREAMED')
        }, 'a.txt'),
      },
    })

    const { body } = calls[0].init
    t.true(body instanceof Blob)
    t.regex(await body.text(), /filename="a\.txt"[^]*STREAMED/)
  }
)

test.serial(
  'browser: a stream that never ends is cut off by the timeout',
  async (t) => {
    asBrowser(t)
    const { calls, fetch } = recorder()
    const client = createClient(TOKEN, { fetch, timeout: 100 })
    let cancelled = false
    const document = new InputFile(
      () =>
        new ReadableStream({
          pull: () => new Promise(() => {}),
          cancel() {
            cancelled = true
          },
        })
    )
    const call = client.call({ method: 'sendDocument', payload: { document } })

    await t.throwsAsync(call, { name: 'TimeoutError' })
    t.is(calls.length, 0, 'the request was never sent')
    await soon(20)
    t.true(cancelled, 'the stream is no longer read')
  }
)

// --- the request ----------------------------------------------------------------------------

test('a call without files is sent as JSON', async (t) => {
  await withServer(echo, async (apiRoot) => {
    const response = await createClient(TOKEN, { apiRoot }).call({
      method: 'sendMessage',
      payload: { chat_id: 1, text: 'hi', reply_markup: null },
    })

    t.true(response.ok)
    t.is(response.result.url, `/bot${TOKEN}/sendMessage`)
    t.is(response.result.type, 'application/json')
    t.deepEqual(JSON.parse(response.result.body), { chat_id: 1, text: 'hi' })
  })
})

test('a call with a file is streamed as multipart', async (t) => {
  await withServer(echo, async (apiRoot) => {
    const { result } = await createClient(TOKEN, { apiRoot }).call({
      method: 'sendDocument',
      payload: {
        chat_id: 1,
        document: new InputFile(async function* () {
          yield bytes('FILE')
        }, 'a.txt'),
      },
    })

    t.regex(result.type, /^multipart\/form-data; boundary=/)
    t.is(result.encoding, 'chunked')
    t.regex(result.body, /name="chat_id"\r\n\r\n1\r\n/)
    t.regex(result.body, /filename="a\.txt"[^]*\r\n\r\nFILE\r\n/)
  })
})

test('every request is a POST that declares duplex', async (t) => {
  const { calls, fetch } = recorder()
  const client = createClient(TOKEN, { fetch })
  await client.call({ method: 'getMe' })
  await client.call({
    method: 'sendPhoto',
    payload: { photo: new InputFile(bytes('x')) },
  })

  t.is(calls[0].init.body, '{}', 'no payload is an empty object')
  t.true(calls[1].init.body instanceof ReadableStream)
  for (const { init } of calls) {
    t.is(init.method, 'POST')
    t.is(init.duplex, 'half')
    t.true(init.signal instanceof AbortSignal)
  }
})

test('the address is built from the root, the mode and the environment', async (t) => {
  const { calls, fetch } = recorder()
  await createClient(TOKEN, { fetch }).call({ method: 'getMe' })
  await createClient(TOKEN, {
    fetch,
    apiRoot: 'http://localhost:8081/api/',
    apiMode: 'user',
    testEnv: true,
  }).call({ method: 'getMe' })

  t.is(calls[0].url, `https://api.telegram.org/bot${TOKEN}/getMe`)
  t.is(calls[1].url, `http://localhost:8081/api/user${TOKEN}/test/getMe`)
})

test('a payload can be sent again, and is left as it was', async (t) => {
  let opened = 0
  const document = new InputFile(() => {
    opened++
    return new Blob(['FILE']).stream()
  })
  const payload = { chat_id: 1, document }
  await withServer(echo, async (apiRoot) => {
    const client = createClient(TOKEN, { apiRoot })
    const first = await client.call({ method: 'sendDocument', payload })
    const second = await client.call({ method: 'sendDocument', payload })

    t.regex(first.result.body, /FILE/)
    t.regex(second.result.body, /FILE/)
  })
  t.is(opened, 2, 'the stream is opened once for each upload')
  t.is(payload.document, document)
})

test('a fetch that cannot send a stream is refused', async (t) => {
  // node-fetch 2 would otherwise upload the text "[object ReadableStream]".
  const client = createClient(TOKEN, { fetch: require('node-fetch') })
  const call = client.call({
    method: 'sendPhoto',
    payload: { photo: new InputFile(bytes('x')) },
  })

  await t.throwsAsync(call, { message: /cannot send a ReadableStream/ })
})

// --- the response ---------------------------------------------------------------------------

test('a response is returned whether or not the API accepted the call', async (t) => {
  const refusal = { ok: false, error_code: 400, description: 'Bad Request' }
  const { fetch } = recorder(refusal)

  t.deepEqual(
    await createClient(TOKEN, { fetch }).call({ method: 'getMe' }),
    refusal
  )
})

// A call that is answered with this status and body.
const answered = (status, statusText, body) => {
  const fetch = async () => new Response(body, { status, statusText })
  return createClient(TOKEN, { fetch }).call({ method: 'getMe' })
}

test('an error from the API is returned whole, whatever its status', async (t) => {
  const answer = {
    ok: false,
    error_code: 502,
    description: 'Bad Gateway: restart',
    parameters: { retry_after: 3 },
  }

  t.deepEqual(
    await answered(502, 'Bad Gateway', JSON.stringify(answer)),
    answer
  )
})

test('an error that is not from the API is reported by its status', async (t) => {
  t.deepEqual(await answered(413, 'Request Entity Too Large', '<html>'), {
    ok: false,
    error_code: 413,
    description: 'Request Entity Too Large',
  })
  t.deepEqual(
    await answered(502, '', '<html>'),
    { ok: false, error_code: 502, description: 'HTTP 502' },
    'there is no status text over HTTP/2'
  )
  t.deepEqual(
    await answered(403, 'Forbidden', '{"error":"blocked"}'),
    { ok: false, error_code: 403, description: 'Forbidden' },
    'JSON, but not the API'
  )
})

test('a successful response that is not from the API is an error', async (t) => {
  for (const body of ['<html>', '', 'null', '{"error":"blocked"}']) {
    await t.throwsAsync(
      answered(200, 'OK', body),
      { message: 'getMe: HTTP 200 is not a Bot API response' },
      body
    )
  }
})

test('a response that cannot be read is the error of the call', async (t) => {
  // The connection was lost, which is not a body that is not JSON.
  const lost = new TypeError('terminated')
  const fetch = async () => ({
    status: 200,
    statusText: 'OK',
    json: () => Promise.reject(lost),
  })

  await t.throwsAsync(
    createClient(TOKEN, { fetch }).call({ method: 'getMe' }),
    { is: lost }
  )
})

// --- failures -------------------------------------------------------------------------------

const failingFile = (error) =>
  new InputFile(async function* () {
    yield bytes('part')
    throw error
  })

test('a file that fails is the error of the call', async (t) => {
  const error = new Error('disk on fire')
  await withServer(echo, async (apiRoot) => {
    const call = createClient(TOKEN, { apiRoot }).call({
      method: 'sendDocument',
      payload: { document: failingFile(error) },
    })

    await t.throwsAsync(call, { is: error })
  })
})

test('a file that fails is the error even when the request resolves', async (t) => {
  // As on Cloudflare Workers: what was read is sent, and the request succeeds.
  const error = new Error('disk on fire')
  const fetch = async (url, init) => {
    const reader = init.body.getReader()
    try {
      while (!(await reader.read()).done);
    } catch {
      // the runtime carries on
    }
    return new Response(JSON.stringify({ ok: true, result: true }))
  }
  const call = createClient(TOKEN, { fetch }).call({
    method: 'sendDocument',
    payload: { document: failingFile(error) },
  })

  await t.throwsAsync(call, { is: error })
})

test('aborting rejects with an AbortError and releases the file', async (t) => {
  // Node leaves the body of an aborted request open.
  let released = false
  const document = new InputFile(async function* () {
    try {
      for (;;) {
        yield new Uint8Array(1024)
        await soon(10)
      }
    } finally {
      released = true
    }
  })
  await withServer(
    (req) => req.resume(),
    async (apiRoot) => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 100)
      const call = createClient(TOKEN, { apiRoot }).call({
        method: 'sendDocument',
        payload: { document },
        signal: controller.signal,
      })

      await t.throwsAsync(call, { name: 'AbortError' })
      await soon(100)
      t.true(released)
    }
  )
})

test('aborting rejects with the reason the caller gave', async (t) => {
  const reason = new Error('shutting down')
  const controller = new AbortController()
  const call = createClient(TOKEN, { fetch: hanging }).call({
    method: 'getUpdates',
    signal: controller.signal,
  })
  controller.abort(reason)
  await t.throwsAsync(call, { is: reason })

  const again = createClient(TOKEN, { fetch: hanging }).call({
    method: 'getUpdates',
    signal: controller.signal,
  })
  await t.throwsAsync(
    again,
    { is: reason },
    'a signal that had already aborted'
  )
})

test('a call that takes too long is abandoned', async (t) => {
  await withServer(
    (req) => req.resume(),
    async (apiRoot) => {
      const client = createClient(TOKEN, { apiRoot, timeout: 100 })
      const error = await t.throwsAsync(client.call({ method: 'getUpdates' }), {
        name: 'TimeoutError',
      })

      t.regex(error.message, /getUpdates did not complete in 100 ms/)
    }
  )
})

test('a timeout that is not a positive number is refused', (t) => {
  for (const timeout of [0, -1, NaN]) {
    t.throws(() => createClient(TOKEN, { timeout }), {
      instanceOf: RangeError,
    })
  }
})

test('a file that never stops does not hold the result back', async (t) => {
  // Cancelling it never completes.
  const document = new InputFile(
    () =>
      new ReadableStream({
        start: (controller) => controller.enqueue(bytes('x')),
        cancel: () => new Promise(() => {}),
      })
  )
  await withServer(
    (req) => req.resume(),
    async (apiRoot) => {
      const client = createClient(TOKEN, { apiRoot, timeout: 100 })
      const call = client.call({
        method: 'sendDocument',
        payload: { document },
      })

      await t.throwsAsync(call, { name: 'TimeoutError' })
    }
  )
})

test('the token is removed from an error, its stack, its properties and its cause', async (t) => {
  // Runtimes report the address of a failed request in different places.
  let thrown
  const fetch = async (url) => {
    thrown = new Error(`request to ${url} failed`, {
      cause: new Error(`error sending request for url (${url})`),
    })
    thrown.path = url
    // One that is not enumerable.
    Object.defineProperty(thrown, 'input', {
      value: url,
      writable: true,
      configurable: true,
    })
    // A stack is written when it is first read, as by anything that logged the error.
    t.true(thrown.stack.includes(SECRET))
    throw thrown
  }
  const error = await t.throwsAsync(
    createClient(TOKEN, { fetch }).call({ method: 'getMe' })
  )

  t.is(error, thrown, 'the error itself is kept')
  t.false(strings(error).includes(SECRET))
  t.regex(error.message, /\/bot\[REDACTED\]\/getMe/)
  t.regex(error.cause.message, /bot\[REDACTED\]/)
  t.is(error.path, 'https://api.telegram.org/bot[REDACTED]/getMe')
  t.is(error.input, error.path)
})

// What a call rejects with when its fetch throws this.
const failing = (make, token = TOKEN) => {
  const fetch = async (url) => {
    throw make(url)
  }
  return createClient(token, { fetch })
    .call({ method: 'getMe' })
    .then(
      () => undefined,
      (reason) => reason
    )
}

test('the token is removed from aggregated errors and from a string', async (t) => {
  const aggregate = await failing(
    (url) => new AggregateError([new Error(`connect to ${url}`)], 'no route')
  )
  t.false(strings(aggregate).includes(SECRET))
  t.regex(aggregate.errors[0].message, /bot\[REDACTED\]/)

  t.is(
    await failing((url) => `request to ${url} failed`),
    'request to https://api.telegram.org/bot[REDACTED]/getMe failed'
  )
})

test('createClient trims the token', async (t) => {
  // A newline often follows a token that was read from a file.
  for (const token of [TOKEN + '\n', TOKEN + '\r\n', ` ${TOKEN} `]) {
    const { calls, fetch } = recorder()
    await createClient(token, { fetch }).call({ method: 'getMe' })
    t.is(calls[0].url, `https://api.telegram.org/bot${TOKEN}/getMe`)

    const error = await failing(
      (url) => new Error(`request to ${url} failed`),
      token
    )
    t.is(
      error.message,
      'request to https://api.telegram.org/bot[REDACTED]/getMe failed',
      JSON.stringify(token)
    )
  }
})

test('an empty token changes nothing', async (t) => {
  const error = await failing(
    (url) => new Error(`request to ${url} failed`),
    ''
  )

  t.is(error.message, 'request to https://api.telegram.org/bot/getMe failed')
})

test('the token is removed from the error of an address that cannot be built', async (t) => {
  const apiRoot = 'localhost:8081'
  const raw = t.throws(() => new URL(`./bot${TOKEN}/getMe`, apiRoot))
  t.true(strings(raw).includes(SECRET), 'the runtime reports the address')

  const client = createClient(TOKEN, { apiRoot })
  const error = await t.throwsAsync(client.call({ method: 'getMe' }))
  t.false(strings(error).includes(SECRET))
})

test('the token is removed from the error of a file', async (t) => {
  // A file may itself be downloaded from the API, at an address that holds the token.
  const error = new Error(`no https://api.telegram.org/file/bot${TOKEN}/a.jpg`)
  await withServer(echo, async (apiRoot) => {
    const call = createClient(TOKEN, { apiRoot }).call({
      method: 'sendDocument',
      payload: { document: failingFile(error) },
    })

    await t.throwsAsync(call, { is: error })
    t.is(error.message, 'no https://api.telegram.org/file/bot[REDACTED]/a.jpg')
  })
})

test('a property that can only be assigned is cleaned in place', async (t) => {
  // As Bun reports the address: writable, but not configurable.
  let thrown
  const error = await failing((url) => {
    thrown = Object.assign(new TypeError('fetch failed'), {
      code: 'ECONNREFUSED',
    })
    return Object.defineProperty(thrown, 'path', {
      value: url,
      writable: true,
      enumerable: true,
    })
  })

  t.is(error, thrown)
  t.is(error.code, 'ECONNREFUSED')
  t.is(error.path, 'https://api.telegram.org/bot[REDACTED]/getMe')
})

test('a message and a stack that are inherited getters are cleaned in place', async (t) => {
  // As a DOMException has its message, and some engines every stack.
  class Failure extends Error {
    #address

    constructor(address) {
      super()
      this.#address = address
    }

    get message() {
      return `request to ${this.#address} failed`
    }

    get stack() {
      return `Failure: at ${this.#address}`
    }
  }
  let thrown
  const error = await failing((url) => {
    thrown = new Failure(url)
    delete thrown.stack
    t.true(thrown.stack.includes(SECRET))
    return thrown
  })

  t.is(error, thrown)
  t.false(strings(error).includes(SECRET))
  t.regex(error.message, /bot\[REDACTED\]/)
  t.regex(error.stack, /bot\[REDACTED\]/)
})

test('an error that cannot be changed is replaced', async (t) => {
  const error = await failing((url) => {
    const error = new TypeError(`request to ${url} failed`)
    return Object.freeze(Object.assign(error, { path: url }))
  })

  t.false(strings(error).includes(SECRET))
  t.is(error.name, 'TypeError')
  t.regex(error.message, /bot\[REDACTED\]/)
  t.regex(error.path, /bot\[REDACTED\]/)
})

test('an error with a cause that cannot be changed is replaced as a whole', async (t) => {
  const error = await failing((url) => {
    const cause = Object.freeze(new Error(`connect failed for ${url}`))
    const error = new TypeError('fetch failed', { cause })
    return Object.assign(error, { code: 'UND_ERR', errno: 7 })
  })

  t.false(strings(error).includes(SECRET))
  t.like(error, {
    name: 'TypeError',
    message: 'fetch failed',
    code: 'UND_ERR',
    errno: 7,
  })
})
