const test = require('ava')
const Telegraf = require('../')
// const { session } = Telegraf

const baseMessage = { chat: { id: 1 }, from: { id: 42, username: 'telegraf' } }

test('should create a scene', async (t) => {
  const scene1 = new Telegraf.BaseScene('one')
  let plop = false
  let patate = false
  scene1.enter((ctx) => {
    console.warn('plop')
    plop = true
  })
  scene1.command('end', (ctx) => {
    console.warn('end')
    patate = true
  })
  scene1.command('next', (ctx) => {
    ctx.scene.enter('two')
  })

  const scene2 = new Telegraf.BaseScene('two').enter((ctx) => ctx.scene.leave())

  const stage = new Telegraf.Stage([scene1, scene2])

  const bot = new Telegraf()
  bot.use(Telegraf.session())
  bot.use(stage.middleware())
  bot.command('foo', (ctx) => ctx.scene.enter('one'))
  bot.command('end', (ctx) => console.error('kappa'))
  await bot.handleUpdate({ message: { text: '/foo', entities: [{ type: 'bot_command', offset: 0, length: 4 }], ...baseMessage } })
  t.true(plop)

  await bot.handleUpdate({ message: { text: '/next', entities: [{ type: 'bot_command', offset: 0, length: 5 }], ...baseMessage } })

  await bot.handleUpdate({ message: { text: '/end', entities: [{ type: 'bot_command', offset: 0, length: 4 }], ...baseMessage } })

  t.true(patate)
  // scene1.command('checkInOne', (ctx) => {
  //   console.warn("check in one")
  //   t.is(ctx.scene.session.current, 'one')
  //   t.end()
  // })

  // const scene2 = new Telegraf.BaseScene('two')
  // scene2.on('text', (ctx) => {
  //   ctx.scene.leave()
  //   bot.handleUpdate({
  //     text: '/checkInOne',
  //     entities: [{ type: 'bot_command', offset: 0, length: 11 }],
  //     ...baseMessage
  //   })
  // })
  // const scene3 = new Telegraf.BaseScene('three')
  // const scene4 = new Telegraf.BaseScene('four')
  // const bot = new Telegraf()

  // stage.register(scene1, scene2, scene3, scene4)
  // bot.use(stage.middleware())
  // bot.command('enter', (ctx) => {
  //   console.warn("enter")

  //   ctx.scene.enter('one')
  //   t.is(ctx.scene.session.current, 'two')
  //   bot.handleUpdate({
  //     text: 'foo',
  //     ...baseMessage
  //   })
  // })
  // bot.handleUpdate({
  //   text: '/enter',
  //   entities: [{ type: 'bot_command', offset: 0, length: 6 }],
  //   ...baseMessage
  // })
})
