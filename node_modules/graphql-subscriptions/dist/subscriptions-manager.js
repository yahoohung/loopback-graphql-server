"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var values_1 = require("graphql/execution/values");
var validation_1 = require("./validation");
var ValidationError = (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(errors) {
        var _this = _super.call(this) || this;
        _this.errors = errors;
        _this.message = 'Subscription query has validation errors';
        return _this;
    }
    return ValidationError;
}(Error));
exports.ValidationError = ValidationError;
var SubscriptionManager = (function () {
    function SubscriptionManager(options) {
        this.pubsub = options.pubsub;
        this.schema = options.schema;
        this.setupFunctions = options.setupFunctions || {};
        this.subscriptions = {};
        this.maxSubscriptionId = 0;
    }
    SubscriptionManager.prototype.publish = function (triggerName, payload) {
        this.pubsub.publish(triggerName, payload);
    };
    SubscriptionManager.prototype.subscribe = function (options) {
        var _this = this;
        var parsedQuery = graphql_1.parse(options.query);
        var errors = graphql_1.validate(this.schema, parsedQuery, graphql_1.specifiedRules.concat([validation_1.subscriptionHasSingleRootField]));
        if (errors.length) {
            return Promise.reject(new ValidationError(errors));
        }
        var args = {};
        var subscriptionName = '';
        parsedQuery.definitions.forEach(function (definition) {
            if (definition.kind === 'OperationDefinition') {
                var rootField = definition.selectionSet.selections[0];
                subscriptionName = rootField.name.value;
                var fields = _this.schema.getSubscriptionType().getFields();
                args = values_1.getArgumentValues(fields[subscriptionName], rootField, options.variables);
            }
        });
        var triggerMap;
        if (this.setupFunctions[subscriptionName]) {
            triggerMap = this.setupFunctions[subscriptionName](options, args, subscriptionName);
        }
        else {
            triggerMap = (_a = {}, _a[subscriptionName] = {}, _a);
        }
        var externalSubscriptionId = this.maxSubscriptionId++;
        this.subscriptions[externalSubscriptionId] = [];
        var subscriptionPromises = [];
        Object.keys(triggerMap).forEach(function (triggerName) {
            var _a = triggerMap[triggerName], _b = _a.channelOptions, channelOptions = _b === void 0 ? {} : _b, _c = _a.filter, filter = _c === void 0 ? function () { return true; } : _c;
            var onMessage = function (rootValue) {
                return Promise.resolve().then(function () {
                    if (typeof options.context === 'function') {
                        return options.context();
                    }
                    return options.context;
                }).then(function (context) {
                    return Promise.all([
                        context,
                        filter(rootValue, context),
                    ]);
                }).then(function (_a) {
                    var context = _a[0], doExecute = _a[1];
                    if (!doExecute) {
                        return;
                    }
                    graphql_1.execute(_this.schema, parsedQuery, rootValue, context, options.variables, options.operationName).then(function (data) { return options.callback(null, data); });
                }).catch(function (error) {
                    options.callback(error);
                });
            };
            subscriptionPromises.push(_this.pubsub.subscribe(triggerName, onMessage, channelOptions)
                .then(function (id) { return _this.subscriptions[externalSubscriptionId].push(id); }));
        });
        return Promise.all(subscriptionPromises).then(function () { return externalSubscriptionId; });
        var _a;
    };
    SubscriptionManager.prototype.unsubscribe = function (subId) {
        var _this = this;
        this.subscriptions[subId].forEach(function (internalId) {
            _this.pubsub.unsubscribe(internalId);
        });
        delete this.subscriptions[subId];
    };
    return SubscriptionManager;
}());
exports.SubscriptionManager = SubscriptionManager;
//# sourceMappingURL=subscriptions-manager.js.map