<header>

<div align="center">
<img src="docs/assets/logo.svg" alt="logo" height="90" align="center">
<h1 align="center">telegraf.js</h1>

<p>Modern Telegram Bot API framework for Node.js</p>

<a href="https://core.telegram.org/bots/api">
	<img src="https://img.shields.io/badge/Bot%20API-v9.6-f36caf.svg?style=flat-square" alt="Bot API Version" />
</a>
<a href="https://packagephobia.com/result?p=telegraf,node-telegram-bot-api">
	<img src="https://flat.badgen.net/packagephobia/install/telegraf" alt="install size" />
</a>
<a href="https://github.com/telegraf/telegraf">
	<img src="https://img.shields.io/github/languages/top/telegraf/telegraf?style=flat-square&logo=github" alt="GitHub top language" />
</a>
<a href="https://telegram.me/TelegrafJSChat">
	<img src="https://img.shields.io/badge/English%20chat-grey?style=flat-square&logo=telegram" alt="English chat" />
</a>
</div>

</header>

## About v6

Telegraf v6 is a major release focused on restoring full coverage of the
current Telegram Bot API while keeping the stable Telegraf programming model.
It adds Bot API 9.6 support, runtime wrappers for every typed Bot API method,
updated TypeScript declarations, and multipart upload handling for nested
payloads used by newer API objects.

Most existing v4 middleware, context, session, scene, webhook, and formatting
patterns remain the intended migration path. Newer Bot API methods are exposed
through raw object-style calls such as `ctx.telegram.sendChecklist({ ... })`;
positional convenience helpers are kept where Telegraf already had an
established pattern.

> Maintainer note: until the Bot API 9.6 update lands in the upstream
> `telegraf/types` package, this branch temporarily depends on
> `git+https://github.com/Leask/types.git#bot-api-9.6-sync`. Before publishing
> or merging upstream, replace this dependency with the official
> `@telegraf/types` 9.6 release or accepted upstream branch.

## Introduction

