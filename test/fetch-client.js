const test = require('ava')
const http = require('http')
const { createClient } = require('../lib/core/network/fetch-client')
const { MultipartFile } = require('../lib/core/network/payload')
const { fixtures } = require('./_helpers')

const TOKEN = '123456:SECRET-abc_DEF'
const SECRET = 'SECRET-abc_DEF'
const bytes = (text) => new TextEncoder().encode(text)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

// Echoes the request back.
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

// Collects every string on an error, its causes and its aggregated errors.
const collectStrings = (error, seen = new Set()) => {
  if (typeof error === 'string') return error
  if (!error || typeof error !== 'object' || seen.has(error)) return ''
  seen.add(error)
  const found = [String(error.message), String(error.stack)]
  for (const key of Object.getOwnPropertyNames(error)) {
    found.push(String(error[key]))
  }
  for (const inner of [error.cause, ...(error.errors ?? [])]) {
    found.push(collectStrings(inner, seen))
  }
  return found.join('\n')
}

// --- these stub a global, so they run serially, before the others ---------------------------

test.serial('should warn once about agent and attachmentAgent', async (t) => {
  const warnings = []
  const emitWarning = process.emitWarning
  process.emitWarning = (...args) => warnings.push(args)
  t.teardown(() => (process.emitWarning = emitWarning))

  const { calls, fetch } = fixtures.fetch.recorder()
  const options = { fetch, agent: {}, attachmentAgent: {} }
  await createClient(TOKEN, options).call({ method: 'getMe' })
  createClient(TOKEN, options)

  t.is(warnings.length, 1)
  t.regex(warnings[0][0], /`agent` and `attachmentAgent` are ignored/)
  t.deepEqual(
    Object.keys(calls[0].init).sort(),
    ['body', 'duplex', 'headers', 'method', 'signal'],
    'only standard options reach fetch'
  )
})

