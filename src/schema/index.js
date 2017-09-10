'use strict';

const { GraphQLSchema } = require('graphql');
const getQuery = require('./query');
const getMutation = require('./mutation');
const getSubscription = require('./subscription');
const getTypes = require('../types');

function getSchema(models, options) {

    getTypes(models);

    const items = {
        query: getQuery(models, options),
        mutation: getMutation(models, options),
    };

    if (options && options.subscriptionServer && options.subscriptionServer.disable !== true) {
        items.subscription = getSubscription(models);
    }
    return new GraphQLSchema(items);
}

module.exports = {
    getSchema
};