# Telegraf

Telegraf API reference

```js
const { Telegraf } = require('telegraf')
```

## Constructor

Initialize new Telegraf bot.

`const telegraf = new Telegraf(token, [options])`

| Param | Type | Description |
| --- | --- | --- |
| token | `string` | [Bot Token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) |
| [options] | `object` | Telegraf options |

Telegraf options:

```js
{
  telegram: {           // Telegram options
    agent: null,        // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
    webhookReply: true  // Reply via webhook
  },
  username: ''          // Bot username (optional)
  channelMode: false    // Handle `channel_post` updates as messages (optional)
}
```

## token

Use this property to get/set bot token.

`telegraf.token = [string]`

## webhookReply

Use this property to control `reply via webhook` feature.

`telegraf.webhookReply = [bool]`

## use

Registers a middleware.

`telegraf.use(...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware function |

## on

Registers middleware for provided update type.

`telegraf.on(updateTypes, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| updateTypes | `string/string[]` | Update type |
| middleware | `function` | Middleware |

## hears

Registers middleware for handling `text` messages.

`telegraf.hears(triggers, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function` | Triggers |
| middleware | `function` | Middleware |

## command

Command handling.

`telegraf.command(commands, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| commands | `string/string[]` | Commands |
| middleware | `function` | Middleware |

## start

Handler for /start command.

`telegraf.start(...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware |

## help

Handler for /help command.

`telegraf.help(...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware |

## settings

Handler for /settings command.

`telegraf.settings(...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware |

## entity

Entity handling.

`telegraf.entity(entity, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| entity | `string/string[]/RegEx/RegEx[]/Function` | Entity name |
| middleware | `function` | Middleware |

## mention

Mention handling.

`telegraf.mention(username, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| username | `string/string[]` | Username |
| middleware | `function` | Middleware |

## phone

Phone number handling.

`telegraf.phone(number, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| number | `string/string[]` | Phone number |
| middleware | `function` | Middleware |

## hashtag

Hashtag handling.

`telegraf.hashtag(hashtag, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| hashtag | `string/string[]` | Hashtag |
| middleware | `function` | Middleware |

## cashtag

Cashtag handling.

`telegraf.cashtag(cashtag, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| cashtag | `string/string[]` | Cashtag |
| middleware | `function` | Middleware |

## action

Registers middleware for handling `callback_data` actions with regular expressions.

`telegraf.action(triggers, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]` | Triggers |
| middleware | `function` | Middleware |

## inlineQuery

Registers middleware for handling `inline_query` actions with regular expressions.

`telegraf.inlineQuery(triggers, ...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]` | Triggers |
| middleware | `function` | Middleware |

## gameQuery

Registers middleware for handling `callback_data` actions with game query.

`telegraf.gameQuery(...middleware)`

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware |

## launch

Launch bot in long-polling or webhook mode.

`telegraf.launch(options) => Promise`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `object` | Launch options |

Launch options:

```js
{
  // Start bot in polling mode (Default)
  // See startPolling reference
  polling: { timeout, limit,  allowedUpdates,  stopCallback },

  // Start bot in webhook mode
  // See startWebhook reference
  webhook: { domain, hookPath,  port,  host,  tlsOptions,  cb } 
}
```

## startPolling

Start poll updates.

`telegraf.startPolling([timeout], [limit], [allowedUpdates], [stopCallback])`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [timeout] | `number` | 30 | Poll timeout in seconds |
| [limit] | `number` | 100 | Limits the number of updates to be retrieved |
| [allowedUpdates] | `string[]/string/null` | null | List the types of updates you want your bot to receive |
| [stopCallback] | `function` | null | Polling stop callback |

## startWebhook

Start listening @ `https://host:port/webhookPath` for Telegram calls.

`telegraf.startWebhook(hookPath, [tlsOptions], port, [host])`

| Param | Type | Description |
| ---  | --- | --- |
| hookPath | `string` | Webhook url path (see Telegraf.setWebhook) |
| [tlsOptions] | `object` | [TLS server options](https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener). Pass null to use http |
| port | `number` | Port number |
| [host] | `string` | Hostname |

## stop

Stop Webhook and polling

`telegraf.stop([callback]) => Promise`

| Param | Type |
| ---  | --- |
| [callback] | function |

## webhookCallback

Return a callback function suitable for the http[s].createServer() method to handle a request. You may also use this callback function to mount your telegraf app in a Connect/Express app.

`telegraf.webhookCallback(webhookPath) => Function`

| Param | Type | Description |
| ---  | --- | --- |
| webhookPath | `string` | Webhook url path (see Telegraf.setWebhook) |

## handleUpdate

Handle raw Telegram update. In case you use centralized webhook server, queue, etc.  

`telegraf.handleUpdate(rawUpdate, [webhookResponse])`

| Param | Type | Description |
| --- | --- | --- |
| rawUpdate | `object` | Telegram update payload |
| [webhookResponse] | `object` | [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) |

## compose

Compose `middlewares` returning a fully valid middleware comprised of all those which are passed.

`Telegraf.compose(middlewares) => function`

| Param | Type | Description |
| --- | --- | --- |
| middlewares | `function[]` | Array of middlewares |

## mount

Generates a middleware for handling provided update types.

`Telegraf.mount(updateTypes, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| updateTypes | `string/string[]` | Update type |
| middleware | `function` | middleware |

## hears

Generates a middleware for handling `text` messages with regular expressions.

`Telegraf.hears(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

## action

Generates a middleware for handling `callbackQuery` data with regular expressions.

`Telegraf.action(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

## inlineQuery

Generates a middleware for handling `inlineQuery` data with regular expressions.

`Telegraf.inlineQuery(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

## passThru

Generates pass thru middleware.

`Telegraf.passThru() => function`

## safePassThru

Generates a safe version of pass thru middleware.

`Telegraf.safePassThru() => function`

## optional

Generates an optional middleware.

`Telegraf.optional(test, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| test | `truthy/function` | Value or predicate `(ctx) => bool` |
| middleware | `function` | middleware |

## acl

Generates a middleware for provided users only.

`Telegraf.acl(userId, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| userId | `string/string[]` | User id |
| middleware | `function` | middleware |

## drop

Generates drop middleware.

`Telegraf.drop(test) => function`

| Param | Type | Description |
| --- | --- | --- |
| test | `truthy/function` | Value or predicate `(ctx) => bool` |

## filter

Generates filter middleware.

`Telegraf.filter(test) => function`

| Param | Type | Description |
| --- | --- | --- |
| test | `truthy/function` | Value or predicate `(ctx) => bool` |

## branch

Generates branch middleware.

`Telegraf.branch(test, trueMiddleware, falseMiddleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| test | `truthy/function` | Value or predicate `(ctx) => bool` |
| trueMiddleware | `function` | true action  middleware |
| falseMiddleware | `function` | false action middleware |

## email

Generates a middleware for handling messages with `email` entity.

`Telegraf.email(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

## hashtag

Generates a middleware for handling messages with `hashtag` entity.

`Telegraf.hashtag(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

## cashtag

Generates a middleware for handling messages with `cashtag` entity.

`Telegraf.cashtag(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

## url

Generates a middleware for handling messages with `url` entity.

`Telegraf.url(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

## phone

Generates a middleware for handling messages with `phone` entity.

`Telegraf.phone(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

## textLink

Generates a middleware for handling messages with `text_link` entity.

`Telegraf.textLink(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |

## textMention

Generates a middleware for handling messages with `text_mention` entity.

`Telegraf.textMention(triggers, ...middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string/string[]/RegEx/RegEx[]/Function/Function[]` | Triggers |
| handler | `function` | Handler |
