[![NPM Version](https://img.shields.io/npm/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![node](https://img.shields.io/node/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![bitHound](https://img.shields.io/bithound/code/github/telegraf/telegraf.svg?style=flat-square)](https://www.bithound.io/github/telegraf/telegraf)
[![Build Status](https://img.shields.io/travis/telegraf/telegraf.svg?branch=master&style=flat-square)](https://travis-ci.org/telegraf/telegraf)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

# Telegraf
> 📡 Modern Telegram bot framework for Node.js

Bots are special [Telegram](https://telegram.org) accounts designed to handle messages automatically. 
Users can interact with bots by sending them command messages in private or group chats. 
These accounts serve as an interface for code running somewhere on your server.

## Features

- Full [Telegram Bot API](https://core.telegram.org/bots/api) support
- [HTML5 Games](https://core.telegram.org/bots/api#games)
- [Inline mode](https://core.telegram.org/bots/api#inline-mode)
- Incredibly fast
- AWS **λ**/now/dokku/Heroku ready
- `http`/`https`/`Connect.js`/`express.js` compatible webhooks
- Easy to extend

## Installation

```js
$ npm install telegraf --save
```

## Telegram token

To use the [Telegram Bot API](https://core.telegram.org/bots/api), 
you first have to [get a bot account](https://core.telegram.org/bots) 
by [chatting with BotFather](https://core.telegram.org/bots#6-botfather).

BotFather will give you a *token*, something like `123456789:AbCdfGhIJKlmNoQQRsTUVwxyZ`.
With the token in hand, you can start developing your bot.

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

## Documentation

[Telegraf developer docs](http://telegraf.js.org)

