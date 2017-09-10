var describe = global.describe
var it = global.it

var expect = require('chai').expect
var times = require('times-loop')

var assertErr = require('../')

function CustomError () {
  this.args = Array.prototype.slice.call(arguments)
  Error.call(this, this.args[0])
  Error.captureStackTrace(this, CustomError)
}
CustomError.prototype = new Error()

function CustomErrorNoStack () {
  this.args = Array.prototype.slice.call(arguments)
  Error.call(this, this.args[0])
}

// tests
describe('assert-err', function () {
  it('should not throw if assertion is true', function () {
    assertErr(true, TypeError, 'boom')
  })

  it('should throw if assertion is false (err w/ no stack)', function (done) {
    try {
      assertErr(false, CustomErrorNoStack, 'boom')
      done(new Error('expected an error'))
    } catch (err) {
      expect(err).to.be.an.instanceOf(CustomErrorNoStack)
      expect(err.args).to.deep.equal(['boom'])
      expect(err.stack).to.not.exist
      done()
    }
  })

  it('should work with global Error', function (done) {
    try {
      assertErr(false, Error, 'boom')
      done(new Error('expected an error'))
    } catch (err) {
      expect(err).to.be.an.instanceOf(Error)
      expect(err.message).to.deep.equal('boom')
      expect(err.stack.split('\n')[1]).to.match(/assert-err.test.js:/)
      done()
    }
  })

  it('should assign props if using global Error', function (done) {
    try {
      var props = { data: { foo: 'hey' } }
      assertErr(false, Error, 'boom', props)
      done(new Error('expected an error'))
    } catch (err) {
      expect(err).to.be.an.instanceOf(Error)
      expect(err.message).to.deep.equal('boom')
      expect(err.data).to.deep.equal(props.data)
      expect(err.stack.split('\n')[1]).to.match(/assert-err.test.js:/)
      done()
    }
  })

  times(6, function (i) {
    // generated tests
    it('should throw if assertion is false (' + i + ' args)', function (done) {
      var errArgs = times(i, function (i) { return i })
      var args = [false, CustomError].concat(errArgs)
      try {
        assertErr.apply(null, args)
        done(new Error('expected an error'))
      } catch (err) {
        expect(err).to.be.an.instanceOf(CustomError)
        expect(err.args).to.deep.equal(errArgs)
        // stack should start at assertErr line
        expect(err.stack.split('\n')[1]).to.match(/assert-err.test.js:/)
        done()
      }
    })
  })

  describe('errors', function () {
    it('should error if "Err" is not a function', function () {
      expect(function () {
        assertErr(false, 'blah')
      }).to.throw(/"Error" must be a function/)
    })

    it('should error if "args.length" > 5', function () {
      expect(function () {
        assertErr(false, TypeError, 1, 2, 3, 4, 5, 6)
      }).to.throw(/assertErr does not support more than five Error args/)
    })
  })
})
