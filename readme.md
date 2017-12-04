## telegraf.js

Bots are special [Telegram](https://telegram.org) accounts designed to handle messages automatically. 
Users can interact with bots by sending them command messages in private or group chats. 
These accounts serve as an interface for code running somewhere on your server.

![Telegraf](docs/header.png)
[![Bot API Version](https://img.shields.io/badge/Bot%20API-v3.5-f36caf.svg?style=flat-square)](https://core.telegram.org/bots/api)
[![NPM Version](https://img.shields.io/npm/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![node](https://img.shields.io/node/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![bitHound](https://img.shields.io/bithound/code/github/telegraf/telegraf.svg?style=flat-square)](https://www.bithound.io/github/telegraf/telegraf)
[![Build Status](https://img.shields.io/travis/telegraf/telegraf.svg?branch=master&style=flat-square)](https://travis-ci.org/telegraf/telegraf)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

### Features

- Full [Telegram Bot API 3.5](https://core.telegram.org/bots/api) support
- [Telegram Payment Platform](https://telegram.org/blog/payments)
- [HTML5 Games](https://core.telegram.org/bots/api#games)
- [Inline mode](https://core.telegram.org/bots/api#inline-mode)
- Incredibly fast
- AWS **λ**/now/Heroku/Firebase/Glitch/Whatever ready
- `http`/`https`/`koa`/`fastify`/`Connect.js`/`express.js` compatible webhooks
- Easy to extend

### Installation

```
$ npm install telegraf
```
or using `yarn`:
```
$ yarn add telegraf
```

### Examples
  
```js
const Telegraf = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => {
  console.log('started:', ctx.from.id)
  return ctx.reply('Welcome!')
})
bot.command('help', (ctx) => ctx.reply('Try send a sticker!'))
bot.hears('hi', (ctx) => ctx.reply('Hey there!'))
bot.hears(/buy/i, (ctx) => ctx.reply('Buy-buy!'))
bot.on('sticker', (ctx) => ctx.reply('👍'))

bot.startPolling()
```

```js
const Telegraf = require('telegraf')
const { reply } = Telegraf

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.command('/oldschool', (ctx) => ctx.reply('Hello'))
bot.command('/modern', ({ reply }) => reply('Yo'))
bot.command('/hipster', reply('λ'))
bot.startPolling()
```

There's some cool [examples too](docs/examples/).

### Documentation

[Telegraf developer docs](http://telegraf.js.org)
