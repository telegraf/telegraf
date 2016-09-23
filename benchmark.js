/* global suite, bench */
global.Promise = require('bluebird')

const Telegraf = require('./')
const { passThru } = Telegraf
const baseMessage = { chat: { id: 1 } }

const textUpdate = {
  message: Object.assign({text: 'hello world'}, baseMessage)
}

const cbQueryUpdate = {
  callback_query: {
    message: Object.assign({text: 'hello world'}, baseMessage),
    data: 'foo'
  }
}

const commandUpdate = {
  message: Object.assign({text: '/start', entities: [{type: 'bot_command', offset: 0, length: 6}]}, baseMessage)
}

suite('raw', () => {
  const app = new Telegraf()
  bench('⚡️', (next) => app.handleUpdate(textUpdate).then(next))
})

suite('use', () => {
  const app = new Telegraf()
  app.use(passThru)
  bench('️⚡️', (next) => app.handleUpdate(textUpdate).then(next))
})

suite('on', () => {
  const app = new Telegraf()
  app.on('message', passThru)
  bench('️️⚡️', (next) => app.handleUpdate(textUpdate).then(next))
})

suite('on subtype', () => {
  const app = new Telegraf()
  app.on('text', passThru)
  bench('️️⚡️', (next) => app.handleUpdate(textUpdate).then(next))
})

suite('command', () => {
  const app = new Telegraf()
  app.command('start', passThru)
  bench('️️⚡️', (next) => app.handleUpdate(commandUpdate).then(next))
})

suite('hears', () => {
  const app = new Telegraf()
  app.hears('hello world', passThru)
  bench('️️⚡️', (next) => app.handleUpdate(textUpdate).then(next))
})

suite('hears regex', () => {
  const app = new Telegraf()
  app.hears(/hello/, passThru)
  bench('️️⚡️', (next) => app.handleUpdate(textUpdate).then(next))
})

suite('action', () => {
  const app = new Telegraf()
  app.action('foo', passThru)
  bench('️️⚡️', (next) => app.handleUpdate(cbQueryUpdate).then(next))
})