Bots are special [Telegram](https://telegram.org) accounts designed to handle messages automatically.
Users can interact with bots by sending them command messages in private or group chats.
These accounts serve as an interface for code running somewhere on your server.

Telegraf is a library that makes it simple for you to develop your own Telegram bots using JavaScript or [TypeScript](https://www.typescriptlang.org/).

### Features

- Full [Telegram Bot API 9.6](https://core.telegram.org/bots/api) support
- Runtime wrappers for every typed official Bot API method
- TypeScript declarations backed by `@telegraf/types`
- Nested `InputFile` multipart uploads for modern media payloads
- Native `fetch` by default on Node.js 20+
- [Lightweight](https://packagephobia.com/result?p=telegraf,node-telegram-bot-api)
- [AWS **λ**](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html)
  / [Firebase](https://firebase.google.com/products/functions/)
  / [Glitch](https://glitch.com/edit/#!/dashing-light)
  / [Fly.io](https://fly.io/docs/languages-and-frameworks/node)
  / Whatever ready
- `http/https/fastify/Connect.js/express.js` compatible webhooks
- Extensible

### Example

```js
const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on(message('sticker'), (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

```js
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.command('hipster', Telegraf.reply('λ'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

For additional bot examples see the [`docs repo`](https://github.com/feathers-studio/telegraf-docs/).

### Resources

- [Getting started](#getting-started)
- [API reference](https://telegraf.js.org/modules.html)
- Telegram groups (sorted by number of members):
  - [English](https://t.me/TelegrafJSChat)
  - [Russian](https://t.me/telegrafjs_ru)
  - [Uzbek](https://t.me/botjs_uz)
  - [Ethiopian](https://t.me/telegraf_et)
- [GitHub Discussions](https://github.com/telegraf/telegraf/discussions)
- [Dependent repositories](https://libraries.io/npm/telegraf/dependent_repositories)

## Getting started

### Telegram token

To use the [Telegram Bot API](https://core.telegram.org/bots/api),
you first have to [get a bot account](https://core.telegram.org/bots)
by [chatting with BotFather](https://core.telegram.org/bots#6-botfather).

BotFather will give you a _token_, something like `123456789:AbCdefGhIJKlmNoPQRsTUVwxyZ`.

### Installation

```shellscript
$ npm install telegraf
```

or

```shellscript
$ yarn add telegraf
```

or

```shellscript
$ pnpm add telegraf
```

### Runtime networking

Telegraf uses the Node.js native `globalThis.fetch` implementation by default.
It does not bundle `node-fetch` or expose `node-fetch`-specific `agent` options.

If your bot needs a proxy, custom TLS handling, custom compression, or another
special network path, install the fetch implementation you need and pass it
explicitly:

```js
import { Telegraf } from 'telegraf'
import fetch from 'node-fetch'

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: { fetch },
})
```

The custom fetch is used for both Bot API calls and URL attachments.

### `Telegraf` class

[`Telegraf`] instance represents your bot. It's responsible for obtaining updates and passing them to your handlers.

Start by [listening to commands](https://telegraf.js.org/classes/Telegraf-1.html#command) and [launching](https://telegraf.js.org/classes/Telegraf-1.html#launch) your bot.

### `Context` class

`ctx` you can see in every example is a [`Context`] instance.
[`Telegraf`] creates one for each incoming update and passes it to your middleware.
It contains the `update`, `botInfo`, and `telegram` for making arbitrary Bot API requests,
as well as shorthand methods and getters.

This is probably the class you'll be using the most.

#### Shorthand methods

```js
import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('quit', async (ctx) => {
  // Explicit usage
  await ctx.telegram.leaveChat(ctx.message.chat.id)

  // Using context shortcut
  await ctx.leaveChat()
})

bot.on(message('text'), async (ctx) => {
  // Explicit usage
  await ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`)

  // Using context shortcut
  await ctx.reply(`Hello ${ctx.state.role}`)
})

bot.on('callback_query', async (ctx) => {
  // Explicit usage
  await ctx.telegram.answerCbQuery(ctx.callbackQuery.id)

  // Using context shortcut
  await ctx.answerCbQuery()
})

bot.on('inline_query', async (ctx) => {
  const result = []
  // Explicit usage
  await ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)

  // Using context shortcut
  await ctx.answerInlineQuery(result)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
```

## Production

### Webhooks

```TS
import { Telegraf } from "telegraf";
import { message } from 'telegraf/filters';

const bot = new Telegraf(token);

bot.on(message("text"), ctx => ctx.reply("Hello"));

// Start webhook via launch method (preferred)
bot.launch({
  webhook: {
    // Public domain for webhook; e.g.: example.com
    domain: webhookDomain,

    // Port to listen on; e.g.: 8080
    port: port,

    // Optional path to listen for.
    // `bot.secretPathComponent()` will be used by default
    path: webhookPath,

    // Optional secret to be sent back in a header for security.
    // e.g.: `crypto.randomBytes(64).toString("hex")`
    secretToken: randomAlphaNumericString,
  },
});
```

Use `createWebhook()` if you want to attach Telegraf to an existing http server.

<!-- global bot, tlsOptions -->

```TS
import { createServer } from "http";

createServer(await bot.createWebhook({ domain: "example.com" })).listen(3000);
```

```TS
import { createServer } from "https";

createServer(tlsOptions, await bot.createWebhook({ domain: "example.com" })).listen(8443);
```

- [Webhook and serverless examples](https://github.com/feathers-studio/telegraf-docs/)
- [NestJS framework integration module](https://github.com/bukhalo/nestjs-telegraf)
- [Cloudflare Workers integration module](https://github.com/Tsuk1ko/cfworker-middware-telegraf)
- Use [`bot.handleUpdate`](https://telegraf.js.org/classes/Telegraf-1.html#handleupdate) to write new integrations

### Error handling

If middleware throws an error or times out, Telegraf calls `bot.handleError`. If it rethrows, update source closes, and then the error is printed to console and process terminates. If it does not rethrow, the error is swallowed.

Default `bot.handleError` always rethrows. You can overwrite it using `bot.catch` if you need to.

⚠️ Swallowing unknown errors might leave the process in invalid state!

ℹ️ In production, `systemd` or [`pm2`](https://www.npmjs.com/package/pm2) can restart your bot if it exits for any reason.

## Advanced topics

### Working with files

Supported file sources:

- `Existing file_id`
- `File path`
- `Url`
- `Buffer`
- `ReadStream`

Also, you can provide an optional name of a file as `filename` when you send the file.

<!-- global bot, fs -->

```js
bot.on('message', async (ctx) => {
  // resend existing file by file_id
  await ctx.replyWithSticker('123123jkbhj6b')

  // send file
  await ctx.replyWithVideo(Input.fromLocalFile('/path/to/video.mp4'))

  // send stream
  await ctx.replyWithVideo(
    Input.fromReadableStream(fs.createReadStream('/path/to/video.mp4'))
  )

  // send buffer
  await ctx.replyWithVoice(Input.fromBuffer(Buffer.alloc()))

  // send url via Telegram server
  await ctx.replyWithPhoto(Input.fromURL('https://picsum.photos/200/300/'))

  // pipe url content
  await ctx.replyWithPhoto(
    Input.fromURLStream('https://picsum.photos/200/300/?random', 'kitten.jpg')
  )
})
```

### Middleware

In addition to `ctx: Context`, each middleware receives `next: () => Promise<void>`.

As in Koa and some other middleware-based libraries,
`await next()` will call next middleware and wait for it to finish:

```TS
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(async (ctx, next) => {
  console.time(`Processing update ${ctx.update.update_id}`);
  await next() // runs next middleware
  // runs after next middleware finishes
  console.timeEnd(`Processing update ${ctx.update.update_id}`);
})

bot.on(message('text'), (ctx) => ctx.reply('Hello World'));
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
```

With this simple ability, you can:

- extract information from updates and then `await next()` to avoid disrupting other middleware,
- like [`Composer`] and [`Router`], `await next()` for updates you don't wish to handle,
- like [`session`] and [`Scenes`], [extend the context](#extending-context) by mutating `ctx` before `await next()`,
- [intercept API calls](https://github.com/telegraf/telegraf/discussions/1267#discussioncomment-254525),
- reuse [other people's code](https://www.npmjs.com/search?q=telegraf-),
- do whatever **you** come up with!

[`Telegraf`]: https://telegraf.js.org/classes/Telegraf-1.html
[`Composer`]: https://telegraf.js.org/classes/Composer.html
[`Context`]: https://telegraf.js.org/classes/Context.html
[`Router`]: https://telegraf.js.org/classes/Router.html
[`session`]: https://telegraf.js.org/modules.html#session
[`Scenes`]: https://telegraf.js.org/modules/Scenes.html

### Usage with TypeScript

Telegraf is written in TypeScript and therefore ships with declaration files for the entire library.
It includes types for the complete Telegram API via `@telegraf/types`.
While most types of Telegraf's API surface are self-explanatory, there are some notable things to keep in mind.

Until `@telegraf/types` publishes the Bot API 9.6 update upstream, this v6
branch pins a temporary fork dependency. This is a release-preparation detail,
not a public API change; the dependency should be switched back to the official
package before the final upstream release.

#### Extending `Context`

The exact shape of `ctx` can vary based on the installed middleware.
Some custom middleware might register properties on the context object that Telegraf is not aware of.
Consequently, you can change the type of `ctx` to fit your needs in order for you to have proper TypeScript types for your data.
This is done through Generics:

```ts
import { Context, Telegraf } from 'telegraf'

// Define your own context type
interface MyContext extends Context {
  myProp?: string
  myOtherProp?: number
}

// Create your bot and tell it about your context type
const bot = new Telegraf<MyContext>('SECRET TOKEN')

// Register middleware and launch your bot as usual
bot.use((ctx, next) => {
  // Yay, `myProp` is now available here as `string | undefined`!
  ctx.myProp = ctx.chat?.first_name?.toUpperCase()
  return next()
})
// ...
```
