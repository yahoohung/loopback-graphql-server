"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sinon = require("sinon");
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var sinonChai = require("sinon-chai");
var pubsub_1 = require("../pubsub");
var iterall_1 = require("iterall");
chai.use(chaiAsPromised);
chai.use(sinonChai);
var expect = chai.expect;
var assert = chai.assert;
var graphql_1 = require("graphql");
var subscriptions_manager_1 = require("../subscriptions-manager");
var validation_1 = require("../validation");
describe('PubSub', function () {
    it('can subscribe and is called when events happen', function (done) {
        var ps = new pubsub_1.PubSub();
        ps.subscribe('a', function (payload) {
            expect(payload).to.equals('test');
            done();
        }).then(function () {
            var succeed = ps.publish('a', 'test');
            expect(succeed).to.be.true;
        });
    });
    it('can unsubscribe', function (done) {
        var ps = new pubsub_1.PubSub();
        ps.subscribe('a', function (payload) {
            assert(false);
        }).then(function (subId) {
            ps.unsubscribe(subId);
            var succeed = ps.publish('a', 'test');
            expect(succeed).to.be.true;
            done();
        });
    });
});
describe('AsyncIterator', function () {
    it('should expose valid asyncItrator for a specific event', function () {
        var evnetName = 'test';
        var ps = new pubsub_1.PubSub();
        var iterator = ps.asyncIterator(evnetName);
        expect(iterator).to.be.defined;
        expect(iterall_1.isAsyncIterable(iterator)).to.be.true;
    });
    it('should trigger event on asyncIterator when published', function (done) {
        var evnetName = 'test';
        var ps = new pubsub_1.PubSub();
        var iterator = ps.asyncIterator(evnetName);
        iterator.next().then(function (result) {
            expect(result).to.be.defined;
            expect(result.value).to.be.defined;
            expect(result.done).to.be.defined;
            done();
        });
        ps.publish(evnetName, { test: true });
    });
    it('should not trigger event on asyncIterator when publishing other event', function () {
        var evnetName = 'test2';
        var ps = new pubsub_1.PubSub();
        var iterator = ps.asyncIterator('test');
        var spy = sinon.spy();
        iterator.next().then(spy);
        ps.publish(evnetName, { test: true });
        expect(spy).not.to.have.been.called;
    });
    it('register to multiple events', function (done) {
        var evnetName = 'test2';
        var ps = new pubsub_1.PubSub();
        var iterator = ps.asyncIterator(['test', 'test2']);
        var spy = sinon.spy();
        iterator.next().then(function () {
            spy();
            expect(spy).to.have.been.called;
            done();
        });
        ps.publish(evnetName, { test: true });
    });
    it('should not trigger event on asyncIterator already returned', function (done) {
        var evnetName = 'test';
        var ps = new pubsub_1.PubSub();
        var iterator = ps.asyncIterator(evnetName);
        iterator.next().then(function (result) {
            expect(result).to.be.defined;
            expect(result.value).to.be.defined;
            expect(result.done).to.be.false;
        });
        ps.publish(evnetName, { test: true });
        iterator.next().then(function (result) {
            expect(result).to.be.defined;
            expect(result.value).not.to.be.defined;
            expect(result.done).to.be.true;
            done();
        });
        iterator.return();
        ps.publish(evnetName, { test: true });
    });
});
var schema = new graphql_1.GraphQLSchema({
    query: new graphql_1.GraphQLObjectType({
        name: 'Query',
        fields: {
            testString: {
                type: graphql_1.GraphQLString,
                resolve: function (_, args) {
                    return 'works';
                },
            },
        },
    }),
    subscription: new graphql_1.GraphQLObjectType({
        name: 'Subscription',
        fields: {
            testSubscription: {
                type: graphql_1.GraphQLString,
                resolve: function (root) {
                    return root;
                },
            },
            testContext: {
                type: graphql_1.GraphQLString,
                resolve: function (rootValue, args, context) {
                    return context;
                },
            },
            testFilter: {
                type: graphql_1.GraphQLString,
                resolve: function (root, _a) {
                    var filterBoolean = _a.filterBoolean;
                    return filterBoolean ? 'goodFilter' : 'badFilter';
                },
                args: {
                    filterBoolean: { type: graphql_1.GraphQLBoolean },
                },
            },
            testFilterMulti: {
                type: graphql_1.GraphQLString,
                resolve: function (root, _a) {
                    var filterBoolean = _a.filterBoolean;
                    return filterBoolean ? 'goodFilter' : 'badFilter';
                },
                args: {
                    filterBoolean: { type: graphql_1.GraphQLBoolean },
                    a: { type: graphql_1.GraphQLString },
                    b: { type: graphql_1.GraphQLInt },
                },
            },
            testChannelOptions: {
                type: graphql_1.GraphQLString,
                resolve: function (root) {
                    return root;
                },
            },
            testArguments: {
                type: graphql_1.GraphQLString,
                resolve: function (root, _a) {
                    var testArgument = _a.testArgument;
                    return String(testArgument);
                },
                args: {
                    testArgument: {
                        type: graphql_1.GraphQLInt,
                        defaultValue: 1234,
                    },
                },
            },
        },
    }),
});
describe('SubscriptionManager', function () {
    var capturedArguments;
    var pubsub = new pubsub_1.PubSub();
    var subManager = new subscriptions_manager_1.SubscriptionManager({
        schema: schema,
        setupFunctions: {
            'testFilter': function (options, _a) {
                var filterBoolean = _a.filterBoolean;
                return {
                    'Filter1': {
                        filter: function (root) { return root.filterBoolean === filterBoolean; },
                    },
                    Filter2: {
                        filter: function (root) {
                            return new Promise(function (resolve) {
                                setTimeout(function () { return resolve(root.filterBoolean === filterBoolean); }, 10);
                            });
                        },
                    },
                };
            },
            'testFilterMulti': function (options) {
                return {
                    'Trigger1': {
                        filter: function () { return true; },
                    },
                    'Trigger2': {
                        filter: function () { return true; },
                    },
                };
            },
            'testChannelOptions': function () {
                return {
                    'Trigger1': {
                        channelOptions: {
                            foo: 'bar',
                        },
                    },
                };
            },
            testContext: function (options) {
                return {
                    contextTrigger: function (rootValue, context) {
                        return context === 'trigger';
                    },
                };
            },
            testArguments: function (opts, args) {
                capturedArguments = args;
                return {
                    Trigger1: {},
                };
            },
        },
        pubsub: pubsub,
    });
    beforeEach(function () {
        capturedArguments = undefined;
        sinon.spy(pubsub, 'subscribe');
    });
    afterEach(function () {
        sinon.restore(pubsub.subscribe);
    });
    it('throws an error if query is not valid', function () {
        var query = 'query a{ testInt }';
        var callback = function () { return null; };
        return expect(subManager.subscribe({ query: query, operationName: 'a', callback: callback }))
            .to.eventually.be.rejectedWith('Subscription query has validation errors');
    });
    it('rejects subscriptions with more than one root field', function () {
        var query = 'subscription X{ a: testSubscription, b: testSubscription }';
        var callback = function () { return null; };
        return expect(subManager.subscribe({ query: query, operationName: 'X', callback: callback }))
            .to.eventually.be.rejectedWith('Subscription query has validation errors');
    });
    it('can subscribe with a valid query and gets a subId back', function () {
        var query = 'subscription X{ testSubscription }';
        var callback = function () { return null; };
        subManager.subscribe({ query: query, operationName: 'X', callback: callback }).then(function (subId) {
            expect(subId).to.be.a('number');
            subManager.unsubscribe(subId);
        });
    });
    it('can subscribe with a nameless query and gets a subId back', function () {
        var query = 'subscription { testSubscription }';
        var callback = function () { return null; };
        subManager.subscribe({ query: query, operationName: 'X', callback: callback }).then(function (subId) {
            expect(subId).to.be.a('number');
            subManager.unsubscribe(subId);
        });
    });
    it('can subscribe with a valid query and get the root value', function (done) {
        var query = 'subscription X{ testSubscription }';
        var callback = function (err, payload) {
            try {
                expect(payload.data.testSubscription).to.equals('good');
            }
            catch (e) {
                done(e);
                return;
            }
            done();
        };
        subManager.subscribe({ query: query, operationName: 'X', callback: callback }).then(function (subId) {
            subManager.publish('testSubscription', 'good');
            subManager.unsubscribe(subId);
        });
    });
    it('can use filter functions properly', function (done) {
        var query = "subscription Filter1($filterBoolean: Boolean){\n       testFilter(filterBoolean: $filterBoolean)\n      }";
        var callback = function (err, payload) {
            if (err) {
                done(err);
                return;
            }
            try {
                expect(payload.data.testFilter).to.equals('goodFilter');
            }
            catch (e) {
                done(e);
                return;
            }
            done();
        };
        subManager.subscribe({
            query: query,
            operationName: 'Filter1',
            variables: { filterBoolean: true },
            callback: callback,
        }).then(function (subId) {
            subManager.publish('Filter1', { filterBoolean: false });
            subManager.publish('Filter1', { filterBoolean: true });
            subManager.unsubscribe(subId);
        });
    });
    it('can use a filter function that returns a promise', function (done) {
        var query = "subscription Filter2($filterBoolean: Boolean){\n       testFilter(filterBoolean: $filterBoolean)\n      }";
        var callback = function (err, payload) {
            if (err) {
                done(err);
                return;
            }
            try {
                expect(payload.data.testFilter).to.equals('goodFilter');
            }
            catch (e) {
                done(e);
                return;
            }
            done();
        };
        subManager.subscribe({
            query: query,
            operationName: 'Filter2',
            variables: { filterBoolean: true },
            callback: callback,
        }).then(function (subId) {
            subManager.publish('Filter2', { filterBoolean: false });
            subManager.publish('Filter2', { filterBoolean: true });
            subManager.unsubscribe(subId);
        });
    });
    it('can subscribe to more than one trigger', function (done) {
        var triggerCount = 0;
        var query = "subscription multiTrigger($filterBoolean: Boolean, $uga: String){\n       testFilterMulti(filterBoolean: $filterBoolean, a: $uga, b: 66)\n      }";
        var callback = function (err, payload) {
            try {
                expect(payload.data.testFilterMulti).to.equals('goodFilter');
                triggerCount++;
            }
            catch (e) {
                done(e);
                return;
            }
            if (triggerCount === 2) {
                done();
            }
        };
        subManager.subscribe({
            query: query,
            operationName: 'multiTrigger',
            variables: { filterBoolean: true, uga: 'UGA' },
            callback: callback,
        }).then(function (subId) {
            subManager.publish('NotATrigger', { filterBoolean: false });
            subManager.publish('Trigger1', { filterBoolean: true });
            subManager.publish('Trigger2', { filterBoolean: true });
            subManager.unsubscribe(subId);
        });
    });
    it('can subscribe to a trigger and pass options to PubSub using "channelOptions"', function (done) {
        var query = 'subscription X{ testChannelOptions }';
        subManager.subscribe({
            query: query,
            operationName: 'X',
            callback: function () { return null; },
        }).then(function () {
            expect(pubsub.subscribe).to.have.been.calledOnce;
            var expectedChannelOptions = {
                foo: 'bar',
            };
            expect(pubsub.subscribe).to.have.been.calledWith(sinon.match.string, sinon.match.func, expectedChannelOptions);
            done();
        }).catch(function (err) {
            done(err);
        });
    });
    it('can unsubscribe', function (done) {
        var query = 'subscription X{ testSubscription }';
        var callback = function (err, payload) {
            try {
                assert(false);
            }
            catch (e) {
                done(e);
                return;
            }
            done();
        };
        subManager.subscribe({ query: query, operationName: 'X', callback: callback }).then(function (subId) {
            subManager.unsubscribe(subId);
            subManager.publish('testSubscription', 'bad');
            setTimeout(done, 30);
        });
    });
    it('throws an error when trying to unsubscribe from unknown id', function () {
        expect(function () { return subManager.unsubscribe(123); })
            .to.throw('undefined');
    });
    it('throws an error when trying to unsubscribe a second time', function () {
        var query = 'subscription X{ testSubscription }';
        return subManager.subscribe({ query: query, operationName: 'X', callback: function () { } }).then(function (subId) {
            subManager.unsubscribe(subId);
            expect(function () { return subManager.unsubscribe(subId); })
                .to.throw('undefined');
        });
    });
    it('calls the error callback if there is an execution error', function (done) {
        var query = "subscription X($uga: Boolean!){\n      testSubscription  @skip(if: $uga)\n    }";
        var callback = function (err, payload) {
            try {
                expect(payload).to.be.defined;
            }
            catch (e) {
                done(e);
                return;
            }
            done();
        };
        subManager.subscribe({ query: query, operationName: 'X', callback: callback }).then(function (subId) {
            subManager.publish('testSubscription', 'good');
            subManager.unsubscribe(subId);
        });
    });
    it('calls context if it is a function', function (done) {
        var query = "subscription TestContext { testContext }";
        var callback = function (error, payload) {
            expect(error).to.be.null;
            expect(payload.data.testContext).to.eq('trigger');
            done();
        };
        var context = function () {
            return 'trigger';
        };
        subManager.subscribe({
            query: query,
            context: context,
            operationName: 'TestContext',
            variables: {},
            callback: callback,
        }).then(function (subId) {
            subManager.publish('contextTrigger', 'ignored');
            subManager.unsubscribe(subId);
        });
    });
    it('call the error callback if a context functions throws an error', function (done) {
        var query = "subscription TestContext { testContext }";
        var callback = function (err, payload) {
            try {
                expect(payload).to.be.undefined;
                expect(err.message).to.equals('context error');
            }
            catch (e) {
                done(e);
                return;
            }
            done();
        };
        var context = function () {
            throw new Error('context error');
        };
        subManager.subscribe({
            query: query,
            context: context,
            operationName: 'TestContext',
            variables: {},
            callback: callback,
        }).then(function (subId) {
            subManager.publish('contextTrigger', 'ignored');
            subManager.unsubscribe(subId);
        });
    });
    it('passes arguments to setupFunction', function (done) {
        var query = "subscription TestArguments {\n      testArguments(testArgument: 10)\n    }";
        var callback = function (error, payload) {
            try {
                expect(error).to.be.null;
                expect(capturedArguments).to.eql({ testArgument: 10 });
                expect(payload.data.testArguments).to.equal('10');
                done();
            }
            catch (error) {
                done(error);
            }
        };
        subManager.subscribe({
            query: query,
            operationName: 'TestArguments',
            variables: {},
            callback: callback,
        }).then(function (subId) {
            subManager.publish('Trigger1', 'ignored');
            subManager.unsubscribe(subId);
        });
    });
    it('passes defaultValue of argument to setupFunction', function (done) {
        var query = "subscription TestArguments {\n      testArguments\n    }";
        var callback = function (error, payload) {
            try {
                expect(error).to.be.null;
                expect(capturedArguments).to.eql({ testArgument: 1234 });
                expect(payload.data.testArguments).to.equal('1234');
                done();
            }
            catch (error) {
                done(error);
            }
        };
        subManager.subscribe({
            query: query,
            operationName: 'TestArguments',
            variables: {},
            callback: callback,
        }).then(function (subId) {
            subManager.publish('Trigger1', 'ignored');
            subManager.unsubscribe(subId);
        });
    });
});
var validationSchema = new graphql_1.GraphQLSchema({
    query: new graphql_1.GraphQLObjectType({
        name: 'Query',
        fields: {
            placeholder: { type: graphql_1.GraphQLString },
        },
    }),
    subscription: new graphql_1.GraphQLObjectType({
        name: 'Subscription',
        fields: {
            test1: { type: graphql_1.GraphQLString },
            test2: { type: graphql_1.GraphQLString },
        },
    }),
});
describe('SubscriptionValidationRule', function () {
    it('should allow a valid subscription', function () {
        var sub = "subscription S1{\n      test1\n    }";
        var errors = graphql_1.validate(validationSchema, graphql_1.parse(sub), [validation_1.subscriptionHasSingleRootField]);
        expect(errors.length).to.equals(0);
    });
    it('should allow another valid subscription', function () {
        var sub = "\n    subscription S1{\n      test1\n    }\n    subscription S2{\n      test2\n    }";
        var errors = graphql_1.validate(validationSchema, graphql_1.parse(sub), [validation_1.subscriptionHasSingleRootField]);
        expect(errors.length).to.equals(0);
    });
    it('should allow two valid subscription definitions', function () {
        var sub = "subscription S2{\n      test2\n    }";
        var errors = graphql_1.validate(validationSchema, graphql_1.parse(sub), [validation_1.subscriptionHasSingleRootField]);
        expect(errors.length).to.equals(0);
    });
    it('should not allow two fields in the subscription', function () {
        var sub = "subscription S3{\n      test1\n      test2\n    }";
        var errors = graphql_1.validate(validationSchema, graphql_1.parse(sub), [validation_1.subscriptionHasSingleRootField]);
        expect(errors.length).to.equals(1);
        expect(errors[0].message).to.equals('Subscription "S3" must have only one field.');
    });
    it('should not allow inline fragments', function () {
        var sub = "subscription S4{\n      ... on Subscription {\n        test1\n      }\n    }";
        var errors = graphql_1.validate(validationSchema, graphql_1.parse(sub), [validation_1.subscriptionHasSingleRootField]);
        expect(errors.length).to.equals(1);
        expect(errors[0].message).to.equals('Apollo subscriptions do not support fragments on the root field');
    });
    it('should not allow named fragments', function () {
        var sub = "subscription S5{\n      ...testFragment\n    }\n\n    fragment testFragment on Subscription{\n      test2\n    }";
        var errors = graphql_1.validate(validationSchema, graphql_1.parse(sub), [validation_1.subscriptionHasSingleRootField]);
        expect(errors.length).to.equals(1);
        expect(errors[0].message).to.equals('Apollo subscriptions do not support fragments on the root field');
    });
});
//# sourceMappingURL=tests.js.map