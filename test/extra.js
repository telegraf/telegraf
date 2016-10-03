require('should')
const test = require('ava')
const Telegraf = require('../')
const { Extra, Markup } = Telegraf

test('should generate default options from contructor', (t) => {
  const markup = Object.assign({}, new Extra({parse_mode: 'LaTeX'}))
  markup.should.deepEqual({parse_mode: 'LaTeX'})
})

test('should generate default options', (t) => {
  const markup = Object.assign({}, Extra.load({parse_mode: 'LaTeX'}))
  markup.should.deepEqual({parse_mode: 'LaTeX'})
})

test('should generate inReplyTo options', (t) => {
  const markup = Object.assign({}, Extra.inReplyTo(42))
  markup.should.deepEqual({reply_to_message_id: 42})
})

test('should generate HTML options', (t) => {
  const markup = Object.assign({}, Extra.HTML())
  markup.should.deepEqual({parse_mode: 'HTML'})
})

test('should generate Markdown options', (t) => {
  const markup = Object.assign({}, Extra.markdown())
  markup.should.deepEqual({parse_mode: 'Markdown'})
})

test('should generate notifications options', (t) => {
  const markup = Object.assign({}, Extra.notifications(false))
  markup.should.deepEqual({disable_notification: true})
})

test('should generate web preview options', (t) => {
  const markup = Object.assign({}, Extra.webPreview(false))
  markup.should.deepEqual({disable_web_page_preview: true})
})

test('should generate markup options', (t) => {
  const markup = Object.assign({}, Extra.markdown().markup(Markup.hideKeyboard()))
  markup.should.deepEqual({parse_mode: 'Markdown', reply_markup: {hide_keyboard: true}})
})

test('should generate markup options in functional style', (t) => {
  const markup = Object.assign({}, Extra.markdown().markup((markup) => markup.hideKeyboard()))
  markup.should.deepEqual({parse_mode: 'Markdown', reply_markup: {hide_keyboard: true}})
})

test('should generate hideKeyboard markup', (t) => {
  const markup = Object.assign({}, Markup.hideKeyboard())
  markup.should.deepEqual({hide_keyboard: true})
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
  const markup = Object.assign({}, Markup.hideKeyboard().selective())
  markup.should.deepEqual({hide_keyboard: true, selective: true})
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
