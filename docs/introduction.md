## Application

A Telegraf application is an object containing an array of middlewares which are composed 
and executed in a stack-like manner upon request. Is similar to many other middleware systems 
that you may have encountered such as Koa, Ruby's Rack, Connect.


## Context

A Telegraf Context encapsulates telegram message.
Context is created per request and contains following props:

```js
app.use((ctx) => {
  ctx.telegram             // Telegram instance
  ctx.updateType           // Update type (message, inline_query, etc.)
  [ctx.updateSubType]      // Update subtype (text, sticker, audio, etc.)
  [ctx.me]                 // Bot username
  [ctx.message]            // Received message
  [ctx.editedMessage]      // Edited message
  [ctx.inlineQuery]        // Received inline query
  [ctx.chosenInlineResult] // Received inline query result
  [ctx.callbackQuery]      // Received callback query
  [ctx.chat]               // Current chat info
  [ctx.from]               // Sender info
  [ctx.match]              // Regex match (available only for `hears`, `command`, `action` handlers)
})
```

#### How to extend context

The recommended way to extend application context:

```js
const app = new Telegraf(process.env.BOT_TOKEN)

app.context.db = {
  getScores: () => { return 42 }
}

app.on('text', (ctx) => {
  const scores = ctx.db.getScores(ctx.message.from.username)
  return ctx.reply(`${ctx.message.from.username}: ${score}`)
})
```

#### Shortcuts

Context shortcuts for **message** update:

```js
ctx.getChat() -> ctx.telegram.getChat()
ctx.getChatAdministrators() -> ctx.telegram.getChatAdministrators()
ctx.getChatMember() -> ctx.telegram.getChatMember()
ctx.getChatMembersCount() -> ctx.telegram.getChatMembersCount()
ctx.leaveChat() -> ctx.telegram.leaveChat()
ctx.reply() -> ctx.telegram.sendMessage()
ctx.replyWithMarkdown() -> ctx.telegram.sendMessage()
ctx.replyWithHTML() -> ctx.telegram.sendMessage()
ctx.replyWithAudio() -> ctx.telegram.sendAudio()
ctx.replyWithChatAction() -> ctx.telegram.sendChatAction()
ctx.replyWithDocument() -> ctx.telegram.sendDocument()
ctx.replyWithLocation() -> ctx.telegram.sendLocation()
ctx.replyWithPhoto() -> ctx.telegram.sendPhoto()
ctx.replyWithSticker() -> ctx.telegram.sendSticker()
ctx.replyWithVideo() -> ctx.telegram.sendVideo()
ctx.replyWithVoice() -> ctx.telegram.sendVoice()
```

Context shortcuts for **callback_query** update:

```js
ctx.answerCallbackQuery() -> ctx.telegram.answerCallbackQuery()
ctx.editMessageText() -> ctx.telegram.editMessageText()
ctx.editMessageCaption() -> ctx.telegram.editMessageCaption()
ctx.editMessageReplyMarkup() -> ctx.telegram.editMessageReplyMarkup()
ctx.getChat() -> ctx.telegram.getChat()
ctx.getChatAdministrators() -> ctx.telegram.getChatAdministrators()
ctx.getChatMember() -> ctx.telegram.getChatMember()
ctx.getChatMembersCount() -> ctx.telegram.getChatMembersCount()
ctx.leaveChat() -> ctx.telegram.leaveChat()
ctx.reply() -> ctx.telegram.sendMessage()
ctx.replyWithMarkdown() -> ctx.telegram.sendMessage()
ctx.replyWithHTML() -> ctx.telegram.sendMessage()
ctx.replyWithAudio() -> ctx.telegram.sendAudio()
ctx.replyWithChatAction() -> ctx.telegram.sendChatAction()
ctx.replyWithDocument() -> ctx.telegram.sendDocument()
ctx.replyWithLocation() -> ctx.telegram.sendLocation()
ctx.replyWithPhoto() -> ctx.telegram.sendPhoto()
ctx.replyWithSticker() -> ctx.telegram.sendSticker()
ctx.replyWithVideo() -> ctx.telegram.sendVideo()
ctx.replyWithVoice() -> ctx.telegram.sendVoice()
```

