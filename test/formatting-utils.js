const test = require('ava')
const { formatHTML } = require('../lib/core/helpers/formatting-utils')

test('should generate markup', (t) => {
  const markup = formatHTML('strike', [
    {
      offset: 0,
      length: 6,
      type: 'strikethrough'
    }
  ])
  t.deepEqual(markup, '<s>strike</s>')
})

test('should generate multi markup', (t) => {
  const markup = formatHTML('strike bold', [
    {
      offset: 0,
      length: 6,
      type: 'strikethrough'
    },
    {
      offset: 7,
      length: 4,
      type: 'bold'
    }
  ])
  t.deepEqual(markup, '<s>strike</s> <b>bold</b>')
})

test('should generate nested markup', (t) => {
  const markup = formatHTML('test', [
    {
      offset: 0,
      length: 4,
      type: 'bold'
    },
    {
      offset: 0,
      length: 4,
      type: 'strikethrough'
    }
  ])
  t.deepEqual(markup, '<b><s>test</s></b>')
})

test('should generate nested multi markup', (t) => {
  const markup = formatHTML('strikeboldunder', [
    {
      offset: 0,
      length: 15,
      type: 'strikethrough'
    },
    {
      offset: 6,
      length: 9,
      type: 'bold'
    },
    {
      offset: 10,
      length: 5,
      type: 'underline'
    }
  ])
  t.deepEqual(markup, '<s>strike<b>bold<u>under</u></b></s>')
})

test('should generate nested multi markup 2', (t) => {
  const markup = formatHTML('×11 22 333×      ×С123456×                   ×1 22 333×', [
    {
      offset: 1,
      length: 9,
      type: 'bold'
    },
    {
      offset: 1,
      length: 9,
      type: 'italic'
    },
    {
      offset: 12,
      length: 7,
      type: 'italic'
    },
    {
      offset: 19,
      length: 36,
      type: 'italic'
    },
    {
      offset: 19,
      length: 8,
      type: 'bold'
    }
  ])
  t.deepEqual(markup, '×<b><i>11 22 333</i></b>× <i>     ×С</i><i><b>123456× </b>                  ×1 22 333×</i>')
})

test('should generate correct HTML with emojis', (t) => {
  const markup = formatHTML('👨‍👩‍👧‍👦underline 👩‍👩‍👦‍👦bold 👨‍👨‍👦‍👦italic', [
    {
      offset: 0,
      length: 20,
      type: 'underline'
    },
    {
      offset: 21,
      length: 15,
      type: 'bold'
    },
    {
      offset: 37,
      length: 17,
      type: 'italic'
    }
  ])
  t.deepEqual(markup, '<u>👨‍👩‍👧‍👦underline</u> <b>👩‍👩‍👦‍👦bold</b> <i>👨‍👨‍👦‍👦italic</i>')
})

test('should generate correct HTML with HTML-reserved characters', (t) => {
  const markup = formatHTML('<b>123</b>', [{ offset: 1, length: 3, type: 'underline' }])
  t.deepEqual(markup, '&lt;<u>b&gt;1</u>23&lt;/b&gt;')
})
