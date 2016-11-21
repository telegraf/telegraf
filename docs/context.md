# Telegraf Context

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
  [ctx.channelPost]        // New incoming channel post of any kind — text, photo, sticker, etc.
  [ctx.editedChannelPost]  // New version of a channel post that is known to the bot and was edited
  [ctx.chat]               // Current chat info
  [ctx.from]               // Sender info
  [ctx.match]              // Regex match (available only for `hears`, `command`, `action` handlers)
})
```

## How to extend context

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

## Shortcuts

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
ctx.replyWithGame() -> ctx.telegram.sendGame()
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
ctx.replyWithGame() -> ctx.telegram.sendGame()
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
