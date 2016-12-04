# Introduction

## Application

A Telegraf application is an object containing an array of middlewares which are composed 
and executed in a stack-like manner upon request. Is similar to many other middleware systems 
that you may have encountered such as Koa, Ruby's Rack, Connect.

## Middleware

Middleware is an essential part of any modern framework.
It allows you to modify requests and responses as they pass between the Telegram and your bot.

You can imagine middleware as a chain of logic connection your bot to the Telegram request.

Middleware normally takes two parameters (ctx, next), `ctx` is the context for one Telegram message, 
`next` is a function that is invoked to execute the downstream middleware. 
It returns a Promise with a then function for running code after completion.

```js
const app = new Telegraf(process.env.BOT_TOKEN)

app.use((ctx, next) => {
  const start = new Date()
  return next().then(() => {
    const ms = new Date() - start
    console.log('Response time %sms', ms)
  })
})

app.on('text', (ctx) => ctx.reply('Hello World'))
```

#### Cascading with async functions (Babel required)

```js
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log('Response time %sms', ms)
})
```

#### Known middleware

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


## Error handling

By default Telegraf will print all errors to stderr and rethrow error.

To perform custom error-handling logic use following snippet:

```js
const app = new Telegraf(process.env.BOT_TOKEN)

app.catch((err) => {
  console.log('Ooops', err)
})
```

## Context

A Telegraf context encapsulates telegram update.

```js
app.on('sticker', (ctx) => { 
  console.log(ctx.message.sticker)
  return ctx.reply('Hey there!')
})
```

[Context documentation](context.md)

## State

The recommended namespace to share information between middlewares.

```js
const app = new Telegraf(process.env.BOT_TOKEN)

// Auth middleware
app.use((ctx, next) => {
  ctx.state.role = getUserRole(ctx.message) 
  return next()
})

app.on('text', (ctx) => {
  return ctx.reply(`Hello ${ctx.state.role}`)
})
```

## Session

```js
const app = new Telegraf(process.env.BOT_TOKEN)

app.use(Telegraf.memorySession())

app.on('text', (ctx) => {
  ctx.session.counter = ctx.session.counter || 0
  ctx.session.counter++
  return ctx.reply(`Message counter:${ctx.session.counter}`)
})
```

**Note: For persistent sessions you might use any of [`telegraf-session-*`](https://www.npmjs.com/search?q=telegraf-session) middleware.**

## Update types

Supported update types:

- `message`
- `edited_message`
- `callback_query`
- `inline_query`
- `chosen_inline_result`
- `channel_post`
- `edited_channel_post`

Available update sub-types:
`text`, `audio`, `document`, `photo`, `sticker`, `video`, `voice`, `contact`, `location`, 
`venue`, `new_chat_member`, `left_chat_member`, `new_chat_title`, `new_chat_photo`, 
`delete_chat_photo`, `group_chat_created`, `supergroup_chat_created`, `channel_chat_created`, 
`migrate_to_chat_id`, `migrate_from_chat_id`, `pinned_message`, `game`.

```js

// Handle message update
telegraf.on('message', (ctx) =>  {
  return ctx.reply('Hey there!')
})

// Handle sticker or photo update
telegraf.on(['sticker', 'photo'], (ctx) =>  {
  console.log(ctx.message)
  return ctx.reply('Cool!')
})

```
<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#message)</sub>

## Webhooks

```js

const app = new Telegraf(process.env.BOT_TOKEN)

// TLS options
const tlsOptions = {
  key:  fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem'),
  ca: [ 
    // This is necessary only if the client uses the self-signed certificate.
    fs.readFileSync('client-cert.pem') 
  ]
}

// Set telegram webhook
app.telegram.setWebhook('https://server.tld:8443/secret-path', {
  content: 'server-cert.pem'
})

// Start https webhook
app.startWebhook('/secret-path', tlsOptions, 8443)


// Http webhook, for nginx/heroku users.
app.startWebhook('/secret-path', null, 5000)


// Use webhookCallback() if you want to attach telegraf to existing http server
require('http')
  .createServer(app.webhookCallback('/secret-path'))
  .listen(3000)

require('https')
  .createServer(tlsOptions, app.webhookCallback('/secret-path'))
  .listen(8443)

// Connect/Express.js integration
const express = require('express')
const expressApp = express()

expressApp.use(app.webhookCallback('/secret-path'))

expressApp.get('/', (req, res) => {
  res.send('Hello World!')
})

expressApp.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})

```
