// This is a test file for the TypeScript typings.
// It is not intended to be used by external users.
import Telegraf from './index';

const randomPhoto = 'https://picsum.photos/200/300/?random'
const sayYoMiddleware = ({ reply }, next) => reply('yo').then(() => next())

const {reply} =  Telegraf;

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('Bot started!'));

// Login widget events
bot.on('connected_website', ({ reply }) => reply('Website connected'))

bot.command('cat', ({ replyWithPhoto }) => replyWithPhoto(randomPhoto))

// Look ma, reply middleware factory
bot.command('foo', reply('http://coub.com/view/9cjmt'))

// Start polling
bot.startPolling()
