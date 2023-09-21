const test = require('ava')
const { compactOptions } = require('../lib/core/helpers/compact')

test('compactOptions should remove undefined values from an object', (t) => {
  const input = {
    foo: 'bar',
    baz: undefined,
    qux: null,
  }

  const expected = {
    foo: 'bar',
    qux: null,
  }

  const result = compactOptions(input)

  t.deepEqual(result, expected)
})

test('compactOptions should return undefined if input is undefined', (t) => {
  const input = undefined

  const result = compactOptions(input)

  t.is(result, undefined)
})
