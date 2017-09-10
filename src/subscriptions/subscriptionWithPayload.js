const _ = require('lodash');

const {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType
} = require('graphql');

const { getType } = require('../types/type');

function resolveMaybeThunk(maybeThunk) {
  return typeof maybeThunk === 'function' ? maybeThunk() : maybeThunk;
}

function defaultGetPayload(obj) {
  return (obj && obj.data) ? obj.data : null;
}

module.exports = function subscriptionWithPayload({
  name,
  model,
  subscribeAndGetPayload = defaultGetPayload
}) {
  const inputType = new GraphQLInputObjectType({
    name: `${name}SubscriptionInput`,
    fields: () => Object.assign({},
			// resolveMaybeThunk(inputFields),
      { options: { type: getType('JSON') } },
			{ create: { type: getType('Boolean') } },
			{ update: { type: getType('Boolean') } },
			{ remove: { type: getType('Boolean') } },
			{ clientSubscriptionId: { type: getType('Int') } }
    )
  });

  const outputFields = {};
  const modelFieldName = _.camelCase(_.lowerCase(model.modelName));
  outputFields[modelFieldName] = {
    type: getType(model.modelName),
    resolve: o => o.object
  };

  const outputType = new GraphQLObjectType({
    name: `${name}SubscriptionPayload`,
    fields: () => Object.assign({},
			resolveMaybeThunk(outputFields),
			{ where: { type: getType('JSON') } },
			{ type: { type: getType('String') } },
      { target: { type: getType('String') } },
			{ clientSubscriptionId: { type: getType('Int') } }
    )
  });

  return {
    type: outputType,
    args: {
      input: { type: new GraphQLNonNull(inputType) },
    },

    resolve(obj, { input }, context, info) {

      const clientSubscriptionId = (obj) ? obj.subscriptionId : null;
      const object = (obj) ? obj.object : null;

      const where = (obj) ? obj.object.where : null;
      const type = (obj) ? obj.object.type : null;
      const target = (obj) ? obj.object.target : null;

      return Promise.resolve(subscribeAndGetPayload(object, { input }, context, info))
				.then(payload => ({ clientSubscriptionId, where, type, target, object: payload }));
    }
  };
};
