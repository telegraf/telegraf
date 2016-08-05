[![npm](https://img.shields.io/npm/l/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![NPM Version](https://img.shields.io/npm/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![node](https://img.shields.io/node/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![Build Status](https://img.shields.io/travis/telegraf/telegraf.svg?branch=master&style=flat-square)](https://travis-ci.org/telegraf/telegraf)
[![David](https://img.shields.io/david/telegraf/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

📢 Telegram bot framework for Node.js

## Features

- Full [Telegram Bot API 2.1](https://core.telegram.org/bots/api) support
- Incredibly fast
- Easy to extend
- Minimum dependencies
- [Middlewares, middlewares everywhere](#middlewares)
- [Inline mode](https://core.telegram.org/bots/api#inline-mode)
- http/https/Connect/express.js webhooks
- Reply via webhook

## Middlewares

- [Internationalization](https://github.com/telegraf/telegraf-i18n)
- [Redis powered session](https://github.com/telegraf/telegraf-session-redis)
- [Rate-limiting](https://github.com/telegraf/telegraf-ratelimit)
- [Stateful chatbots engine](https://github.com/telegraf/telegraf-flow)
- [Powerfull bot stats via Mixpanel](https://github.com/telegraf/telegraf-mixpanel)
- [Multivariate and A/B testing](https://github.com/telegraf/telegraf-experiments)
- [statsd integration](https://github.com/telegraf/telegraf-statsd)
- [Natural language processing via recast.ai](https://github.com/telegraf/telegraf-recast)
- [and more...](https://www.npmjs.com/search?q=telegraf-)

## Installation

```js
$ npm install telegraf
```

## Examples
  
```js
const Telegraf = require('telegraf')

const app = new Telegraf(process.env.BOT_TOKEN)
app.on('message', (ctx) => ctx.reply('42'))
app.startPolling()
```

There are some other [examples](/examples).

## API

### Application

A Telegraf application is an object containing an array of middlewares which are composed 
and executed in a stack-like manner upon request. Is similar to many other middleware systems 
that you may have encountered such as Koa, Ruby's Rack, Connect.

### Context

A Telegraf Context encapsulates telegram message.
Context is created per request and contains following props:

```js
app.on('message', (ctx) => {
  ctx.telegram             // Telegram instance
  ctx.updateType           // Update type(message, inline_query, etc.)
  [ctx.updateSubType]      // Update subtype(text, sticker, audio, etc.)
  [ctx.message]            // Received message
  [ctx.inlineQuery]        // Received inline query
  ...
})
```

[Context API docs](/docs/api.md#context)

### Cascading

Middleware normally takes two parameters (ctx, next), `ctx` is the context for one Telegram message,
`next` is a function that is invoked to execute the downstream middleware. 
It returns a Promise with a then function for running code after completion.

```js
const app = new Telegraf(process.env.BOT_TOKEN)

// Logger middleware
app.use((ctx, next) => {
  const start = new Date()
  return next().then(() => {
    const ms = new Date() - start
    console.log('response time %sms', ms)
  })
})

app.on('text', (ctx) => ctx.reply('Hello World'))
```

### State

The recommended namespace to share information between middlewares.

```js
const app = new Telegraf(process.env.BOT_TOKEN)

app.use((ctx, next) => {
  ctx.state.role = getUserRole(ctx.message) 
  return next()
})

app.on('text', (ctx) => {
  return ctx.reply(`Hello ${ctx.state.role}`)
})
```

### Session

```js
const app = new Telegraf(process.env.BOT_TOKEN)
app.use(Telegraf.memorySession())
app.on('text', (ctx) => {
  ctx.session.counter = ctx.session.counter || 0
  ctx.session.counter++
  return ctx.reply(`Message counter:${ctx.session.counter}`)
})
```

**Note: For persistent sessions you can use any of [`telegraf-session-*`](https://www.npmjs.com/search?q=telegraf-session) middleware.**

### Error Handling

By default Telegraf will print all errors to stderr and rethrow error. 
To perform custom error-handling logic you can set `onError` handler:

```js
telegraf.onError = (err) => {
  log.error('Ooops', err)
  throw err
}
```

### Developer docs

[Telegraf API docs](/docs/api.md)

## License

The MIT License (MIT)

Copyright (c) 2016 Telegraf

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
