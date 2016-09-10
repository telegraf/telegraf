# Telegraf
<!--{h1:.massive-header.-with-tagline}-->
> Telegram bot framework for Node.js

- Full [Telegram Bot API 2.1](https://core.telegram.org/bots/api) support
- [Inline mode](https://core.telegram.org/bots/api#inline-mode)
- Incredibly fast
- Easy to extend
- Keyboard helpers
- Minimum dependencies
- http/https/Connect/express.js webhooks

## Installation

```js
$ npm install telegraf --save
```

### Example
  
```js
const Telegraf = require('telegraf')

const app = new Telegraf(process.env.BOT_TOKEN)
app.on('message', (ctx) => ctx.reply('42'))
app.startPolling()
```

There's some cool [examples](https://github.com/telegraf/telegraf/tree/master/examples)
