// @ts-check

const test = require('ava').default
const fc = require('fast-check')
const { argsParser } = require('../lib/core/helpers/args')
const { deepStrictEqual } = require('assert')

test('argsParser should act predictably', (t) => {
  t.deepEqual(
    //
    argsParser(`A "quick fox" jumps`),
    ['A', 'quick fox', 'jumps']
  )
  t.deepEqual(
    //
    argsParser(`A "quick" fox" jumps`),
    ['A', 'quick', 'fox', ' jumps']
  )
  t.deepEqual(
    //
    argsParser(`A "quick"fox jumps`),
    ['A', 'quick', 'fox', 'jumps']
  )
  t.deepEqual(
    //
    argsParser(`A "quick\\" fox"" jumps`),
    ['A', 'quick" fox', ' jumps']
  )
  t.deepEqual(
    //
    argsParser(`A "quick\\\\" fox"" jumps`),
    ['A', 'quick\\', 'fox', ' jumps']
  )
  t.deepEqual(
    //
    argsParser(`\\\\ (`),
    ['\\', '(']
  )
  t.deepEqual(
    //
    argsParser(`-a="b"`),
    ['-a=', 'b']
  )
})

test('argsParser should break multiple lines', (t) => {
  t.deepEqual(
    //
    argsParser(`A "quick\n fox" jumps`),
    ['A', 'quick', 'fox', ' jumps']
  )
})

test('argsParser should not break newline preceeded by \\', (t) => {
  t.deepEqual(
    //
    argsParser(`A "quick\\\n fox" jumps`),
    ['A', 'quick\n fox', 'jumps']
  )
})

test('argsParser should respect text_mention and text_link', (t) => {
  t.deepEqual(
    //
    argsParser(`A "quick" Mr. Brown 'fox' "jumps`, [
      {
        type: 'text_mention',
        offset: `A "quick" `.length,
        length: `Mr. Brown`.length,
      },
    ]),
    ['A', 'quick', 'Mr. Brown', 'fox', 'jumps']
  )
  t.deepEqual(
    //
    argsParser(`A "quick Mr. Brown fox" jumps`, [
      {
        type: 'text_link',
        offset: `A "quick `.length,
        length: `Mr. Brown`.length,
      },
    ]),
    ['A', 'quick ', 'Mr. Brown', 'fox', ' jumps']
  )
})

test('argsParser - simple property based tests', (t) => {
  fc.assert(
    // @ts-expect-error TS doesn't know what it's doing here, maybe a bug when running TS on JS
    // generate arbitrary strings containing no quotes or escapes
    fc.property(fc.stringMatching(/^[^'"\\]+$/), (str) => {
      const parsed = argsParser(str)
      // Property 1: none of the parsed strings must contain spaces
      deepStrictEqual(!parsed.some((x) => x.includes(' ')), true)

      const trimmed = str.trim()
      const spaces = [...trimmed.matchAll(/\s+/g)].length

      // Property 2: if the string only had spaces, number of parsed segments must equal 0
      if (!trimmed) deepStrictEqual(parsed.length, 0)
      else {
        // Property 3: number of source spaces must equal the number of parsed segments
        deepStrictEqual(parsed.length, spaces + 1)

        // Property 4: first non-space character must be the first non-space character in parsed
        deepStrictEqual(parsed[0]?.[0], trimmed.at(0))

        // Property 5: last non-space character must be the first non-space character in parsed
        deepStrictEqual(parsed.at(-1)?.at(-1), trimmed.at(-1))
      }

      t.pass()
    })
  )
})
