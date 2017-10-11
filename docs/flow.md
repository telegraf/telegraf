# Control flow

Simple scene-based control flow with Telegraf.

## Example
  
```js
const Telegraf = require('telegraf')
const { Scene } = Telegraf.Flow

// Greeter scene
const greeterScene = new Scene('greeter')
greeterScene.enter((ctx) => ctx.reply('Hi'))
greeterScene.leave((ctx) => ctx.reply('Buy'))
greeterScene.hears(/hi/gi, leave())
greeterScene.on('message', (ctx) => ctx.reply('Send `hi`'))

// Scene registration
const flow = new Telegraf.Flow()
flow.register(greeterScene)

const app = new Telegraf(process.env.BOT_TOKEN)
// Flow requires valid Telegraf session
app.use(Telegraf.memorySession())
app.use(flow.middleware())
app.command('greeter', (ctx) => ctx.flow.enter('greeter'))
app.startPolling()
```

### Telegraf context

Telegraf user context props and functions:

```js
app.on('...', (ctx) => {
  ctx.flow.state                                    // Current scene state (persistent)
  
  ctx.flow.enter(sceneId, [defaultState, silent])   // Enter scene
  ctx.flow.reenter()                                // Reenter current scene
  ctx.flow.leave()                                  // Leave scene 
});
```
