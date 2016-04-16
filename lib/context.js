var ware = require('co-ware')

module.exports = function (msg) {
  var context = {}
  var state = {}
  context.__defineGetter__('msg', function () {
    return msg
  })
  context.__defineGetter__('state', function () {
    return state
  })
  context.__defineSetter__('state', function (val) {
    state = Object.assign({}, val)
  })

  var ctx = ware()
  ctx.context = context
  return ctx
}
