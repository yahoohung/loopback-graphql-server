var assert = require('assert')

var assign = require('object-assign')
var esc = require('escape-string-regexp')

var fileRE = new RegExp('.*' + esc(__filename))
var createErrWithProps = function (message, props) {
  var err = new Error(message)
  if (props) {
    assign(err, props)
  }
  return err
}

module.exports = assertErr

function assertErr (value, Err/*, ...args */) {
  assert(typeof Err === 'function', '"Error" must be a function')
  if (Err === Error) Err = createErrWithProps
  var args = Array.prototype.slice.call(arguments, 2)
  assert(args.length <= 5, 'assertErr does not support more than five Error args')
  if (!value) {
    var err = createInstance(Err, args)
    // remove `assertErr` and `createInstance` from stack
    if (err.stack) {
      var stackLines = err.stack
        .split('\n')
        .filter(notMatches(fileRE))
      err.stack = stackLines.join('\n')
    }
    // throw the error
    throw err
  }
}

function createInstance (Class, args) {
  return (args.length === 0)
    ? new Class()
    : (args.length === 1)
      ? new Class(args[0])
      : (args.length === 2)
        ? new Class(args[0], args[1])
        : (args.length === 3)
          ? new Class(args[0], args[1], args[2])
          : (args.length === 4)
            ? new Class(args[0], args[1], args[2], args[3])
            : new Class(args[0], args[1], args[2], args[3], args[4])
}

function notMatches (re) {
  return function (str) {
    return !re.test(str)
  }
}
