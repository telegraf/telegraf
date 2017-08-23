![Telegraf](docs/header.png)
[![Bot API Version](https://img.shields.io/badge/Bot%20API-v3.2-f36caf.svg?style=flat-square)](https://core.telegram.org/bots/api)
[![NPM Version](https://img.shields.io/npm/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![node](https://img.shields.io/node/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![bitHound](https://img.shields.io/bithound/code/github/telegraf/telegraf.svg?style=flat-square)](https://www.bithound.io/github/telegraf/telegraf)
[![Build Status](https://img.shields.io/travis/telegraf/telegraf.svg?branch=master&style=flat-square)](https://travis-ci.org/telegraf/telegraf)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

Bots are special [Telegram](https://telegram.org) accounts designed to handle messages automatically. 
Users can interact with bots by sending them command messages in private or group chats. 
These accounts serve as an interface for code running somewhere on your server.

## Features

- Full [Telegram Bot API 3.3](https://core.telegram.org/bots/api) support
- [Telegram Payment Platform](https://telegram.org/blog/payments)
- [HTML5 Games](https://core.telegram.org/bots/api#games)
- [Inline mode](https://core.telegram.org/bots/api#inline-mode)
- Incredibly fast
- AWS **λ**/now/Heroku/Firebase ready
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

## Documentation

[Telegraf developer docs](http://telegraf.js.org)

## Examples
  
```js
const Telegraf = require('telegraf')

const app = new Telegraf(process.env.BOT_TOKEN)
app.command('start', ({ from, reply }) => {
  console.log('start', from)
  return reply('Welcome!')
})
app.hears('hi', (ctx) => ctx.reply('Hey there!'))
app.on('sticker', (ctx) => ctx.reply('👍'))
app.startPolling()
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

There's some cool [examples](https://github.com/telegraf/telegraf/tree/master/examples).

## Quick start

[Step-by-step instructions](https://github.com/telegraf/micro-bot) for building and deploying basic bot with [🤖 micro-bot](https://github.com/telegraf/micro-bot) (Telegraf high level wrapper).

### Community bots
* [yt-search-bot](https://github.com/Finalgalaxy/yt-search-bot)
* [scrobblerBot](https://github.com/drvirtuozov/scrobblerBot)
* [Counter Bot](https://github.com/leodj/telegram-counter-bot)
* [GNU/Linux Indonesia Bot](https://github.com/bgli/bglibot-js)
* Send PR to add link to your bot

### Community quickstarts
* [telegram-telegraf-bot](https://github.com/Finalgalaxy/telegram-telegraf-bot)
