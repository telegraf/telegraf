# Advanced usage

## Command handling in group

For handling group/supergroup commands(`/start@your_bot`) you need to provide bot username.

```js

// Provide with options
const app = new Telegraf(process.env.BOT_TOKEN, {username: 'your_bot'})

// Or you can get username from Telegram server
const app = new Telegraf(process.env.BOT_TOKEN)

app.telegram.getMe().then((botInfo) => {
  app.options.username = botInfo.username
})

app.command('start', (ctx) => ctx.reply('Hello World'))
```

## Composer

[Example](https://github.com/telegraf/telegraf-flow/blob/master/lib/flow.js)

## Router

[Example](https://github.com/telegraf/telegraf/tree/develop/examples/custom-router-bot.js)
