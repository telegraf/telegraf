![Telegraf](header.png)

Bots are special [Telegram](https://telegram.org) accounts designed to handle messages automatically. 
Users can interact with bots by sending them command messages in private or group chats. 
These accounts serve as an interface for code running somewhere on your server.

## Features

- Full [Telegram Bot API](https://core.telegram.org/bots/api) support
- [HTML5 Games](https://core.telegram.org/bots/api#games)
- [Inline mode](https://core.telegram.org/bots/api#inline-mode)
- Incredibly fast
- AWS **λ**/[now](https://github.com/telegraf/micro-bot#deployment-to-now)/dokku/[Heroku](https://github.com/telegraf/micro-bot#deployment-to-heroku) ready
- `http`/`https`/`Connect.js`/`express.js` compatible webhooks
- Easy to extend

## Installation

```
$ npm install telegraf --save
```

Using `yarn`
```
$ yarn add telegraf
```

## Telegram token

To use the [Telegram Bot API](https://core.telegram.org/bots/api),
you first have to [get a bot account](https://core.telegram.org/bots) 
by [chatting with BotFather](https://core.telegram.org/bots#6-botfather).

BotFather will give you a *token*, something like `123456789:AbCdfGhIJKlmNoQQRsTUVwxyZ`.

## Example
  
```js
const Telegraf = require('telegraf')

const app = new Telegraf(process.env.BOT_TOKEN)

app.command('start', (ctx) => {
  console.log('start', ctx.from)
  ctx.reply('Welcome!')
})

app.hears('hi', (ctx) => ctx.reply('Hey there!'))

app.on('sticker', (ctx) => ctx.reply('👍'))

app.startPolling()
```

There's some cool [examples](https://github.com/telegraf/telegraf/tree/master/examples).
