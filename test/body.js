const test = require('ava')
const http = require('http')
const { toStream, toBlob } = require('../lib/core/network/body')

const bytes = (text) => new TextEncoder().encode(text)
const text = async (stream) => await new Response(stream).text()
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

// Resolves with 'settled', or with 'pending' if the promise has not settled after `ms`.
const getPromiseState = (promise, ms = 500) =>
  Promise.race([promise.then(() => 'settled'), delay(ms).then(() => 'pending')])

test('toStream should emit segments in order', async (t) => {
  const body = toStream([
    bytes('bytes '),
    new Blob(['blob ']),
    async function* () {
      yield bytes('gener')
      yield bytes('ator ')
    },
    () => new Blob(['web stream']).stream(),
    bytes(''),
    new Blob([]),
  ])

  t.is(await text(body.stream), 'bytes blob generator web stream')
  t.is(body.failure, undefined)
})

test('toStream should open sources lazily', async (t) => {
  const opened = []
  const source = (name) => () => {
    opened.push(name)
    return (async function* () {
      yield bytes(name)
    })()
  }
  const body = toStream([source('a'), source('b'), source('c')])
  t.deepEqual(opened, [], 'nothing is opened before the body is read')

  const reader = body.stream.getReader()
  await reader.read()
  await body.close()

  t.false(opened.includes('c'), 'a source that was not reached is never opened')
})

test('toStream should convert chunks to bytes', async (t) => {
  const body = toStream([
    async function* () {
      yield 'text '
      yield bytes('view ').buffer
      yield new DataView(bytes('data').buffer)
    },
  ])

  t.is(await text(body.stream), 'text view data')
})

test('toStream should reject a non-byte chunk', async (t) => {
  const body = toStream([
    async function* () {
      yield { not: 'bytes' }
    },
  ])

  await t.throwsAsync(text(body.stream), { instanceOf: TypeError })
  t.true(body.failure.error instanceof TypeError)
})

test("toStream should not detach the caller's buffer", async (t) => {
  const owned = new Uint8Array(100_000).fill(120)
  await text(toStream([owned]).stream)

  t.is(owned.byteLength, 100_000)
  t.is(owned[99_999], 120)
})

test('toStream should record a source error', async (t) => {
  const error = new Error('disk on fire')
  const body = toStream([
    bytes('start'),
    async function* () {
      yield bytes('part')
      throw error
    },
  ])

  await t.throwsAsync(text(body.stream), { is: error })
  t.is(body.failure.error, error)
})

test('close should end a paused generator', async (t) => {
  let released = false
  const body = toStream([
    async function* () {
      try {
        yield bytes('one')
        yield bytes('two')
      } finally {
        released = true
      }
    },
  ])
  const reader = body.stream.getReader()
  await reader.read()

  await body.close()
  t.true(released)
  await body.close()
  t.is(body.failure, undefined, 'closing is not a failure')
})

test('close should cancel a pending web stream read', async (t) => {
  let cancelled = false
  const body = toStream([
    () =>
      new ReadableStream({
        pull: () => new Promise(() => {}),
        cancel() {
          cancelled = true
        },
      }),
  ])
  body.stream
    .getReader()
    .read()
    .catch(() => {})
  await delay(50)

  t.is(
    await getPromiseState(body.close()),
    'settled',
    'close does not wait for the read'
  )
  t.true(cancelled)
  t.is(body.failure, undefined)
})

test('close should destroy a pending Node stream', async (t) => {
  const { Readable } = require('stream')
  const silent = new Readable({ read() {} })
  const body = toStream([() => silent])
  body.stream
    .getReader()
    .read()
    .catch(() => {})
  await delay(50)

  t.is(await getPromiseState(body.close()), 'settled')
  t.true(silent.destroyed)
  t.is(
    body.failure,
    undefined,
    'a read that close interrupted is not a failure'
  )
})

test('close should error the stream', async (t) => {
  // Deno keeps reading the stream after an early response.
  const body = toStream([
    async function* () {
      yield bytes('one')
      await new Promise(() => {})
    },
  ])
  const reader = body.stream.getReader()
  await reader.read()
  const waiting = reader.read().then(
    () => 'resolved',
    (error) => error.name
  )
  await body.close()

  t.is(await getPromiseState(waiting), 'settled')
  t.is(await waiting, 'AbortError')
  t.is(body.failure, undefined, 'a close is not a source failure')
})

