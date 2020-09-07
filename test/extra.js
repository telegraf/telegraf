const test = require('ava')
const Extra = require('../lib/extra')
const { Markup } = require('../lib/markup')

test('should generate default options from contructor', (t) => {
  const extra = { ...new Extra({ parse_mode: 'LaTeX' }) }
  t.deepEqual(extra, { parse_mode: 'LaTeX' })
})

test('should generate default options', (t) => {
  const extra = { ...Extra.load({ parse_mode: 'LaTeX' }) }
  t.deepEqual(extra, { parse_mode: 'LaTeX' })
})

test('should generate inReplyTo options', (t) => {
  const extra = { ...Extra.inReplyTo(42) }
  t.deepEqual(extra, { reply_to_message_id: 42 })
})

test('should generate HTML options', (t) => {
  const extra = { ...Extra.HTML() }
  t.deepEqual(extra, { parse_mode: 'HTML' })
})

test('should generate Markdown options', (t) => {
  const extra = { ...Extra.markdown() }
  t.deepEqual(extra, { parse_mode: 'Markdown' })
})

test('should generate notifications options', (t) => {
  const extra = { ...Extra.notifications(false) }
  t.deepEqual(extra, { disable_notification: true })
})

test('should generate web preview options', (t) => {
  const extra = { ...Extra.webPreview(false) }
  t.deepEqual(extra, { disable_web_page_preview: true })
})

test('should generate markup options', (t) => {
  const extra = { ...Extra.markup(Markup.removeKeyboard()).reply_markup }
  t.deepEqual(extra, { reply_markup: { remove_keyboard: true } })
})

test('should generate markup options in functional style', (t) => {
  const extra = { ...Extra.markdown().markup((markup) => markup.removeKeyboard().reply_markup) }
  t.deepEqual(extra, { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } })
})

test('should generate caption options', (t) => {
  const extra = { ...Extra.markdown().caption('text') }
  t.deepEqual(extra, { parse_mode: 'Markdown', caption: 'text' })
})

test('should generate caption options from static method', (t) => {
  const extra = { ...Extra.caption('text') }
  t.deepEqual(extra, { caption: 'text' })
})
