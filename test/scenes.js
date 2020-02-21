const test = require('ava')
const Telegraf = require('../')

const baseMessage = { chat: { id: 1 }, from: { id: 42, username: 'telegraf' } }

test('should create a scene', async (t) => {
  const scene1 = new Telegraf.BaseScene('one')
  let wentThroughEnter = false
  let wentThroughEnd = false
  scene1.enter((ctx) => {
    wentThroughEnter = true
  })
  scene1.command('end', (ctx) => {
    wentThroughEnd = true
  })
  scene1.command('next', (ctx) => {
    ctx.scene.enter('two', undefined, false, true)
  })

  const scene2 = new Telegraf.BaseScene('two').enter((ctx) => ctx.scene.leave())

  const stage = new Telegraf.Stage([scene1, scene2])

  const bot = new Telegraf()
  bot.use(Telegraf.session())
  bot.use(stage.middleware())
  bot.command('foo', (ctx) => ctx.scene.enter('one'))
  bot.command('end', (ctx) => console.error('kappa'))
  await bot.handleUpdate({ message: { text: '/foo', entities: [{ type: 'bot_command', offset: 0, length: 4 }], ...baseMessage } })
  t.true(wentThroughEnter)

  await bot.handleUpdate({ message: { text: '/next', entities: [{ type: 'bot_command', offset: 0, length: 5 }], ...baseMessage } })

  await bot.handleUpdate({ message: { text: '/end', entities: [{ type: 'bot_command', offset: 0, length: 4 }], ...baseMessage } })

  t.true(wentThroughEnd)
})
