import { Telegraf } from 'telegraf';

const { BOT_TOKEN, PROJECT_ID, FUNCTION_NAME, REGION } = process.env;

const bot = new Telegraf(BOT_TOKEN, {
  telegram: { webhookReply: true },
});

bot.telegram.setWebhook(
  `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}`
);

bot.command('hello', async (ctx) => ctx.reply("Hello, friend!"));

export const botFunction = async (req, res) => {
  console.log(req.body);
  try {
    await bot.handleUpdate(req.body);
    console.log('Success');
    res.status(200).send('Success');
  } catch (err) {
    console.log('Failure');
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};