test('close should not wait for a stalled generator', async (t) => {
  let released = false
  let unblock
  const blocked = new Promise((resolve) => (unblock = resolve))
  const body = toStream([
    async function* () {
      try {
        yield bytes('one')
        await blocked
        yield bytes('two')
      } finally {
        released = true
      }
    },
  ])
  const reader = body.stream.getReader()
  await reader.read()
  await delay(50)

  t.is(await getPromiseState(body.close()), 'settled', 'close returns at once')
  t.false(released, 'a generator cannot be interrupted while it waits')

  unblock()
  await delay(50)
  t.true(released, 'and is ended as soon as it yields')
})

test('toStream should release the source on consumer cancel', async (t) => {
  let released = false
  const body = toStream([
    async function* () {
      try {
        yield bytes('one')
        yield bytes('two')
      } finally {
        released = true
      }
    },
  ])
  const reader = body.stream.getReader()
  await reader.read()
  await reader.cancel()

  t.true(released)
})

test('toStream should throw when stringified', async (t) => {
  const { stream } = toStream([bytes('x')])
  t.throws(() => String(stream), { instanceOf: TypeError })

  // node-fetch 2 would otherwise upload the text "[object ReadableStream]".
  const nodeFetch = require('node-fetch')
  await t.throwsAsync(
    nodeFetch('http://127.0.0.1:9/', { method: 'POST', body: stream }),
    { instanceOf: TypeError, message: /cannot send a ReadableStream/ }
  )
})

test('toBlob should concatenate segments', async (t) => {
  const blob = await toBlob(
    [
      bytes('bytes '),
      new Blob(['blob ']),
      async function* () {
        yield bytes('stream')
      },
    ],
    { type: 'multipart/form-data; boundary=B' }
  )

  t.is(await blob.text(), 'bytes blob stream')
  t.is(blob.size, 17)
  t.is(blob.type, 'multipart/form-data; boundary=b')
})

test('toBlob should reject with a source error', async (t) => {
  const error = new Error('disk on fire')
  let released = false
  const failing = toBlob([
    async function* () {
      try {
        yield bytes('part')
        throw error
      } finally {
        released = true
      }
    },
  ])

  await t.throwsAsync(failing, { is: error })
  t.true(released)
})

test('toBlob should cancel a web stream on abort', async (t) => {
  let cancelled = false
  const reason = new Error('enough')
  const controller = new AbortController()
  // Emits one chunk and then stalls forever.
  const reading = toBlob(
    [
      () =>
        new ReadableStream({
          start: (stream) => stream.enqueue(bytes('x')),
          cancel() {
            cancelled = true
          },
        }),
    ],
    { signal: controller.signal }
  )
  await delay(20)
  t.false(cancelled)
  controller.abort(reason)

  await t.throwsAsync(reading, { is: reason })
  await delay(20)
  t.true(cancelled)
})

test('toBlob should not wait for a generator on abort', async (t) => {
  const reached = []
  let resume
  const gate = new Promise((resolve) => (resume = resolve))
  const controller = new AbortController()
  const reading = toBlob(
    [
      async function* () {
        try {
          yield bytes('a')
          await gate
          reached.push('second chunk')
          yield bytes('b')
          reached.push('third chunk')
          yield bytes('c')
        } finally {
          reached.push('released')
        }
      },
      () => {
        reached.push('next stream')
        return new Blob(['d']).stream()
      },
    ],
    { signal: controller.signal }
  )
  await delay(20)
  controller.abort()

  await t.throwsAsync(reading, { name: 'AbortError' })
  t.deepEqual(
    reached,
    [],
    'it is rejected while the generator is still waiting'
  )

  resume()
  await delay(20)
  t.deepEqual(
    reached,
    ['second chunk', 'released'],
    'the generator is stopped where it next yields'
  )
})

