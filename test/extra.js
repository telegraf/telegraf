const test = require('ava')
const Telegraf = require('../')
const { Extra, Markup } = Telegraf

test('should generate default options from contructor', (t) => {
  const extra = Object.assign({}, new Extra({parse_mode: 'LaTeX'}))
  t.deepEqual(extra, {parse_mode: 'LaTeX'})
})

test('should generate default options', (t) => {
  const extra = Object.assign({}, Extra.load({parse_mode: 'LaTeX'}))
  t.deepEqual(extra, {parse_mode: 'LaTeX'})
})

test('should generate inReplyTo options', (t) => {
  const extra = Object.assign({}, Extra.inReplyTo(42))
  t.deepEqual(extra, {reply_to_message_id: 42})
})

test('should generate HTML options', (t) => {
  const extra = Object.assign({}, Extra.HTML())
  t.deepEqual(extra, {parse_mode: 'HTML'})
})

test('should generate Markdown options', (t) => {
  const extra = Object.assign({}, Extra.markdown())
  t.deepEqual(extra, {parse_mode: 'Markdown'})
})

test('should generate notifications options', (t) => {
  const extra = Object.assign({}, Extra.notifications(false))
  t.deepEqual(extra, {disable_notification: true})
})

test('should generate web preview options', (t) => {
  const extra = Object.assign({}, Extra.webPreview(false))
  t.deepEqual(extra, {disable_web_page_preview: true})
})

test('should generate markup options', (t) => {
  const extra = Object.assign({}, Extra.markup(Markup.removeKeyboard()))
  t.deepEqual(extra, {reply_markup: {remove_keyboard: true}})
})

test('should generate markup options in functional style', (t) => {
  const extra = Object.assign({}, Extra.markdown().markup((markup) => markup.removeKeyboard()))
  t.deepEqual(extra, {parse_mode: 'Markdown', reply_markup: {remove_keyboard: true}})
})
