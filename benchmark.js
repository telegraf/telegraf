/* global suite, bench */
global.Promise = require('bluebird')
const Telegraf = require('./')
const { passThru } = Telegraf
const baseMessage = { chat: { id: 1 } }
const textUpdate = { message: Object.assign({text: 'hello world'}, baseMessage) }
const cbQueryUpdate = { callback_query: { data: 'foo' } }
const commandUpdate = {
  message: Object.assign({text: '/start', entities: [{type: 'bot_command', offset: 0, length: 6}]}, baseMessage)
}

suite('', () => {
  const app = new Telegraf()
  bench('️empty', (next) => app.handleUpdate(textUpdate).then(next))
})

suite('', () => {
  const app = new Telegraf()
  app.use(passThru)
  bench('️use', (next) => app.handleUpdate(textUpdate).then(next))
})

suite('', () => {
  const app = new Telegraf()
  app.on('message', passThru)
  bench('️️on', (next) => app.handleUpdate(textUpdate).then(next))
})

suite('', () => {
  const app = new Telegraf()
  app.on(['message', 'text'], passThru)
  bench('️️on *', (next) => app.handleUpdate(textUpdate).then(next))
})

suite('', () => {
  const app = new Telegraf()
  app.on('text', passThru)
  bench('️️on subtype', (next) => app.handleUpdate(textUpdate).then(next))
})

suite('', () => {
  const app = new Telegraf()
  app.command('start', passThru)
  bench('️️command', (next) => app.handleUpdate(commandUpdate).then(next))
})

suite('', () => {
  const app = new Telegraf()
  app.action('foo', passThru)
  bench('️️action', (next) => app.handleUpdate(cbQueryUpdate).then(next))
})

suite('', () => {
  const app = new Telegraf()
  app.hears('hello world', passThru)
  bench('️️hears', (next) => app.handleUpdate(textUpdate).then(next))
})

suite('', () => {
  const app = new Telegraf()
  app.hears(/hello/, passThru)
  bench('️️hears regex', (next) => app.handleUpdate(textUpdate).then(next))
})

suite('', () => {
  const app = new Telegraf()
  app.hears(/hello/, passThru)
  app.on(['message', 'text'], passThru)
  app.use(passThru)
  app.command('start', passThru)
  app.on('text', passThru)
  bench('️️combo!', (next) => app.handleUpdate(textUpdate).then(next))
})
