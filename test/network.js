'use strict'

const { default: test } = require('ava')
const { createServer } = require('node:http')
const { once, getEventListeners } = require('node:events')
const { inspect } = require('node:util')
const { Telegram, TelegrafNetworkError, TelegramError } = require('../')
const { Polling } = require('../lib/core/network/polling')

test('synchronous custom fetch failures use the network error boundary', async (t) => {
  const original = new TypeError('failed bot123:secret/getMe')
  const telegram = new Telegram('123:secret', {
    fetch: () => {
      throw original
    },
  })
  const error = await t.throwsAsync(telegram.getMe())
  t.true(error instanceof TelegrafNetworkError)
  t.is(error.errorName, 'TypeError')
  t.false(inspect(error, { depth: null }).includes('secret'))
  t.true(original.message.includes('secret'))
})

for (const abort of [false, true]) {
  test.serial(
    `signal fallback covers body consumption (caller abort: ${abort})`,
    async (t) => {
      const any = Object.getOwnPropertyDescriptor(AbortSignal, 'any')
      Object.defineProperty(AbortSignal, 'any', {
        value: undefined,
        configurable: true,
      })
      const controller = new AbortController()
      const server = createServer((_req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.flushHeaders()
        if (abort) setTimeout(() => controller.abort(), 20)
      })
      t.teardown(() => {
        controller.abort()
        server.closeAllConnections()
        server.close()
        if (any) Object.defineProperty(AbortSignal, 'any', any)
        else delete AbortSignal.any
      })
      server.listen(0, '127.0.0.1')
      await once(server, 'listening')
      const telegram = new Telegram('123:secret', {
        apiRoot: `http://127.0.0.1:${server.address().port}`,
        requestTimeout: abort ? 2000 : 100,
      })
      const error = await t.throwsAsync(
        telegram.callApi('getMe', {}, { signal: controller.signal })
      )
      t.true(error instanceof TelegrafNetworkError)
      t.is(error.errorName, abort ? 'AbortError' : 'TimeoutError')
      t.is(error.transient, !abort)
      t.is(getEventListeners(controller.signal, 'abort').length, 0)
    }
  )
}

for (const status of [401, 409, 429]) {
  test(`unreadable HTTP ${status} responses retain their status`, async (t) => {
    const telegram = new Telegram('123:secret', {
      fetch: async () => ({
        status,
        statusText: 'Rejected',
        json: async () => {
          throw new Error('broken JSON')
        },
      }),
    })
    const error = await t.throwsAsync(telegram.getMe())
    t.true(error instanceof TelegramError)
    t.is(error.code, status)
  })
}

test.serial(
  'timeout fallback preserves timeout and caller abort reasons',
  async (t) => {
    // The fake transport lacks a socket to keep the unref'ed timeout alive.
    const keepAlive = setInterval(() => undefined, 1000)
    t.teardown(() => clearInterval(keepAlive))
    const any = Object.getOwnPropertyDescriptor(AbortSignal, 'any')
    Object.defineProperty(AbortSignal, 'any', {
      value: undefined,
      configurable: true,
    })
    t.teardown(() => {
      if (any) Object.defineProperty(AbortSignal, 'any', any)
      else delete AbortSignal.any
    })
    const controller = new AbortController()
    const telegram = new Telegram('123:secret', {
      requestTimeout: 10,
      fetch: async (_url, init) => {
        init.signal.throwIfAborted()
        return await new Promise((_resolve, reject) => {
          init.signal.addEventListener(
            'abort',
            () => reject(init.signal.reason),
            { once: true }
          )
        })
      },
    })
    const timeout = await t.throwsAsync(
      telegram.callApi('getMe', {}, { signal: controller.signal })
    )
    t.is(timeout.errorName, 'TimeoutError')
    t.true(timeout.transient)
    controller.abort(new DOMException('User stopped', 'AbortError'))
    const abort = await t.throwsAsync(
      telegram.callApi('getMe', {}, { signal: controller.signal })
    )
    t.is(abort.errorName, 'AbortError')
    t.false(abort.transient)
  }
)

test('polling stops cleanly when its active request is aborted', async (t) => {
  const telegram = new Telegram('123:secret', {
    fetch: async (_url, init) => {
      if (JSON.parse(init.body).limit === 1) {
        return {
          status: 200,
          json: async () => ({ ok: true, result: [] }),
        }
      }
      return await new Promise((_resolve, reject) => {
        init.signal.addEventListener(
          'abort',
          () => reject(init.signal.reason),
          { once: true }
        )
        polling.stop()
      })
    },
  })
  const polling = new Polling(telegram, [])
  await t.notThrowsAsync(polling.loop(async () => undefined))
})

