require('should')
const test = require('ava')
const Telegraf = require('../')
const { Markup } = Telegraf

test('should generate hideKeyboard markup (Deprecated)', (t) => {
  const markup = Object.assign({}, Markup.hideKeyboard())
  markup.should.deepEqual({remove_keyboard: true})
})

test('should generate hideKeyboard markup (Deprecated)', (t) => {
  const markup = Object.assign({}, new Markup().hideKeyboard())
  markup.should.deepEqual({remove_keyboard: true})
})

test('should generate removeKeyboard markup', (t) => {
  const markup = Object.assign({}, Markup.removeKeyboard())
  markup.should.deepEqual({remove_keyboard: true})
})

test('should generate forceReply markup', (t) => {
  const markup = Object.assign({}, Markup.forceReply())
  markup.should.deepEqual({force_reply: true})
})

test('should generate resizeKeyboard markup', (t) => {
  const markup = Object.assign({}, Markup.keyboard([]).resize())
  markup.should.deepEqual({resize_keyboard: true})
})

test('should generate oneTimeKeyboard markup', (t) => {
  const markup = Object.assign({}, Markup.keyboard([]).oneTime())
  markup.should.deepEqual({one_time_keyboard: true})
})

test('should generate selective hide markup', (t) => {
  const markup = Object.assign({}, Markup.removeKeyboard().selective())
  markup.should.deepEqual({remove_keyboard: true, selective: true})
})

test('should generate selective one time keyboard markup', (t) => {
  const markup = Object.assign({}, Markup.keyboard().selective().oneTime())
  markup.should.deepEqual({selective: true, one_time_keyboard: true})
})

test('should generate keyboard markup', (t) => {
  const markup = Object.assign({}, Markup.keyboard([['one'], ['two', 'three']]))
  markup.should.deepEqual({
    keyboard: [
      ['one'],
      ['two', 'three']
    ]
  })
})

test('should generate keyboard markup with default setting', (t) => {
  const markup = Object.assign({}, Markup.keyboard(['one', 'two', 'three']))
  markup.should.deepEqual({
    keyboard: [
      ['one'],
      ['two'],
      ['three']
    ]
  })
})

test('should generate keyboard markup with options', (t) => {
  const markup = Object.assign({}, Markup.keyboard(['one', 'two', 'three'], {columns: 3}))
  markup.should.deepEqual({
    keyboard: [
      ['one', 'two', 'three']
    ]
  })
})

test('should generate keyboard markup with custom columns', (t) => {
  const markup = Object.assign({}, Markup.keyboard(['one', 'two', 'three', 'four'], {columns: 3}))
  markup.should.deepEqual({
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
  markup.should.deepEqual({
    keyboard: [
      ['one'],
      ['two', 'three'],
      ['four']
    ]
  })
})

test('should generate keyboard markup with default setting', (t) => {
  const markup = Object.assign({}, Markup.inlineKeyboard(['one', 'two', 'three', 'four']))
  markup.should.deepEqual({
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
  markup.should.deepEqual({
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

test('should generate cb button markup', (t) => {
  const markup = Object.assign({}, Markup.callbackButton('foo', 'bar'))
  markup.should.deepEqual({text: 'foo', callback_data: 'bar', hide: false})
})

test('should generate url button markup', (t) => {
  const markup = Object.assign({}, Markup.urlButton('foo', 'https://bar.tld'))
  markup.should.deepEqual({text: 'foo', url: 'https://bar.tld', hide: false})
})

test('should generate location request button markup', (t) => {
  const markup = Object.assign({}, Markup.locationRequestButton('send location'))
  markup.should.deepEqual({text: 'send location', request_location: true, hide: false})
})

test('should generate contact request button markup', (t) => {
  const markup = Object.assign({}, Markup.contactRequestButton('send contact'))
  markup.should.deepEqual({text: 'send contact', request_contact: true, hide: false})
})

test('should generate switch inline query button markup', (t) => {
  const markup = Object.assign({}, Markup.switchToChatButton('play now', 'foo'))
  markup.should.deepEqual({text: 'play now', switch_inline_query: 'foo', hide: false})
})

test('should generate switch inline query button markup', (t) => {
  const markup = Object.assign({}, Markup.switchToCurrentChatButton('play now', 'foo'))
  markup.should.deepEqual({text: 'play now', switch_inline_query_current_chat: 'foo', hide: false})
})

test('should generate game button markup', (t) => {
  const markup = Object.assign({}, Markup.gameButton('play'))
  markup.should.deepEqual({text: 'play', callback_game: {}, hide: false})
})

test('should generate game button markup', (t) => {
  const markup = Object.assign({}, Markup.gameButton('play again', true))
  markup.should.deepEqual({text: 'play again', callback_game: {}, hide: true})
})
