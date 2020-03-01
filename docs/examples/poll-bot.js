const Telegraf = require('telegraf')
const { Extra, Markup } = Telegraf

const keyboard = Markup.keyboard([
  Markup.pollRequestButton('Create poll', 'regular'),
  Markup.pollRequestButton('Create quiz', 'quiz')
])

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('poll', (ctx) => console.log('Poll update', ctx.poll))
bot.on('poll_answer', (ctx) => console.log('Poll answer', ctx.pollAnswer))

bot.start((ctx) => ctx.reply('supported commands: /poll /quiz', Extra.markup(keyboard)))

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
