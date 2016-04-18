# Telegraf
[![Build Status](https://img.shields.io/travis/telegraf/telegraf.svg?branch=master&style=flat-square)](https://travis-ci.org/telegraf/telegraf)
[![NPM Version](https://img.shields.io/npm/v/telegraf.svg?style=flat-square)](https://www.npmjs.com/package/telegraf)

## Installation

```js
$ npm install telegraf
```

## Example
  
```js
var telegraf = require('telegraf');

var app = telegraf(process.env.BOT_TOKEN);

app.use(function * (){
  this.session.counter = this.session.counter || 0
  this.session.counter++
  console.log('->', this.session)
})

app.startPolling();
```

## API

### Options

* `store`: [Redis connection options](http://redis.js.org/#api-rediscreateclient)
  * `host`: Redis host (default: *127.0.0.1*)
  * `port`: Redis port (default: *6379*)
  * `path`: Unix socket string
  * `url`:  Redis url

* `getSessionKey`: session key function (msg -> string)

Default session key depends on sender id and chat id:
```
function getSessionKey(msg) {
  if (!msg.chat && !msg.from) {
    return
  }
  return `${msg.chat.id}:${msg.from.username}`
}
```

### Destroying a session

To destroy a session simply set it to `null`:

```js
this.session = null;
```

## License

MIT
