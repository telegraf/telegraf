# Router

Router is used to direct the flow of update. It accepts as arguments a routing function and, optionally, a Map with predefined routes and handlers. Routing function accepts [context](getting-started.md#context) and return object with route property set to String value. Handler for a specific route is just another middleware.

Basic usage:

```js
const Router = require('telegraf/router')

// can be any function that returns { route: String }
function routeFn(ctx) {
  return { route: ctx.updateType }
}

const router = new Router(routeFn)

// registering 'callback_query' route
const middlewareCb = function (ctx, next) { ... }
router.on('callback_query', middlewareCb)

// registering 'message' route
const middlewareMessage = new Composer(...)
router.on('message', middlewareMessage)

// setting handler for routes that are not registered
const middlewareDefault = someOtherRouter
router.otherwise(middlewareDefault)
```

As `Router` object is itself a middleware, routers can be nested, e.g., `router1.on('yo', router2)`. Thus, they allow for very deep, well-structured and flexible logic of updates processing. Possible usecases include multilevel menus, setting different levels of access for bot users and much much more.
