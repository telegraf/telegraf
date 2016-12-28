# Telegraf

Telegraf API reference

```js
const Telegraf = require('telegraf')
```

### Constructor

Initialize new Telegraf app.

`new Telegraf(token, options)`

| Param | Type | Description |
| --- | --- | --- |
| token | `string` | [Bot Token](https://core.telegram.org/bots#3-how-do-i-create-a-bot) |
| options | `object` | Telegraf options |

Telegraf options:

```js
{
  telegram: {           // Telegram options
    agent: null,        // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
    webhookReply: true  // Reply via webhook
  },
  username: ''          // Bot username (optional)  
}
```

### use

Registers a middleware.

`telegraf.use(middleware)`

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware function |

### on

Registers middleware for provided update type.

`telegraf.on(updateTypes, middleware, [middleware...])`

| Param | Type | Description |
| --- | --- | --- |
| updateTypes | `string`\|`string[]` | Update type |
| middleware | `function` | Middleware |

### hears

Registers middleware for handling `text` messages.

`telegraf.hears(triggers, middleware, [middleware...])`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string[]`\|`RegEx[]|Function` | Triggers |
| middleware | `function` | Middleware |

### command

Command handling.

`telegraf.command(commands, middleware, [middleware...])`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string[]` | Commands |
| middleware | `function` | Middleware |

### action

Registers middleware for handling `callback_data` actions with regular expressions.

`telegraf.action(triggers, middleware, [middleware...])`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string[]`\|`RegEx[]` | Triggers |
| middleware | `function` | Middleware |


### gameQuery

Registers middleware for handling `callback_data` actions with game query.

`telegraf.gameQuery(middleware, [middleware...])`

| Param | Type | Description |
| --- | --- | --- |
| middleware | `function` | Middleware |

### startPolling

Start poll updates.

`telegraf.startPolling(timeout, limit, allowedUpdates)`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| timeout | `number` | 30 | Poll timeout in seconds |
| limit | `number` | 100 | Limits the number of updates to be retrieved |
| allowedUpdates | `string[]` | null | List the types of updates you want your bot to receive |

### startWebhook

Start listening @ `https://host:port/webhookPath` for Telegram calls.

`telegraf.startWebhook(webhookPath, tlsOptions, port, [host])`

| Param | Type | Description |
| ---  | --- | --- |
| webhookPath | `string` | Webhook url path (see Telegraf.setWebhook) |
| tlsOptions | `object` | (Optional) [TLS server options](https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener). Pass null to use http |
| port | `number` | Port number |
| [host] | `string` | (Optional) Hostname |

### stop

Stop Webhook and polling

`telegraf.stop()`

### webhookCallback

Return a callback function suitable for the http[s].createServer() method to handle a request. 
You may also use this callback function to mount your telegraf app in a Koa/Connect/Express app.

`telegraf.webhookCallback(webhookPath) => Function`

| Param | Type | Description |
| ---  | --- | --- |
| webhookPath | `string` | Webhook url path (see Telegraf.setWebhook) |

### handleUpdate

Handle raw Telegram update. 
In case you use centralized webhook server, queue, etc.  

`telegraf.handleUpdate(rawUpdate, [webhookResponse])`

| Param | Type | Description |
| --- | --- | --- |
| rawUpdate | `object` | Telegram update payload |
| [webhookResponse] | `object` | (Optional) [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) |

### Telegraf.compose

Compose `middlewares` returning a fully valid middleware comprised of all those which are passed.

`Telegraf.compose(middlewares) => function`

| Param | Type | Description |
| --- | --- | --- |
| middlewares | `function[]` | Array of middlewares |

### Telegraf.mount

Generates middleware for handling provided update types.

`Telegraf.mount(updateTypes, middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| updateTypes | `string`\|`string[]` | Update type |
| middleware | `function` | middleware |

### Telegraf.hears

Generates middleware for handling `text` messages with regular expressions.

`Telegraf.hears(triggers, middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string[]`\|`RegEx[]`\|`Function[]` | Triggers |
| handler | `function` | Handler |

### Telegraf.action

Generates middleware for handling `callbackQuery` data with regular expressions.

`Telegraf.action(triggers, middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| triggers | `string[]`\|`RegEx[]`\|`Function[]` | Triggers |
| handler | `function` | Handler |

### Telegraf.passThru

Generates pass thru middleware.

`Telegraf.passThru() => function`

### Telegraf.optional

Generates optional middleware.

`Telegraf.optional(test, middleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| test | `truthy`\|`function` | Value or predicate `(ctx) => bool` |
| middleware | `function` | middleware |

### Telegraf.branch

Generates branch middleware.

`Telegraf.branch(test, trueMiddleware, falseMiddleware) => function`

| Param | Type | Description |
| --- | --- | --- |
| test | `truthy`\|`function` | Value or predicate `(ctx) => bool` |
| trueMiddleware | `function` | true action  middleware |
| falseMiddleware | `function` | false action middleware |

### Working with files

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

