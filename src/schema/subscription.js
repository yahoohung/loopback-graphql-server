'use strict';

const _ = require('lodash');

const { GraphQLObjectType } = require('graphql');

const { getType } = require('../types/type');
const subscriptionWithPayload = require('../subscriptions/subscriptionWithPayload');

/**
 * Create basic save and delete methods for all shared models
 * @param {*} model
 */
function addModel(model) {
  const fields = {};

  const saveFieldName = `${model.modelName}`;

  fields[saveFieldName] = subscriptionWithPayload({
    name: saveFieldName,
    model,
    outputFields: {
      obj: {
        type: getType(model.modelName),
        resolve: o => o
      },
    },
    // subscribeAndGetPayload: obj => obj
  });

  return fields;
}

module.exports = function(models) {

  const fields = {};
  _.forEach(models, (model) => {

    if (!model.shared) {
      return;
    }

    Object.assign(
      fields,
      addModel(model)
    );
  });

  return new GraphQLObjectType({
    name: 'Subscription',
    fields
  });
};
