[![npm](https://img.shields.io/npm/l/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![NPM Version](https://img.shields.io/npm/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![node](https://img.shields.io/node/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![David](https://img.shields.io/david/telegraf/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)
[![Build Status](https://img.shields.io/travis/telegraf/telegraf.svg?branch=master&style=flat-square)](https://travis-ci.org/telegraf/telegraf)

📢 Modern Telegram bot framework for node.js.

## Features

- Full [Telegram Bot API 2.1](https://core.telegram.org/bots/api) support
- [Inline mode](https://core.telegram.org/bots/api#inline-mode)
- [Middlewares](https://www.npmjs.com/search?q=telegraf-)
- http/https/Connect/express.js webhooks
- Reply via webhook

## Installation

```js
$ npm install telegraf
```

## Example
  
```js
var Telegraf = require('telegraf');
var telegraf = new Telegraf(process.env.BOT_TOKEN);

// Message handling
telegraf.on('message', function * () {
  this.reply('*42*', { parse_mode: 'Markdown' })
})

telegraf.startPolling()
```

### One more example

```js
var Telegraf = require('telegraf');
var telegraf = new Telegraf(process.env.BOT_TOKEN);

// Look ma, middleware!
var sayYoMiddleware = function * (next) {
  yield this.reply('yo')
  yield next
}

// Command handling
telegraf.hears('/command', sayYoMiddleware, function * () {
  this.reply('Sure')
})

// Wow! RegEx
telegraf.hears(/reverse (.+)/, sayYoMiddleware, function * () {
  this.reply(this.match[1].split('').reverse().join(''))
})

telegraf.startPolling()
```

There are some other [examples](https://github.com/telegraf/telegraf/tree/master/examples).

## API

### Application

A Telegraf application is an object containing an array of middleware generator functions
which are composed and executed in a stack-like manner upon request. Telegraf is similar to many
other middleware systems that you may have encountered such as Koa, Ruby's Rack, Connect, and so on -
however a key design decision was made to provide high level "sugar" at the otherwise low-level
middleware layer. This improves interoperability, robustness, and makes writing middleware much
more enjoyable. 

```js
var telegraf = new Telegraf(process.env.BOT_TOKEN)

telegraf.on('text', function * (){
  this.reply('Hello World')
})

telegraf.startPolling()
```

### Cascading

Telegraf middleware cascade in a more traditional way as you may be used to with similar tools -
this was previously difficult to make user friendly with node's use of callbacks.
However with generators we can achieve "true" middleware. Contrasting Connect's implementation which
simply passes control through series of functions until one returns, Telegraf yields "downstream", then
control flows back "upstream".

The following example bot will reply with "Hello World", however first the message flows through
the `logger` middleware to mark when the message has been received. When a middleware invokes `yield next`
the function suspends and passes control to the next middleware defined. After there are no more
middleware to execute downstream, the stack will unwind and each middleware is resumed to perform
its upstream behaviour.

```js
var telegraf = new Telegraf(process.env.BOT_TOKEN)

// Logger middleware
telegraf.use(function * (next){
  var start = new Date
  this.state.started = start
  yield next
  var ms = new Date - start
  debug('response time %sms', ms)
})

telegraf.on('text', function * (){
  this.reply('Hello World')
})
```

### Context

A Telegraf Context encapsulates telegram message.
Context is created per request, and is referenced in middleware as the receiver, or the this identifier, as shown in the following snippet:

```js
telegraf.use(function * () {
  this.telegraf             // Telegraf instance
  this.updateType           // Update type(message, inline_query, etc.)
  [this.updateSubType]      // Update subtype(text, sticker, audio, etc.)
  [this.message]            // Received message
  [this.editedMessage]      // Edited message
  [this.inlineQuery]        // Received inline query
  [this.chosenInlineResult] // Received inline query result
  [this.callbackQuery]      // Received callback query
  [this.chat]               // Current chat info
  [this.from]               // Sender info
  [this.match]              // Regex match (available only for `hears` handler)
})
```

The recommended way to extend application context.

```js
var telegraf = new Telegraf(process.env.BOT_TOKEN)

telegraf.context.db = {
  getScores: function () { return 42 }
}

telegraf.on('text', function * (){
  var scores = this.db.getScores(this.message.from.username)
  this.reply(`${this.message.from.username}: ${score}`)
})
```

### State

The recommended namespace to share information between middlewares.

```js
var telegraf = new Telegraf(process.env.BOT_TOKEN)

telegraf.use(function * (next) {
  this.state.role = getUserRole(this.message) 
  yield next
})

telegraf.on('text', function * (){
  this.reply(`Hello ${this.state.role}`)
})
```

### Session

```js
var telegraf = new Telegraf(process.env.BOT_TOKEN)

// Session state will be lost on app restart
telegraf.use(Telegraf.memorySession())

telegraf.on('text', function * (){
  this.session.counter = this.session.counter || 0
  this.session.counter++
  this.reply(`Message counter:${this.session.counter}`)
})
```

**Important: For production environment use any of [`telegraf-session-*`](https://www.npmjs.com/search?q=telegraf-session) middleware.**


### Telegram WebHook

```js

var telegraf = new Telegraf(process.env.BOT_TOKEN)

// TLS options
var tlsOptions = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem'),
  // This is necessary only if the client 
  // uses the self-signed certificate.
  ca: [ fs.readFileSync('client-cert.pem') ]
}

// Set telegram webhook
telegraf.setWebHook('https://server.tld:8443/secret-path', {
  content: 'server-cert.pem'
})

// Start https webhook
telegraf.startWebHook('/secret-path', tlsOptions, 8443)


// Http webhook, for nginx/heroku users.
telegraf.startWebHook('/secret-path', null, 5000)


// Use webHookCallback() if you want attach telegraf to existing http server
require('http')
  .createServer(telegraf.webHookCallback('/secret-path'))
  .listen(3000)

require('https')
  .createServer(tlsOptions, telegraf.webHookCallback('/secret-path'))
  .listen(8443)

// Connect/Express.js integration
var express = require('express')
var app = express()

app.use(telegraf.webHookCallback('/secret-path'))

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

```

### Error Handling

By default Telegraf will print all errors to stderr and rethrow error. 
To perform custom error-handling logic you can set `onError` handler:

```js
telegraf.onError = function(err){
  log.error('server error', err)
  throw err
}
```

## API reference

[Telegraf API reference](https://github.com/telegraf/telegraf/tree/master/api.md)

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
