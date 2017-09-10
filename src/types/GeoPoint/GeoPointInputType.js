const GraphQLFloat = require('graphql').GraphQLFloat;
const GraphQLNonNull = require('graphql').GraphQLNonNull;
const GraphQLInputObjectType = require('graphql').GraphQLInputObjectType;

const InputType = new GraphQLInputObjectType({
  name: 'GeoPointInput',
  fields: {
    lat: { type: new GraphQLNonNull(GraphQLFloat) },
    lng: { type: new GraphQLNonNull(GraphQLFloat) }
  }
});

module.exports = InputType;
