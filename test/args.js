// @ts-check

const test = require('ava').default
const fc = require('fast-check')
const { argParser } = require('../lib/core/helpers/args')
const { deepStrictEqual } = require('assert')

test('argParser should act predictably', (t) => {
  t.deepEqual(
    //
    argParser(`A "quick fox" jumps`),
    ['A', 'quick fox', 'jumps']
  )
  t.deepEqual(
    //
    argParser(`A "quick" fox" jumps`),
    ['A', 'quick', 'fox', ' jumps']
  )
  t.deepEqual(
    //
    argParser(`A "quick"fox jumps`),
    ['A', 'quick', 'fox', 'jumps']
  )
  t.deepEqual(
    //
    argParser(`A "quick\\" fox"" jumps`),
    ['A', 'quick" fox', ' jumps']
  )
  t.deepEqual(
    //
    argParser(`A "quick\\\\" fox"" jumps`),
    ['A', 'quick\\', 'fox', ' jumps']
  )
  t.deepEqual(
    //
    argParser(`\\\\ (`),
    ['\\', '(']
  )
  t.deepEqual(
    //
    argParser(`-a="b"`),
    ['-a=', 'b']
  )
})

test('argParser should break multiple lines', (t) => {
  t.deepEqual(
    //
    argParser(`A "quick\n fox" jumps`),
    ['A', 'quick', 'fox', ' jumps']
  )
})

test('argParser should not break newline preceeded by \\', (t) => {
  t.deepEqual(
    //
    argParser(`A "quick\\\n fox" jumps`),
    ['A', 'quick\n fox', 'jumps']
  )
})

test('argParser should respect text_mention and text_link', (t) => {
  t.deepEqual(
    //
    argParser(`A "quick" Mr. Brown 'fox' "jumps`, [
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
    argParser(`A "quick Mr. Brown fox" jumps`, [
      {
        type: 'text_link',
        offset: `A "quick `.length,
        length: `Mr. Brown`.length,
      },
    ]),
    ['A', 'quick ', 'Mr. Brown', 'fox', ' jumps']
  )
})

test('argParser - simple property based tests', (t) => {
  fc.assert(
    // test with arbitrary strings containing no quotes or escapes
    fc.property(fc.stringMatching(/^[^'"\\]+$/), (str) => {
      const parsed = argParser(str)
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
