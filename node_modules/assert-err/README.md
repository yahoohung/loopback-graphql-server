# assert-err
assertion library that throws user-specified error types (accepts error class and message)

# Installation
```bash
npm i --save assert-err
```

# Usage
#### Example 1: full example
```js
// example-1.js
var assertErr = require('assert-err')

function add (a, b) {
  assertErr(typeof a === 'number', TypeError, '"a" must be a number')
  assertErr(typeof b === 'number', TypeError, '"b" must be a number') //  line 6
  return a + b
}

add(1, 'no') // line 10
/*
TypeError: "b" must be a number
    at add (example-1.js:6:3)
    at Object.<anonymous> (example-1.js:10:1)
    at Module._compile (module.js:413:34)
    at Object.Module._extensions..js (module.js:422:10)
    at Module.load (module.js:357:32)
    at Function.Module._load (module.js:314:12)
    at Function.Module.runMain (module.js:447:10)
    at startup (node.js:139:18)
    at node.js:999:3
*/
```
#### Example 2: Error props
If using global.Error, assertErr accepts a `props` argument to extend `error`
```js
assertErr(false, Error, 'message', { code: 1, status: 'status' }) // 0 args
// { [Error: boom] code: 1, status: 'status' }
```
#### Example 3: args
assertErr supports up to 5 err constructor args
```js
assertErr(false, CustomError) // 0 args
assertErr(false, CustomError, 'foo') // 1 args
assertErr(false, CustomError, 'foo', 'bar') // 2 args
assertErr(false, CustomError, 'foo', 'bar', 'qux') // 3 args
assertErr(false, CustomError, 'foo', 'bar', 'qux', 'corge') // 4 args
assertErr(false, CustomError, 'foo', 'bar', 'qux', 'corge', 'yolo') // 5 args
// error...
assertErr(false, CustomError, 'foo', 'bar', 'qux', 'corge', 'yolo', 'toomany') // 6 args
// Error: assertErr does not support more than five Error args
```

# License
MIT
