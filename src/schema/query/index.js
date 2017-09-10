'use strict';

const _ = require('lodash');

const { GraphQLObjectType } = require('graphql');
const { getType } = require('../../types/type');
const getRemoteMethodQueries = require('./getRemoteMethodQueries');

function generateModelFields(models, options) {

    const modelFields = {};
    _.forEach(models, (model) => {

        const fields = Object.assign({},
            getRemoteMethodQueries(model, options)
        );

        if (_.size(fields) === 0) {
            return;
        }

        if (options.modelQueryGroups) {
            modelFields[model.modelName] = {
                resolve: (root, args, context) => ({}),
                type: new GraphQLObjectType({
                    name: `${model.modelName}Queries`,
                    description: model.modelName,
                    fields
                })
            };
        } else {
            for (let key in fields) {
                modelFields[key] = {
                    resolve: (root, args, context) => ({}),
                    type: new GraphQLObjectType({
                        name: key,
                        description: fields[key].description,
                        fields: fields[key].args
                    })
                };
            }
        }


    });

    return modelFields;
}

module.exports = function(models, options) {
    const fields = Object.assign({}, generateModelFields(models, options));

    return new GraphQLObjectType({
        name: 'Query',
        fields
    });
};