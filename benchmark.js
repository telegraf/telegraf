/* global suite, bench */
const Telegraf = require('./')
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

function wrap (fn) {
  return () => Promise.resolve().then(fn)
}

suite('Telegraf', () => {
  bench('handle update', (next) => {
    const app = new Telegraf()
    app.handleUpdate(textUpdate).then(next)
  })

  bench('use', (next) => {
    const app = new Telegraf()
    app.use(wrap(next))
    app.handleUpdate(textUpdate)
  })

  bench('on', (next) => {
    const app = new Telegraf()
    app.on('message', wrap(next))
    app.handleUpdate(textUpdate)
  })

  bench('on [subtype]', (next) => {
    const app = new Telegraf()
    app.on('text', wrap(next))
    app.handleUpdate(textUpdate)
  })

  bench('command', (next) => {
    const app = new Telegraf()
    app.command('start', wrap(next))
    app.handleUpdate(commandUpdate)
  })

  bench('hears', (next) => {
    const app = new Telegraf()
    app.hears('hello world', wrap(next))
    app.handleUpdate(textUpdate)
  })

  bench('hears RegEx', (next) => {
    const app = new Telegraf()
    app.hears(/hello/, wrap(next))
    app.handleUpdate(textUpdate)
  })

  bench('action', (next) => {
    const app = new Telegraf()
    app.action('foo', wrap(next))
    app.handleUpdate(cbQueryUpdate)
  })
})