test.serial('should clear its timer and abort listener', async (t) => {
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

test.serial(
  'should not set a timer for a timeout over the setTimeout limit',
  async (t) => {
    const { setTimeout } = globalThis
    const delays = []
    globalThis.setTimeout = (callback, ms) => {
      delays.push(ms)
      return setTimeout(callback, ms)
    }
    t.teardown(() => (globalThis.setTimeout = setTimeout))

    const { calls, fetch } = fixtures.fetch.recorder()
    for (const timeout of [Infinity, 2 ** 31, 2 ** 31 - 1]) {
      await createClient(TOKEN, { fetch, timeout }).call({ method: 'getMe' })
    }

    t.is(calls.length, 3)
    t.deepEqual(
      delays.filter((ms) => !(ms < 2 ** 30)),
      [2 ** 31 - 1],
      'only the longest delay a timer can hold was given to one'
    )
  }
)

test.serial(
  'should use browser mode when Request is unavailable',
  async (t) => {
    const Request = globalThis.Request
    globalThis.Request = undefined
    t.teardown(() => (globalThis.Request = Request))

    const { calls, fetch } = fixtures.fetch.recorder()
    await createClient(TOKEN, { fetch }).call({ method: 'getMe' })

    t.true(calls[0].init.body instanceof Blob)
  }
)

// Stubs Request the way a browser builds it: forbidden headers are dropped.
function stubBrowserRequest(t) {
  const Request = globalThis.Request
  globalThis.Request = class {
    constructor() {
      this.headers = new Headers()
    }
  }
  t.teardown(() => (globalThis.Request = Request))
}

test.serial(
  'should send multipart instead of JSON in browser mode',
  async (t) => {
    stubBrowserRequest(t)
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

test.serial('should upload a Blob in browser mode', async (t) => {
  stubBrowserRequest(t)
  const { calls, fetch } = fixtures.fetch.recorder()
  await createClient(TOKEN, { fetch }).call({
    method: 'sendDocument',
    payload: {
      chat_id: 1,
      document: new MultipartFile(async function* () {
        yield bytes('STREAMED')
      }, 'a.txt'),
    },
  })

  const { body } = calls[0].init
  t.true(body instanceof Blob)
  t.regex(await body.text(), /filename="a\.txt"[^]*STREAMED/)
})

test.serial('should time out while buffering in browser mode', async (t) => {
  stubBrowserRequest(t)
  const { calls, fetch } = fixtures.fetch.recorder()
  const client = createClient(TOKEN, { fetch, timeout: 100 })
  let cancelled = false
  const document = new MultipartFile(
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
  await delay(20)
  t.true(cancelled, 'the stream is no longer read')
})

// --- the request ----------------------------------------------------------------------------

test('should send a call without files as JSON', async (t) => {
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

test('should stream a call with a file as multipart', async (t) => {
  await withServer(echo, async (apiRoot) => {
    const { result } = await createClient(TOKEN, { apiRoot }).call({
      method: 'sendDocument',
      payload: {
        chat_id: 1,
        document: new MultipartFile(async function* () {
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

test('should send a POST with duplex half', async (t) => {
  const { calls, fetch } = fixtures.fetch.recorder()
  const client = createClient(TOKEN, { fetch })
  await client.call({ method: 'getMe' })
  await client.call({
    method: 'sendPhoto',
    payload: { photo: new MultipartFile(bytes('x')) },
  })

  t.is(calls[0].init.body, '{}', 'no payload is an empty object')
  t.true(calls[1].init.body instanceof ReadableStream)
  for (const { init } of calls) {
    t.is(init.method, 'POST')
    t.is(init.duplex, 'half')
    t.true(init.signal instanceof AbortSignal)
  }
})

test('should build the URL from apiRoot, apiMode and testEnv', async (t) => {
  const { calls, fetch } = fixtures.fetch.recorder()
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

test('should send the same payload twice', async (t) => {
  let opened = 0
  const document = new MultipartFile(() => {
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

test('should reject a fetch without stream support', async (t) => {
  // node-fetch 2 would otherwise upload the text "[object ReadableStream]".
  const client = createClient(TOKEN, { fetch: require('node-fetch') })
  const call = client.call({
    method: 'sendPhoto',
    payload: { photo: new MultipartFile(bytes('x')) },
  })

  await t.throwsAsync(call, { message: /cannot send a ReadableStream/ })
})

// --- the response ---------------------------------------------------------------------------

test('should return an API error response', async (t) => {
  const refusal = { ok: false, error_code: 400, description: 'Bad Request' }
  const fetch = async () => new Response(JSON.stringify(refusal))

  t.deepEqual(
    await createClient(TOKEN, { fetch }).call({ method: 'getMe' }),
    refusal
  )
})

// Makes a call that is answered with the given status and body.
const callWithResponse = (status, statusText, body) => {
  const fetch = async () => new Response(body, { status, statusText })
  return createClient(TOKEN, { fetch }).call({ method: 'getMe' })
}

test('should return the API error body for a 5xx status', async (t) => {
  const answer = {
    ok: false,
    error_code: 502,
    description: 'Bad Gateway: restart',
    parameters: { retry_after: 3 },
  }

  t.deepEqual(
    await callWithResponse(502, 'Bad Gateway', JSON.stringify(answer)),
    answer
  )
})

test('should return an HTTP status error for a non-API response', async (t) => {
  t.deepEqual(
    await callWithResponse(413, 'Request Entity Too Large', '<html>'),
    {
      ok: false,
      error_code: 413,
      description: 'Request Entity Too Large',
    }
  )
  t.deepEqual(
    await callWithResponse(502, '', '<html>'),
    { ok: false, error_code: 502, description: 'HTTP 502' },
    'HTTP/2 responses do not have a status text'
  )
  t.deepEqual(
    await callWithResponse(403, 'Forbidden', '{"error":"blocked"}'),
    { ok: false, error_code: 403, description: 'Forbidden' },
    'JSON, but not the API'
  )
})

test('should reject a non-API 2xx response', async (t) => {
  for (const body of ['<html>', '', 'null', '{"error":"blocked"}']) {
    await t.throwsAsync(
      callWithResponse(200, 'OK', body),
      { message: 'getMe: HTTP 200 is not a Bot API response' },
      body
    )
  }
})

test('should reject with a response read error', async (t) => {
  // A dropped connection, as opposed to a body that is not JSON.
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

test('should reject with a file error', async (t) => {
  const error = new Error('disk on fire')
  await withServer(echo, async (apiRoot) => {
    const call = createClient(TOKEN, { apiRoot }).call({
      method: 'sendDocument',
      payload: { document: fixtures.file.failing(error) },
    })

    await t.throwsAsync(call, { is: error })
  })
})

test('should reject with a file error when the request resolves', async (t) => {
  // Like Cloudflare Workers: the partial body is sent and the request still resolves.
  const error = new Error('disk on fire')
  const fetch = async (url, init) => {
    const reader = init.body.getReader()
    try {
      while (!(await reader.read()).done);
    } catch {
      // the runtime ignores the body error
    }
    return new Response(JSON.stringify({ ok: true, result: true }))
  }
  const call = createClient(TOKEN, { fetch }).call({
    method: 'sendDocument',
    payload: { document: fixtures.file.failing(error) },
  })

  await t.throwsAsync(call, { is: error })
})

test('should reject with an AbortError on abort', async (t) => {
  // Node leaves the request body open after an abort.
  let released = false
  const document = new MultipartFile(async function* () {
    try {
      for (;;) {
        yield new Uint8Array(1024)
        await delay(10)
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
      await delay(100)
      t.true(released)
    }
  )
})

test('should reject with the abort reason', async (t) => {
  const reason = new Error('shutting down')
  const controller = new AbortController()
  const call = createClient(TOKEN, { fetch: fixtures.fetch.hanging() }).call({
    method: 'getUpdates',
    signal: controller.signal,
  })
  controller.abort(reason)
  await t.throwsAsync(call, { is: reason })

  const again = createClient(TOKEN, { fetch: fixtures.fetch.hanging() }).call({
    method: 'getUpdates',
    signal: controller.signal,
  })
  await t.throwsAsync(
    again,
    { is: reason },
    'a signal that had already aborted'
  )
})

test('should reject with a TimeoutError on timeout', async (t) => {
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

test('should throw a RangeError for an invalid timeout', (t) => {
  for (const timeout of [0, -1, NaN]) {
    t.throws(() => createClient(TOKEN, { timeout }), {
      instanceOf: RangeError,
    })
  }
})

test('should not wait for a pending file cancel', async (t) => {
  // The file's cancel() never settles.
  const document = new MultipartFile(
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

test('should redact the token from an error', async (t) => {
  // Runtimes put the URL of a failed request in different places.
  let thrown
  const fetch = async (url) => {
    thrown = new Error(`request to ${url} failed`, {
      cause: new Error(`error sending request for url (${url})`),
    })
    thrown.path = url
    // A non-enumerable property.
    Object.defineProperty(thrown, 'input', {
      value: url,
      writable: true,
      configurable: true,
    })
    // V8 builds the stack lazily on first read, e.g. when something logs the error.
    t.true(thrown.stack.includes(SECRET))
    throw thrown
  }
  const error = await t.throwsAsync(
    createClient(TOKEN, { fetch }).call({ method: 'getMe' })
  )

  t.is(error, thrown, 'the error itself is kept')
  t.false(collectStrings(error).includes(SECRET))
  t.regex(error.message, /\/bot\[REDACTED\]\/getMe/)
  t.regex(error.cause.message, /bot\[REDACTED\]/)
  t.is(error.path, 'https://api.telegram.org/bot[REDACTED]/getMe')
  t.is(error.input, error.path)
})

// Returns what a call rejects with when its fetch throws the given value.
const getRejection = (create, token = TOKEN) => {
  const fetch = async (url) => {
    throw create(url)
  }
  return createClient(token, { fetch })
    .call({ method: 'getMe' })
    .then(
      () => undefined,
      (reason) => reason
    )
}

test('should redact the token from an AggregateError and a string', async (t) => {
  const aggregate = await getRejection(
    (url) => new AggregateError([new Error(`connect to ${url}`)], 'no route')
  )
  t.false(collectStrings(aggregate).includes(SECRET))
  t.regex(aggregate.errors[0].message, /bot\[REDACTED\]/)

  t.is(
    await getRejection((url) => `request to ${url} failed`),
    'request to https://api.telegram.org/bot[REDACTED]/getMe failed'
  )
})

test('should trim the token', async (t) => {
  // A token read from a file may end with a newline.
  for (const token of [TOKEN + '\n', TOKEN + '\r\n', ` ${TOKEN} `]) {
    const { calls, fetch } = fixtures.fetch.recorder()
    await createClient(token, { fetch }).call({ method: 'getMe' })
    t.is(calls[0].url, `https://api.telegram.org/bot${TOKEN}/getMe`)

    const error = await getRejection(
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

test('should not redact an error for an empty token', async (t) => {
  const error = await getRejection(
    (url) => new Error(`request to ${url} failed`),
    ''
  )

  t.is(error.message, 'request to https://api.telegram.org/bot/getMe failed')
})

test('should redact the token from an invalid apiRoot error', async (t) => {
  const apiRoot = 'localhost:8081'
  const raw = t.throws(() => new URL(`./bot${TOKEN}/getMe`, apiRoot))
  t.true(
    collectStrings(raw).includes(SECRET),
    'the runtime reports the address'
  )

  const client = createClient(TOKEN, { apiRoot })
  const error = await t.throwsAsync(client.call({ method: 'getMe' }))
  t.false(collectStrings(error).includes(SECRET))
})

test('should redact the token from a file error', async (t) => {
  // A file source may download from the Bot API, at a URL that contains the token.
  const error = new Error(`no https://api.telegram.org/file/bot${TOKEN}/a.jpg`)
  await withServer(echo, async (apiRoot) => {
    const call = createClient(TOKEN, { apiRoot }).call({
      method: 'sendDocument',
      payload: { document: fixtures.file.failing(error) },
    })

    await t.throwsAsync(call, { is: error })
    t.is(error.message, 'no https://api.telegram.org/file/bot[REDACTED]/a.jpg')
  })
})

test('should redact a non-configurable property', async (t) => {
  // Bun reports the URL in a property that is writable but not configurable.
  let thrown
  const error = await getRejection((url) => {
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

test('should redact an inherited getter', async (t) => {
  // Like DOMException's message, and the stack in some engines.
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
  const error = await getRejection((url) => {
    thrown = new Failure(url)
    delete thrown.stack
    t.true(thrown.stack.includes(SECRET))
    return thrown
  })

  t.is(error, thrown)
  t.false(collectStrings(error).includes(SECRET))
  t.regex(error.message, /bot\[REDACTED\]/)
  t.regex(error.stack, /bot\[REDACTED\]/)
})

test('should replace a frozen error', async (t) => {
  const error = await getRejection((url) => {
    const error = new TypeError(`request to ${url} failed`)
    return Object.freeze(Object.assign(error, { path: url }))
  })

  t.false(collectStrings(error).includes(SECRET))
  t.is(error.name, 'TypeError')
  t.regex(error.message, /bot\[REDACTED\]/)
  t.regex(error.path, /bot\[REDACTED\]/)
})

test('should replace an error with a frozen cause', async (t) => {
  const error = await getRejection((url) => {
    const cause = Object.freeze(new Error(`connect failed for ${url}`))
    const error = new TypeError('fetch failed', { cause })
    return Object.assign(error, { code: 'UND_ERR', errno: 7 })
  })

  t.false(collectStrings(error).includes(SECRET))
  t.like(error, {
    name: 'TypeError',
    message: 'fetch failed',
    code: 'UND_ERR',
    errno: 7,
  })
})
