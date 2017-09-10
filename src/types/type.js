'use strict';

const _ = require('lodash');

const {
    GraphQLID,
    GraphQLString,
    GraphQLBoolean,
    GraphQLFloat,
    GraphQLInt
} = require('graphql');

const { connectionDefinitions } = require('graphql-relay');

const CustomGraphQLDateType = require('./Date');
const GraphQLJSON = require('graphql-type-json');

const { getTypeDef } = require('./generateTypeDefs');
const { init, generateType, getNodeDefinitions } = require('./generateType');

/**
 * Singleton Placeholders
 */
const types = {};
const connectionTypes = {};


const getScalar = (name) => {

    switch (name) {
        case 'ID':
            return GraphQLID;

        case 'String':
            return GraphQLString;

        case 'Boolean':
            return GraphQLBoolean;

        case 'Float':
            return GraphQLFloat;

        case 'Int':
            return GraphQLInt;

        case 'Date':
            return CustomGraphQLDateType;

            // case 'File':
            //   return FileType;

            // case 'GeoPoint':
            //   return GeoPointType;

        case 'Json':
        case 'JSON':
            return GraphQLJSON;

        default:
            return null;
    }
};

/**
 * Get or create connection object
 * @param {*} name
 */
const getConnection = (name) => {
    if (!connectionTypes[name]) {
        connectionTypes[name] = connectionDefinitions({
            name,
            nodeType: getType(name),
            connectionFields: {
                totalCount: {
                    type: GraphQLInt,
                    description: 'Total number of items',
                    resolve: connection => {
                        if (connection.totalCount) {
                            return connection.totalCount
                        } else if (connection.edges) {
                            return connection.edges.length
                        }
                    },
                },
            },
        }).connectionType;
    }
    return connectionTypes[name];
};

/**
 * Get a type by name
 * @param {*} name
 */
const getType = (name) => {

    if (types[name]) {
        return types[name];
    }

    if (getScalar(name)) {
        return getScalar(name);
    }

    switch (name) {

        case 'node':
            types[name] = getNodeDefinitions().nodeField;
            return types[name];

        default:

            if (getTypeDef(name)) {
                types[name] = generateType(name, getTypeDef(name));
                return types[name];
            }
            return null;
    }
};


function buildTypes(models) {

    init(models);

    _.forEach(models, (model) => {
        getType(model.modelName);
    });

    return types;
}

module.exports = {
    buildTypes,
    getConnection,
    getScalar,
    getType,
};