test('toBlob should not open a source for an aborted signal', async (t) => {
  let opened = false
  const reason = new Error('enough')
  const reading = toBlob(
    [
      () => {
        opened = true
        return new Blob(['x']).stream()
      },
    ],
    { signal: AbortSignal.abort(reason) }
  )

  await t.throwsAsync(reading, { is: reason })
  t.false(opened)
})

test('toBlob should remove its abort listener', async (t) => {
  const { signal } = new AbortController()
  const listeners = new Set()
  const { addEventListener, removeEventListener } = signal
  signal.addEventListener = (type, listener, options) => {
    listeners.add(listener)
    addEventListener.call(signal, type, listener, options)
  }
  signal.removeEventListener = (type, listener) => {
    listeners.delete(listener)
    removeEventListener.call(signal, type, listener)
  }
  const blob = await toBlob(
    [
      bytes('head '),
      async function* () {
        yield bytes('stream')
      },
    ],
    { signal }
  )

  t.is(await blob.text(), 'head stream')
  await delay(0)
  t.is(listeners.size, 0, 'nothing is left on the signal')
})

test('toBlob should reject on abort during source open', async (t) => {
  const reason = new Error('no such file')
  const controller = new AbortController()
  const reading = toBlob(
    [
      () => {
        controller.abort(reason)
        return new ReadableStream({ pull: () => new Promise(() => {}) })
      },
    ],
    { signal: controller.signal }
  )

  await t.throwsAsync(reading, { is: reason })
})

test('toBlob should stop reading an iterator without return() on abort', async (t) => {
  // An iterator with only next() can't be told to stop.
  let reads = 0
  const endless = {
    [Symbol.asyncIterator]: () => ({
      async next() {
        reads++
        await delay(5)
        return { done: false, value: bytes('x') }
      },
    }),
  }
  const controller = new AbortController()
  const reading = toBlob([() => endless], { signal: controller.signal })
  await delay(30)
  controller.abort()

  await t.throwsAsync(reading, { name: 'AbortError' })
  await delay(30)
  const readsAfterAbort = reads
  await delay(60)
  t.is(reads, readsAfterAbort, 'nothing more is read')
})

// --- through a real request ----------------------------------------------------------------

async function withServer(handler, run) {
  const server = http.createServer(handler)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    return await run(`http://127.0.0.1:${server.address().port}/`)
  } finally {
    server.closeAllConnections()
    server.close()
  }
}

const echo = (req, res) => {
  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    res.end(
      JSON.stringify({
        body: Buffer.concat(chunks).toString(),
        length: req.headers['content-length'],
        encoding: req.headers['transfer-encoding'],
      })
    )
  })
}

test('fetch should send a stream body chunked', async (t) => {
  await withServer(echo, async (url) => {
    const body = toStream([
      bytes('head '),
      async function* () {
        yield bytes('file')
      },
      bytes(' tail'),
    ])
    const res = await fetch(url, {
      method: 'POST',
      body: body.stream,
      duplex: 'half',
    })

    t.deepEqual(await res.json(), {
      body: 'head file tail',
      encoding: 'chunked',
    })
    await body.close()
  })
})

test('fetch should send a blob body with a content-length', async (t) => {
  await withServer(echo, async (url) => {
    const blob = await toBlob([bytes('head '), new Blob(['file'])])
    const res = await fetch(url, { method: 'POST', body: blob, duplex: 'half' })

    t.deepEqual(await res.json(), { body: 'head file', length: '9' })
  })
})

test('close should release the source after an aborted fetch', async (t) => {
  // Node does not cancel the request body when a request is aborted.
  await withServer(
    (req) => req.resume(),
    async (url) => {
      let released = false
      const body = toStream([
        async function* () {
          try {
            for (;;) {
              yield new Uint8Array(1024)
              await delay(10)
            }
          } finally {
            released = true
          }
        },
      ])
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 100)

      await t.throwsAsync(
        fetch(url, {
          method: 'POST',
          body: body.stream,
          duplex: 'half',
          signal: controller.signal,
        }),
        { name: 'AbortError' }
      )
      await delay(100)
      t.false(released, 'the runtime left the source open')

      await body.close()
      // The generator may be between yields; it ends at the next one.
      await delay(100)
      t.true(released)
    }
  )
})
