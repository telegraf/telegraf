[![License](https://img.shields.io/npm/l/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![NPM Version](https://img.shields.io/npm/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![bitHound](https://img.shields.io/bithound/code/github/telegraf/telegraf.svg?style=flat-square)](https://www.bithound.io/github/telegraf/telegraf)
[![Build Status](https://img.shields.io/travis/telegraf/telegraf.svg?branch=master&style=flat-square)](https://travis-ci.org/telegraf/telegraf)
[![node](https://img.shields.io/node/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

📣 Telegram bot framework for Node.js

## Features

- Full [Telegram Bot API 2.1](https://core.telegram.org/bots/api) support
- [Inline mode](https://core.telegram.org/bots/api#inline-mode)
- Incredibly fast
- Minimum dependencies
- Easy to extend
- Keyboard helpers
- http/https/Connect/express.js webhooks

## Installation

```js
$ npm install telegraf
```

## Example bot
  
```js
const Telegraf = require('telegraf')

const app = new Telegraf(process.env.BOT_TOKEN)
app.on('message', (ctx) => ctx.reply('42'))
app.startPolling()
```

There's some cool [examples](https://github.com/telegraf/telegraf/tree/master/examples).

## Documentation

[Telegraf developer docs](http://telegraf.js.org)

## License

The MIT License (MIT)

Copyright (c) 2016 Telegraf
