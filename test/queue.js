const test = require('ava')
const { DecayingDeque } = require('../lib/core/processing/queue')

test.cb('should process a single update', (t) => {
  let res = ''
  const q = new DecayingDeque(1000, v => Promise.resolve(res += v), false, () => t.fail(), () => t.fail())
  q.add(['a']).then(() => t.end(res !== 'a'))
})

test.cb('should process two updates in order', (t) => {
  let res = ''
  const q = new DecayingDeque(1000, v => Promise.resolve(res += v), false, () => t.fail(), () => t.fail())
  q.add(['a', 'b']).then(() => t.end(res !== 'ab'))
})

test.cb('should process updates from different calls', (t) => {
  let res = ''
  const q = new DecayingDeque(1000, v => Promise.resolve(res += v), false, () => t.fail(), () => t.fail())
  q.add(['a']).then(() => q.add(['b'])).then(() => t.end(res !== 'ab'))
})

test.cb('should process delayed updates from different calls', (t) => {
  let res = ''
  const q = new DecayingDeque(1000, v => Promise.resolve(res += v), false, () => t.fail(), () => t.fail())
  q.add(['a']).then(() => setTimeout(() => q.add(['b']).then(() => t.end(res !== 'ab')), 10))
})

test.cb('should catch errors', (t) => {
  const q = new DecayingDeque(1000, v => Promise.reject(v), false, (err, elem) => t.end(err !== 'a' || elem !== 'a'), () => t.fail())
  q.add(['a'])
})

test.cb('should catch multiple errors', (t) => {
  let res = ''
  const q = new DecayingDeque(1000, v => Promise.reject(v), false, (err, elem) => {
    if ((err !== 'a' && err !== 'b') || (elem !== 'a' && elem !== 'b')) t.fail()
    res += err
    if (res === 'ab') t.end()
  }, () => t.fail())
  q.add(['a', 'b'])
})

test.cb('should catch timeouts', (t) => {
  const promise = new Promise(() => { })
  const q = new DecayingDeque(10, () => promise, false, () => t.fail(), e => t.end(e !== 'a'))
  q.add(['a'])
})

test.cb('should catch multiple timeouts', (t) => {
  const promise = new Promise(() => { })
  let res = ''
  const q = new DecayingDeque(10, () => promise, false, () => t.fail(), e => {
    if (e !== 'a' && e !== 'b') t.fail()
    res += e
    if (res === 'ab') t.end()
  })
  q.add(['a', 'b'])
})

function patternTest (t, pattern, expected = pattern) {
  // `res` collects the results of promises that resolve, reject, or time out,
  // and these events have to happen in the correct order,
  // otherwise `res` will be built up the wrong way from the given update pattern
  let res = ''
  const q = new DecayingDeque(20, c => {
    if (c.match(/[a-z]/)) { // value
      return new Promise((resolve) =>
        setImmediate(() => {
          res += c
          resolve(c)
        }))
    } else if (c.match(/[0-9]/)) { // error
      return new Promise((resolve, reject) =>
        setImmediate(() => {
          reject(c)
        }))
    } else { // timeout
      return new Promise(() => { })
    }
  }, false, v => (res += v), v => (res += v))
  q.add([...pattern]).then(() => t.end(res !== expected))
}

test.cb('should handle simple update patterns', (t) => patternTest(t, 'a'))
test.cb('should handle long value update patterns', (t) => patternTest(t, 'xxxxxxxxxx'))
test.cb('should handle long error update patterns', (t) => patternTest(t, '9999999999'))
test.cb('should handle long timeout update patterns', (t) => patternTest(t, '..........'))
test.cb('should handle combined update patterns', (t) => patternTest(t, 'x9.'))
test.cb('should handle mixed update patterns', (t) => patternTest(t, 'a9.b,', 'a9b.,'))
test.cb('should handle complex update patterns', (t) => patternTest(t,
  'jadf.)(r45%4hj2h()$..x)=1kj5kfgg}]3567',
  'jadfr454hj2hx1kj5kfgg3567.)(%()$..)=}]'))

test.cb('should return the correct capacity value for a single element', (t) => {
  const q = new DecayingDeque(1000, () => Promise.resolve(), 12, () => t.fail(), () => t.fail())
  q.add(['a']).then(c => t.end(c !== 11))
})

test.cb('should return the correct capacity value for multiple elements', (t) => {
  const q = new DecayingDeque(1000, () => Promise.resolve(), 12, () => t.fail(), () => t.fail())
  q.add([...'abcd']).then(c => t.end(c !== 8))
})

test.cb('should complete the add call as soon as there is capacity again', (t) => {
  const q = new DecayingDeque(1000, () => Promise.resolve(), 3, () => t.fail(), () => t.fail())
  q.add([...'abcdef']).then(c => t.end(c !== 1))
})

test.cb('should decelerate add calls', (t) => {
  const updates = new Array(1000).fill('x')
  const q = new DecayingDeque(20,
    () => new Promise((resolve) => setTimeout(() => resolve())),
    1000,
    () => t.fail(),
    () => t.fail()
  )
  updates.reduce((p, v) => p.then(() => q.add([v]).then(c => {
    // we add a new element as soon as the previous `add` call resolves, and
    // we expect that this only happens as soon as there is capacity,
    // so we check that the capacity never falls below 1
    if (c < 1) t.fail()
  })), Promise.resolve()).then(() => t.end())
})

test.cb('should resolve tasks after timing out', (t) => {
  let r
  const q = new DecayingDeque(10, () => new Promise((resolve) => (r = resolve)), false, () => t.fail(), (i, p) => {
    p.then(o => t.end(i !== o))
    r(i)
  })
  q.add(['a'])
})

test.cb('should rethrow errors for tasks that already timed out', (t) => {
  let r
  const q = new DecayingDeque(10, () => new Promise((resolve, reject) => (r = reject)), false, () => t.fail(), (i, p) => {
    p.catch(o => t.end(i !== o))
    r(i)
  })
  q.add(['a'])
})

test.cb('should handle concurrent add calls', (t) => {
  const r = []
  const q = new DecayingDeque(1000, () => new Promise((resolve) => r.push(resolve)), 3, () => t.fail(), () => t.fail())
  let count = 0
  q.add([...'aaaaa']).then(() => ++count)
  q.add([...'bbbbb']).then(() => ++count)
  q.add([...'ccccc']).then(() => ++count)
  q.add([...'ddddd']).then(() => ++count)
  q.add([...'eeeee']).then(() => t.end(++count !== 5))
  r.forEach(f => f())
})

test.cb('should purge many nodes after the same timeout', (t) => {
  let count = 0
  const updates = '0123456789'.repeat(10)
  const q = new DecayingDeque(5, () => new Promise(() => { }), false, () => t.fail(), () => count++)
  q.add([...updates])
  setTimeout(() => t.end(count !== updates.length || q.length !== 0), 20)
})
