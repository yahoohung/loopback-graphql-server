"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var FIELD = 'Field';
function tooManySubscriptionFieldsError(subscriptionName) {
    return "Subscription \"" + subscriptionName + "\" must have only one field.";
}
exports.tooManySubscriptionFieldsError = tooManySubscriptionFieldsError;
function subscriptionHasSingleRootField(context) {
    var schema = context.getSchema();
    schema.getSubscriptionType();
    return {
        OperationDefinition: function (node) {
            var operationName = node.name ? node.name.value : '';
            var numFields = 0;
            node.selectionSet.selections.forEach(function (selection) {
                if (selection.kind === FIELD) {
                    numFields++;
                }
                else {
                    context.reportError(new graphql_1.GraphQLError('Apollo subscriptions do not support fragments on the root field', [node]));
                }
            });
            if (numFields > 1) {
                context.reportError(new graphql_1.GraphQLError(tooManySubscriptionFieldsError(operationName), [node]));
            }
            return false;
        },
    };
}
exports.subscriptionHasSingleRootField = subscriptionHasSingleRootField;
//# sourceMappingURL=validation.js.map