const { Telegraf, Markup } = require('telegraf')

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const keyboard = Markup.keyboard([
  Markup.button.pollRequest('Create poll', 'regular'),
  Markup.button.pollRequest('Create quiz', 'quiz')
])

const bot = new Telegraf(token)

bot.on('poll', (ctx) => console.log('Poll update', ctx.poll))
bot.on('poll_answer', (ctx) => console.log('Poll answer', ctx.pollAnswer))

bot.start((ctx) => ctx.reply('supported commands: /poll /quiz', keyboard))

bot.command('poll', (ctx) =>
  ctx.replyWithPoll(
    'Your favorite math constant',
    ['x', 'e', 'π', 'φ', 'γ'],
    { is_anonymous: false }
  )
)
bot.command('quiz', (ctx) =>
  ctx.replyWithQuiz(
    '2b|!2b',
    ['True', 'False'],
    { correct_option_id: 0 }
  )
)

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
