const test = require('ava')
const { FmtString, fmt, bold, italic, join } = require('../format')

test('Idiomatic FmtString usage', (t) =>
  t.notThrows(() => {
    const item = fmt`Hello, ${bold`World`}`

    t.deepEqual(
      item,
      Object.assign(new FmtString(), {
        text: 'Hello, World',
        parse_mode: undefined,
        entities: [{ type: 'bold', offset: 7, length: 5 }],
      })
    )
  }))

test('FmtString from function', (t) =>
  t.notThrows(() => {
    const item = bold('Hello')

    t.deepEqual(
      item,
      Object.assign(new FmtString(), {
        text: 'Hello',
        parse_mode: undefined,
        entities: [{ type: 'bold', offset: 0, length: 5 }],
      })
    )
  }))

test('Nested FmtString', (t) =>
  t.notThrows(() => {
    const item = bold(italic('Hello'))

    t.deepEqual(
      item,
      Object.assign(new FmtString(), {
        text: 'Hello',
        parse_mode: undefined,
        entities: [
          { type: 'bold', offset: 0, length: 5 },
          { type: 'italic', offset: 0, length: 5 },
        ],
      })
    )
  }))

test('Should join FmtStrings', (t) =>
  t.notThrows(() => {
    const a = bold(italic('Hello'))
    const b = italic('World')

    const joined = join([a, b], ', ')

    t.deepEqual(joined, fmt`${a}, ${b}`)

    t.deepEqual(
      joined,
      Object.assign(new FmtString(), {
        text: 'Hello, World',
        parse_mode: undefined,
        entities: [
          { type: 'bold', offset: 0, length: 5 },
          { type: 'italic', offset: 0, length: 5 },
          { type: 'italic', offset: 7, length: 5 },
        ],
      })
    )
  }))
