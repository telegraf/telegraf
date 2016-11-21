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
  const markup = Object.assign({}, Extra.markup(Markup.removeKeyboard()))
  markup.should.deepEqual({reply_markup: {remove_keyboard: true}})
})

test('should generate markup options in functional style', (t) => {
  const markup = Object.assign({}, Extra.markdown().markup((markup) => markup.removeKeyboard()))
  markup.should.deepEqual({parse_mode: 'Markdown', reply_markup: {remove_keyboard: true}})
})
