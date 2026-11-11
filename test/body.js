const test = require('ava')
const http = require('http')
const { toStream, toBlob } = require('../lib/core/network/body')

const bytes = (text) => new TextEncoder().encode(text)
const text = async (stream) => await new Response(stream).text()
const soon = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

// Settles with 'pending' if the promise has not settled by then.
const within = (promise, ms = 500) =>
  Promise.race([promise.then(() => 'settled'), soon(ms).then(() => 'pending')])

test('stream: every kind of segment, in order', async (t) => {
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

test('stream: a source is opened only when it is reached', async (t) => {
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

test('stream: chunks from a source are turned into bytes', async (t) => {
  const body = toStream([
    async function* () {
      yield 'text '
      yield bytes('view ').buffer
      yield new DataView(bytes('data').buffer)
    },
  ])

  t.is(await text(body.stream), 'text view data')
})

test('stream: a chunk that is not bytes fails the body', async (t) => {
  const body = toStream([
    async function* () {
      yield { not: 'bytes' }
    },
  ])

  await t.throwsAsync(text(body.stream), { instanceOf: TypeError })
  t.true(body.failure.error instanceof TypeError)
})

test('stream: the caller keeps its buffer', async (t) => {
  const owned = new Uint8Array(100_000).fill(120)
  await text(toStream([owned]).stream)

  t.is(owned.byteLength, 100_000)
  t.is(owned[99_999], 120)
})

test('stream: a failing source is recorded', async (t) => {
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

test('close: a generator waiting at a yield is ended', async (t) => {
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

test('close: a web stream that never answers is cancelled', async (t) => {
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
  await soon(50)

  t.is(
    await within(body.close()),
    'settled',
    'close does not wait for the read'
  )
  t.true(cancelled)
  t.is(body.failure, undefined)
})

test('close: a Node stream that never answers is destroyed', async (t) => {
  const { Readable } = require('stream')
  const silent = new Readable({ read() {} })
  const body = toStream([() => silent])
  body.stream
    .getReader()
    .read()
    .catch(() => {})
  await soon(50)

  t.is(await within(body.close()), 'settled')
  t.true(silent.destroyed)
  t.is(
    body.failure,
    undefined,
    'a read that close interrupted is not a failure'
  )
})

test('close: a generator that never yields cannot hold the caller', async (t) => {
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
  await soon(50)

  t.is(await within(body.close()), 'settled', 'close returns at once')
  t.false(released, 'a generator cannot be interrupted while it waits')

  unblock()
  await soon(50)
  t.true(released, 'and is ended as soon as it yields')
})

test('close: the consumer cancelling has the same effect', async (t) => {
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

test('stream: an implementation that stringifies it is refused', async (t) => {
  const { stream } = toStream([bytes('x')])
  t.throws(() => String(stream), { instanceOf: TypeError })

  // node-fetch 2 would otherwise upload the text "[object ReadableStream]".
  const nodeFetch = require('node-fetch')
  await t.throwsAsync(
    nodeFetch('http://127.0.0.1:9/', { method: 'POST', body: stream }),
    { instanceOf: TypeError, message: /cannot send a ReadableStream/ }
  )
})

test('blob: segments are joined, and a stream is read into it', async (t) => {
  const blob = await toBlob(
    [
      bytes('bytes '),
      new Blob(['blob ']),
      async function* () {
        yield bytes('stream')
      },
    ],
    'multipart/form-data; boundary=B'
  )

  t.is(await blob.text(), 'bytes blob stream')
  t.is(blob.size, 17)
  t.is(blob.type, 'multipart/form-data; boundary=b')
})

test('blob: a failing source rejects, and is released', async (t) => {
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

test('fetch: a stream body is sent chunked and arrives whole', async (t) => {
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

test('fetch: a blob body is sent with its length', async (t) => {
  await withServer(echo, async (url) => {
    const blob = await toBlob([bytes('head '), new Blob(['file'])])
    const res = await fetch(url, { method: 'POST', body: blob, duplex: 'half' })

    t.deepEqual(await res.json(), { body: 'head file', length: '9' })
  })
})

test('fetch: closing after an abort releases the source', async (t) => {
  // Node does not cancel the body of a request that was aborted.
  await withServer(
    (req) => req.resume(),
    async (url) => {
      let released = false
      const body = toStream([
        async function* () {
          try {
            for (;;) {
              yield new Uint8Array(1024)
              await soon(10)
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
      await soon(100)
      t.false(released, 'the runtime left the source open')

      await body.close()
      // The generator may be between two yields; it is ended when it reaches the next.
      await soon(100)
      t.true(released)
    }
  )
})