test('native request timeouts are retryable network errors', async (t) => {
  const server = createServer(() => undefined)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.teardown(() => {
    server.closeAllConnections()
    server.close()
  })
  const telegram = new Telegram('123:secret', {
    apiRoot: `http://127.0.0.1:${server.address().port}`,
    requestTimeout: 30,
  })
  const error = await t.throwsAsync(telegram.getMe())
  t.true(error instanceof TelegrafNetworkError)
  t.is(error.errorName, 'TimeoutError')
  t.true(error.transient)
})

test('response body failures cross the same network error boundary', async (t) => {
  const original = new TypeError('bot123:secret disconnected', {
    cause: Object.assign(new Error('socket closed'), {
      code: 'UND_ERR_SOCKET',
    }),
  })
  const telegram = new Telegram('123:secret', {
    fetch: async () => ({
      status: 200,
      json: async () => {
        throw original
      },
    }),
  })
  const error = await t.throwsAsync(telegram.getMe())
  t.true(error instanceof TelegrafNetworkError)
  t.true(error.transient)
  t.false(inspect(error, { depth: null }).includes('secret'))
  t.true(original.message.includes('secret'))
})

test('deep error causes cannot overflow the network error boundary', async (t) => {
  let original = new Error('root')
  for (let i = 0; i < 15000; i++) {
    original = new Error('layer', { cause: original })
  }
  const telegram = new Telegram('123:secret', {
    fetch: async () => {
      throw original
    },
  })
  const error = await t.throwsAsync(telegram.getMe())
  t.true(error instanceof TelegrafNetworkError)
  let cause = error.cause
  for (let depth = 0; depth < 4; depth++) cause = cause?.cause
  t.is(cause, '[Truncated]')
})

test('network diagnostics redact tokens in names, codes and object keys', async (t) => {
  const token = '123:secret'
  const original = Object.assign(new Error(token), {
    name: token,
    code: token,
    cause: JSON.parse(
      '{"123:secret":"123:secret","__proto__":{"polluted":true}}'
    ),
  })
  const telegram = new Telegram(token, {
    fetch: async () => {
      throw original
    },
  })
  const error = await t.throwsAsync(telegram.getMe())
  t.true(error instanceof TelegrafNetworkError)
  t.false(inspect(error, { depth: null }).includes('secret'))
  t.is(error.cause.cause.polluted, undefined)
  t.is(original.name, token)
})

test('uninspectable fetch rejections do not replace the network error', async (t) => {
  const { proxy, revoke } = Proxy.revocable({}, {})
  revoke()
  const telegram = new Telegram('123:secret', {
    fetch: async () => {
      throw proxy
    },
  })
  const error = await t.throwsAsync(telegram.getMe())
  t.true(error instanceof TelegrafNetworkError)
  t.is(error.cause, '[Uninspectable object]')
})

test('polling does not silently swallow an unsolicited abort', async (t) => {
  const telegram = new Telegram('123:secret', {
    fetch: async (_url, init) => {
      if (JSON.parse(init.body).limit === 1) {
        return {
          status: 200,
          json: async () => ({ ok: true, result: [] }),
        }
      }
      throw new DOMException('Unexpected abort', 'AbortError')
    },
  })
  const polling = new Polling(telegram, [])
  const error = await t.throwsAsync(polling.loop(async () => undefined))
  t.true(error instanceof TelegrafNetworkError)
  t.is(error.errorName, 'AbortError')
})

for (const code of [409, 429, 503]) {
  test(`stop interrupts the ${code} retry delay`, async (t) => {
    t.timeout(2000)
    let calls = 0
    let synced = 0
    const polling = new Polling(
      {
        callApi: async (_method, payload) => {
          if (payload.limit === 1) {
            synced++
            return []
          }
          calls++
          setTimeout(() => polling.stop(), 20)
          throw new TelegramError({
            error_code: code,
            description: 'Retry later',
            parameters: { retry_after: 5 },
          })
        },
      },
      [],
      { retryOnConflict: true, conflictRetryDelay: 5000 }
    )
    await t.notThrowsAsync(polling.loop(async () => undefined))
    t.is(calls, 1)
    t.is(synced, 1)
  })
}

test('polling retries transient errors after backoff', async (t) => {
  t.timeout(8000)
  let calls = 0
  const telegram = new Telegram('123:secret', {
    fetch: async (_url, init) => {
      const payload = JSON.parse(init.body)
      if (payload.limit !== 1) {
        calls++
        if (calls === 1) {
          throw new DOMException('Timed out', 'TimeoutError')
        }
        polling.stop()
      }
      return { status: 200, json: async () => ({ ok: true, result: [] }) }
    },
  })
  const polling = new Polling(telegram, [])
  await t.notThrowsAsync(polling.loop(async () => undefined))
  t.is(calls, 2)
})
