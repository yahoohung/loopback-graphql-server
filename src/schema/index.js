'use strict';

const { GraphQLSchema } = require('graphql');
const getQuery = require('./query');
const getMutation = require('./mutation');
const getTypes = require('../types');

function getSchema(models, options) {

    const types = getTypes(models);

    const items = {
        query: getQuery(models, options),
        mutation: getMutation(models, options),
    };

    return new GraphQLSchema(items);
}

module.exports = {
    getSchema
};