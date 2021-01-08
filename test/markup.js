const test = require('ava')
const Markup = require('../lib/markup')

test('should generate removeKeyboard markup', (t) => {
  const markup = { ...Markup.removeKeyboard().reply_markup }
  t.deepEqual(markup, { remove_keyboard: true })
})

test('should generate forceReply markup', (t) => {
  const markup = { ...Markup.forceReply().reply_markup }
  t.deepEqual(markup, { force_reply: true })
})

test('should generate resizeKeyboard markup', (t) => {
  const markup = { ...Markup.keyboard([]).resize().reply_markup }
  t.deepEqual(markup, { keyboard: [], resize_keyboard: true })
})

test('should generate oneTimeKeyboard markup', (t) => {
  const markup = { ...Markup.keyboard([]).oneTime().reply_markup }
  t.deepEqual(markup, { keyboard: [], one_time_keyboard: true })
})

test('should generate selective hide markup', (t) => {
  const markup = { ...Markup.removeKeyboard().selective().reply_markup }
  t.deepEqual(markup, { remove_keyboard: true, selective: true })
})

test('should generate selective one time keyboard markup', (t) => {
  const markup = { ...Markup.keyboard().selective().oneTime().reply_markup }
  t.deepEqual(markup, { keyboard: [], selective: true, one_time_keyboard: true })
})

test('should generate keyboard markup', (t) => {
  const markup = { ...Markup.keyboard([['one'], ['two', 'three']]).reply_markup }
  t.deepEqual(markup, {
    keyboard: [
      ['one'],
      ['two', 'three']
    ]
  })
})

test('should generate keyboard markup with default setting', (t) => {
  const markup = { ...Markup.keyboard(['one', 'two', 'three']).reply_markup }
  t.deepEqual(markup, {
    keyboard: [
      ['one'],
      ['two'],
      ['three']
    ]
  })
})

test('should generate keyboard markup with options', (t) => {
  const markup = { ...Markup.keyboard(['one', 'two', 'three'], { columns: 3 }).reply_markup }
  t.deepEqual(markup, {
    keyboard: [
      ['one', 'two', 'three']
    ]
  })
})

test('should generate keyboard markup with custom columns', (t) => {
  const markup = { ...Markup.keyboard(['one', 'two', 'three', 'four'], { columns: 3 }).reply_markup }
  t.deepEqual(markup, {
    keyboard: [
      ['one', 'two', 'three'],
      ['four']
    ]
  })
})

test('should generate keyboard markup with custom wrap fn', (t) => {
  const markup = {
    ...Markup.keyboard(['one', 'two', 'three', 'four'], {
      wrap: (btn, index, currentRow) => index % 2 !== 0
    }).reply_markup
  }
  t.deepEqual(markup, {
    keyboard: [
      ['one'],
      ['two', 'three'],
      ['four']
    ]
  })
})

test('should generate inline keyboard markup with default setting', (t) => {
  const markup = { ...Markup.inlineKeyboard(['one', 'two', 'three', 'four']).reply_markup }
  t.deepEqual(markup, {
    inline_keyboard: [[
      'one',
      'two',
      'three',
      'four'
    ]]
  })
})

test('should generate extra from keyboard markup', (t) => {
  const markup = { ...Markup.inlineKeyboard(['one', 'two', 'three', 'four']) }
  t.deepEqual(markup, {
    reply_markup: {
      inline_keyboard: [[
        'one',
        'two',
        'three',
        'four'
      ]]
    }
  })
})

test('should generate standard button markup', (t) => {
  const markup = { ...Markup.button.text('foo') }
  t.deepEqual(markup, { text: 'foo', hide: false })
})

test('should generate cb button markup', (t) => {
  const markup = { ...Markup.button.callback('foo', 'bar') }
  t.deepEqual(markup, { text: 'foo', callback_data: 'bar', hide: false })
})

test('should generate url button markup', (t) => {
  const markup = { ...Markup.button.url('foo', 'https://bar.tld') }
  t.deepEqual(markup, { text: 'foo', url: 'https://bar.tld', hide: false })
})

test('should generate location request button markup', (t) => {
  const markup = { ...Markup.button.locationRequest('send location') }
  t.deepEqual(markup, { text: 'send location', request_location: true, hide: false })
})

test('should generate contact request button markup', (t) => {
  const markup = { ...Markup.button.contactRequest('send contact') }
  t.deepEqual(markup, { text: 'send contact', request_contact: true, hide: false })
})

test('should generate switch inline query button markup', (t) => {
  const markup = { ...Markup.button.switchToChat('play now', 'foo') }
  t.deepEqual(markup, { text: 'play now', switch_inline_query: 'foo', hide: false })
})

test('should generate switch inline query button markup for chat', (t) => {
  const markup = { ...Markup.button.switchToCurrentChat('play now', 'foo') }
  t.deepEqual(markup, { text: 'play now', switch_inline_query_current_chat: 'foo', hide: false })
})

test('should generate game button markup', (t) => {
  const markup = { ...Markup.button.game('play') }
  t.deepEqual(markup, { text: 'play', callback_game: {}, hide: false })
})

test('should generate hidden game button markup', (t) => {
  const markup = { ...Markup.button.game('play again', true) }
  t.deepEqual(markup, { text: 'play again', callback_game: {}, hide: true })
})