Context shortcuts for **inline_query** update:
```js
ctx.answerInlineQuery() -> ctx.telegram.answerInlineQuery()
```

#### Example

```js
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('text', (ctx) => {
  // Simple usage 
  ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`)
  
  // Using shortcut
  ctx.reply(`Hello ${ctx.state.role}`)
})

bot.on('/quit', (ctx) => {
  // Simple usage 
  ctx.telegram.leaveChat(ctx.message.chat.id)
  
  // Using shortcut
  ctx.leaveChat()
})

bot.on('callback_query', (ctx) => {
  // Simple usage 
  ctx.telegram.answerCallbackQuery(ctx.callbackQuery.id)
  
  // Using shortcut
  ctx.answerCallbackQuery()
})

bot.on('inline_query', (ctx) => {
  const result = []
  // Simple usage 
  ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)
  
  // Using shortcut
  ctx.answerInlineQuery(result)
})
```

### Cascading

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

### Update types

Supported update types:

- `message`
- `edited_message`
- `callback_query`
- `inline_query`
- `chosen_inline_result`

Available update sub-types:
`text`, `audio`, `document`, `photo`, `sticker`, `video`, `voice`, `contact`, `location`, `venue`, `new_chat_member`, `left_chat_member`, `new_chat_title`, `new_chat_photo`, `delete_chat_photo`, `group_chat_created`, `supergroup_chat_created`, `channel_chat_created`, `migrate_to_chat_id`, `migrate_from_chat_id`, `pinned_message`.

```js

// Handle message update
telegraf.on('message', (ctx) =>  {
  return ctx.reply('Hey there!')
})

// Handle sticker update
telegraf.on(['sticker', 'photo'], (ctx) =>  {
  console.log(ctx.message)
  return ctx.reply('Cool!')
})

```
<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#message)</sub>

### Webhooks

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
app.telegram.setWebHook('https://server.tld:8443/secret-path', {
  content: 'server-cert.pem'
})

// Start https webhook
app.startWebHook('/secret-path', tlsOptions, 8443)


// Http webhook, for nginx/heroku users.
app.startWebHook('/secret-path', null, 5000)


// Use webHookCallback() if you want to attach telegraf to existing http server
require('http')
  .createServer(app.webHookCallback('/secret-path'))
  .listen(3000)

require('https')
  .createServer(tlsOptions, app.webHookCallback('/secret-path'))
  .listen(8443)

// Connect/Express.js integration
const express = require('express')
const expressApp = express()

expressApp.use(app.webHookCallback('/secret-path'))

expressApp.get('/', (req, res) => {
  res.send('Hello World!')
})

expressApp.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})

```

### Files

Supported file sources:

- `Existing file_id`
- `File path`
- `Url`
- `Buffer`
- `ReadStream`

Also you can provide optional name of file as `filename`.

```js

  // resend existing file by file_id
  telegram.sendSticker('chatId', '123123jkbhj6b')

  // send file
  telegram.sendVideo('chatId', {
    source: '/path/to/video.mp4'
  })

   // send stream
  telegram.sendVideo('chatId', {
    source: fs.createReadStream('/path/to/video.mp4')
  })
  
  // send buffer
  telegram.sendVoice('chatId', {
    source: new Buffer()
  })

  // send url
  telegram.sendPhoto('chatId', {
    url: 'http://lorempixel.com/400/200/cats/',
    filename: 'kitten.jpg'
  })
```

*FYI: Telegram servers detect content type using file extension (May 2016).*

<sub>[Related Telegram api docs](https://core.telegram.org/bots/api#file)</sub>

### Error Handling

By default Telegraf will print all errors to stderr and rethrow error. 
To perform custom error-handling logic see following snippet:

```js
const app = new Telegraf(process.env.BOT_TOKEN)

app.catch((err) => {
  log.error('Ooops', err)
  throw err
})
```
