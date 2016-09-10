# Telegraf
<!--{h1:.massive-header.-with-tagline}-->
> Telegram bot framework for Node.js

- Full [Telegram Bot API 2.1](https://core.telegram.org/bots/api) support
- Incredibly fast
- Easy to extend
- Keyboard helpers
- [Community middleware](#middleware)
- Minimum dependencies
- [Inline mode](https://core.telegram.org/bots/api#inline-mode)
- http/https/Connect/express.js webhooks
- Reply via webhook

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

There are some other [examples](https://github.com/telegraf/telegraf/tree/master/examples)

## Known middleware

- [Internationalization](https://github.com/telegraf/telegraf-i18n)
- [Redis powered session](https://github.com/telegraf/telegraf-session-redis)
- [Stateful chatbots engine](https://github.com/telegraf/telegraf-flow)
- [Rate-limiting](https://github.com/telegraf/telegraf-ratelimit)
- [Natural language processing via wit.ai](https://github.com/telegraf/telegraf-wit)
- [Natural language processing via recast.ai](https://github.com/telegraf/telegraf-recast)
- [Multivariate and A/B testing](https://github.com/telegraf/telegraf-experiments)
- [Powerfull bot stats via Mixpanel](https://github.com/telegraf/telegraf-mixpanel)
- [statsd integration](https://github.com/telegraf/telegraf-statsd)
- [and more...](https://www.npmjs.com/search?q=telegraf-)
