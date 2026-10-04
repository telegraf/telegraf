'use strict'

const { default: test } = require('ava')
const { createServer } = require('node:http')
const { once, getEventListeners } = require('node:events')
const { Readable } = require('node:stream')
const { setImmediate: nextTurn } = require('node:timers/promises')
const { Input, Telegram, TelegrafNetworkError } = require('../')

async function localApi(t, handler, options = {}) {
  const server = createServer(handler)
  t.teardown(() => {
    server.closeAllConnections()
    server.close()
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  return new Telegram('123:secret', {
    apiRoot: `http://127.0.0.1:${server.address().port}`,
    ...options,
  })
}

test('native fetch drains a multipart upload beyond stream highWaterMark', async (t) => {
  t.timeout(5000)
  const chunks = Array.from({ length: 40 }, () => Buffer.alloc(65536, 'x'))
  const source = Readable.from(chunks)
  const telegram = await localApi(t, async (req, res) => {
    const body = []
    for await (const chunk of req) body.push(chunk)
    const uploaded = Buffer.concat(body)
    const payload = Buffer.concat(chunks)
    const offset = uploaded.indexOf(payload)
    t.true(offset > 0)
    t.is(uploaded.indexOf(payload, offset + payload.length), -1)
    const boundary = /boundary=(.+)$/.exec(req.headers['content-type'])[1]
    t.true(uploaded.toString().endsWith(`\r\n--${boundary}--`))
    res.end(JSON.stringify({ ok: true, result: true }))
  })
  t.true(await telegram.sendDocument(1, Input.fromReadableStream(source)))
  t.true(source.destroyed)
})

test('failed transport closes multipart streams even before reading them', async (t) => {
  const sources = [new Readable({ read() {} }), new Readable({ read() {} })]
  const telegram = new Telegram('123:secret', {
    fetch: async () => {
      throw new TypeError('connection failed')
    },
  })
  const controller = new AbortController()
  const error = await t.throwsAsync(
    telegram.callApi(
      'sendMediaGroup',
      {
        chat_id: 1,
        media: sources.map((source) => ({
          type: 'photo',
          media: Input.fromReadableStream(source),
        })),
      },
      { signal: controller.signal }
    )
  )
  t.true(error instanceof TelegrafNetworkError)
  t.true(sources.every((source) => source.destroyed))
  t.is(getEventListeners(controller.signal, 'abort').length, 0)
})

for (const abort of [false, true]) {
  test(`interrupted multipart upload releases all sources (caller abort: ${abort})`, async (t) => {
    t.timeout(5000)
    const controller = new AbortController()
    const active = new Readable({
      read() {
        this.push(Buffer.alloc(1024))
        this._read = () => undefined
      },
    })
    const queued = new Readable({ read() {} })
    t.teardown(() => {
      active.destroy()
      queued.destroy()
    })
    const telegram = await localApi(
      t,
      (req) => {
        req.resume()
        if (abort) controller.abort()
      },
      { requestTimeout: abort ? 2000 : 100 }
    )
    const error = await t.throwsAsync(
      telegram.callApi(
        'sendMediaGroup',
        {
          chat_id: 1,
          media: [active, queued].map((source) => ({
            type: 'photo',
            media: Input.fromReadableStream(source),
          })),
        },
        { signal: controller.signal }
      )
    )
    t.true(error instanceof TelegrafNetworkError)
    t.is(error.errorName, abort ? 'AbortError' : 'TimeoutError')
    t.true(active.destroyed)
    t.true(queued.destroyed)
    t.is(getEventListeners(controller.signal, 'abort').length, 0)
  })
}

test('source failure aborts native fetch and keeps a sanitized cause', async (t) => {
  t.timeout(5000)
  const original = new Error('failed source bot123:secret/file')
  const source = Readable.from(
    (async function* () {
      yield Buffer.alloc(65536)
      await nextTurn()
      throw original
    })()
  )
  const queued = new Readable({ read() {} })
  const telegram = await localApi(t, (req) => req.resume())
  const error = await t.throwsAsync(
    telegram.sendMediaGroup(
      1,
      [source, queued].map((stream) => ({
        type: 'photo',
        media: Input.fromReadableStream(stream),
      }))
    )
  )
  t.true(error instanceof TelegrafNetworkError)
  t.true(error.cause.message.includes('failed source'))
  t.false(error.cause.message.includes('secret'))
  t.true(original.message.includes('secret'))
  t.true(source.destroyed)
  t.true(queued.destroyed)
})

test('attachment assembly failure closes sources already attached', async (t) => {
  const source = new Readable({ read() {} })
  const telegram = new Telegram('123:secret', {
    fetch: async () => {
      t.fail('an invalid upload must not reach the transport')
    },
  })
  await t.throwsAsync(
    telegram.sendMediaGroup(1, [
      { type: 'photo', media: Input.fromReadableStream(source) },
      { type: 'photo', media: Input.fromLocalFile(__filename + '/missing') },
    ])
  )
  t.true(source.destroyed)
})
