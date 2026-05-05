const http = require('http')
const path = require('path')
const test = require('ava')
const { Input, Telegram } = require('../')

function readMethodsFromTypes() {
  const fs = require('fs')
  const typesRoot = path.dirname(require.resolve('@telegraf/types/package.json'))
  const methods = fs.readFileSync(path.join(typesRoot, 'methods.d.ts'), 'utf8')
  return [
    ...new Set(
      [...methods.matchAll(/^ {4}([a-z][A-Za-z0-9]+)\(/gm)].map(
        (match) => match[1]
      )
    ),
  ]
}

test('Telegram wraps every typed Bot API method', (t) => {
  const methods = readMethodsFromTypes()
  const missing = methods.filter(
    (method) => typeof Telegram.prototype[method] !== 'function'
  )
  t.deepEqual(missing, [])
})

test('Telegram wrappers call through to matching Bot API methods', (t) => {
  const fs = require('fs')
  const source = fs.readFileSync(path.join(__dirname, '../src/telegram.ts'), {
    encoding: 'utf8',
  })
  const wrapped = new Set(
    [...source.matchAll(/callApi\('([a-zA-Z0-9]+)'/g)].map(
      (match) => match[1]
    )
  )
  const missing = readMethodsFromTypes().filter((method) => !wrapped.has(method))
  t.deepEqual(missing, [])
})

test('multipart form data serializes nested input files', async (t) => {
  let resolveRequest
  const request = new Promise((resolve) => {
    resolveRequest = resolve
  })
  const server = http.createServer((req, res) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      resolveRequest({
        url: req.url,
        headers: req.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      })
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ ok: true, result: true }))
      server.close()
    })
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  const telegram = new Telegram('123:abc', {
    apiRoot: `http://127.0.0.1:${port}`,
  })

  await telegram.setMyProfilePhoto({
    photo: {
      type: 'static',
      photo: Input.fromBuffer(Buffer.from('avatar-bytes'), 'avatar.png'),
    },
  })

  const captured = await request
  t.is(captured.url, '/bot123:abc/setMyProfilePhoto')
  t.regex(captured.headers['content-type'], /^multipart\/form-data/)
  const attachment = captured.body.match(/"photo":"attach:\/\/([0-9a-f]+)"/)
  t.truthy(attachment)
  t.true(captured.body.includes(`name="${attachment[1]}"`))
  t.true(captured.body.includes('filename="avatar.png"'))
  t.true(captured.body.includes('avatar-bytes'))
})
