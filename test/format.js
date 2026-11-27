const test = require('ava')
const {
  FmtString,
  fmt,
  bold,
  italic,
  join,
  link,
  mention,
} = require('../format')

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

test('Reused formatted links have independent entities', (t) => {
  const label = bold('Docs')
  const a = link(label, 'https://example.com/a')
  const b = link(label, 'https://example.com/b')

  t.deepEqual(label.entities, [{ type: 'bold', offset: 0, length: 4 }])
  t.deepEqual(a.entities, [
    { type: 'text_link', url: 'https://example.com/a', offset: 0, length: 4 },
    { type: 'bold', offset: 0, length: 4 },
  ])
  t.deepEqual(b.entities, [
    { type: 'text_link', url: 'https://example.com/b', offset: 0, length: 4 },
    { type: 'bold', offset: 0, length: 4 },
  ])
  t.deepEqual(fmt`see ${a} and ${b}`.entities, [
    { type: 'text_link', url: 'https://example.com/a', offset: 4, length: 4 },
    { type: 'bold', offset: 4, length: 4 },
    { type: 'text_link', url: 'https://example.com/b', offset: 13, length: 4 },
    { type: 'bold', offset: 13, length: 4 },
  ])
})

test('Mentions can wrap a label with frozen entities', (t) => {
  const label = italic('Hi 👋')
  Object.freeze(label.entities)
  const user = { id: 1, is_bot: false, first_name: 'Jamie' }

  t.deepEqual(mention(label, user).entities, [
    { type: 'text_mention', user, offset: 0, length: 5 },
    { type: 'italic', offset: 0, length: 5 },
  ])
  t.deepEqual(mention(label, 2).entities, [
    { type: 'text_link', url: 'tg://user?id=2', offset: 0, length: 5 },
    { type: 'italic', offset: 0, length: 5 },
  ])
  t.deepEqual(label.entities, [{ type: 'italic', offset: 0, length: 5 }])
})
