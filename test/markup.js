const test = require('ava')
const Telegraf = require('../')
const { Markup } = Telegraf

test('should generate removeKeyboard markup', (t) => {
  const markup = Object.assign({}, Markup.removeKeyboard())
  t.deepEqual(markup, {remove_keyboard: true})
})

test('should generate forceReply markup', (t) => {
  const markup = Object.assign({}, Markup.forceReply())
  t.deepEqual(markup, {force_reply: true})
})

test('should generate resizeKeyboard markup', (t) => {
  const markup = Object.assign({}, Markup.keyboard([]).resize())
  t.deepEqual(markup, {resize_keyboard: true})
})

test('should generate oneTimeKeyboard markup', (t) => {
  const markup = Object.assign({}, Markup.keyboard([]).oneTime())
  t.deepEqual(markup, {one_time_keyboard: true})
})

test('should generate selective hide markup', (t) => {
  const markup = Object.assign({}, Markup.removeKeyboard().selective())
  t.deepEqual(markup, {remove_keyboard: true, selective: true})
})

test('should generate selective one time keyboard markup', (t) => {
  const markup = Object.assign({}, Markup.keyboard().selective().oneTime())
  t.deepEqual(markup, {selective: true, one_time_keyboard: true})
})

test('should generate keyboard markup', (t) => {
  const markup = Object.assign({}, Markup.keyboard([['one'], ['two', 'three']]))
  t.deepEqual(markup, {
    keyboard: [
      ['one'],
      ['two', 'three']
    ]
  })
})

test('should generate keyboard markup with default setting', (t) => {
  const markup = Object.assign({}, Markup.keyboard(['one', 'two', 'three']))
  t.deepEqual(markup, {
    keyboard: [
      ['one'],
      ['two'],
      ['three']
    ]
  })
})

test('should generate keyboard markup with options', (t) => {
  const markup = Object.assign({}, Markup.keyboard(['one', 'two', 'three'], {columns: 3}))
  t.deepEqual(markup, {
    keyboard: [
      ['one', 'two', 'three']
    ]
  })
})

test('should generate keyboard markup with custom columns', (t) => {
  const markup = Object.assign({}, Markup.keyboard(['one', 'two', 'three', 'four'], {columns: 3}))
  t.deepEqual(markup, {
    keyboard: [
      ['one', 'two', 'three'],
      ['four']
    ]
  })
})

test('should generate keyboard markup with custom wrap fn', (t) => {
  const markup = Object.assign({}, Markup.keyboard(['one', 'two', 'three', 'four'], {
    wrap: (btn, index, currentRow) => index % 2 !== 0
  }))
  t.deepEqual(markup, {
    keyboard: [
      ['one'],
      ['two', 'three'],
      ['four']
    ]
  })
})

test('should generate keyboard markup with default setting', (t) => {
  const markup = Object.assign({}, Markup.inlineKeyboard(['one', 'two', 'three', 'four']))
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
  const markup = Object.assign({}, Markup.inlineKeyboard(['one', 'two', 'three', 'four']).extra())
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

test('should generate standart button markup', (t) => {
  const markup = Object.assign({}, Markup.button('foo'))
  t.deepEqual(markup, {text: 'foo', hide: false})
})

test('should generate cb button markup', (t) => {
  const markup = Object.assign({}, Markup.callbackButton('foo', 'bar'))
  t.deepEqual(markup, {text: 'foo', callback_data: 'bar', hide: false})
})

test('should generate url button markup', (t) => {
  const markup = Object.assign({}, Markup.urlButton('foo', 'https://bar.tld'))
  t.deepEqual(markup, {text: 'foo', url: 'https://bar.tld', hide: false})
})

test('should generate location request button markup', (t) => {
  const markup = Object.assign({}, Markup.locationRequestButton('send location'))
  t.deepEqual(markup, {text: 'send location', request_location: true, hide: false})
})

test('should generate contact request button markup', (t) => {
  const markup = Object.assign({}, Markup.contactRequestButton('send contact'))
  t.deepEqual(markup, {text: 'send contact', request_contact: true, hide: false})
})

test('should generate switch inline query button markup', (t) => {
  const markup = Object.assign({}, Markup.switchToChatButton('play now', 'foo'))
  t.deepEqual(markup, {text: 'play now', switch_inline_query: 'foo', hide: false})
})

test('should generate switch inline query button markup', (t) => {
  const markup = Object.assign({}, Markup.switchToCurrentChatButton('play now', 'foo'))
  t.deepEqual(markup, {text: 'play now', switch_inline_query_current_chat: 'foo', hide: false})
})

test('should generate game button markup', (t) => {
  const markup = Object.assign({}, Markup.gameButton('play'))
  t.deepEqual(markup, {text: 'play', callback_game: {}, hide: false})
})

test('should generate game button markup', (t) => {
  const markup = Object.assign({}, Markup.gameButton('play again', true))
  t.deepEqual(markup, {text: 'play again', callback_game: {}, hide: true})
})
