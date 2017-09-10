const GraphQLObjectType = require('graphql').GraphQLObjectType;
const GraphQLFloat = require('graphql').GraphQLFloat;
const GraphQLNonNull = require('graphql').GraphQLNonNull;

const Type = new GraphQLObjectType({
  name: 'GeoPoint',
  fields: {
    lat: {
      type: new GraphQLNonNull(GraphQLFloat),
      resolve: obj => obj.lat
    },
    lng: {
      lng: new GraphQLNonNull(GraphQLFloat),
      resolve: obj => obj.lng
    }
  }
});

module.exports = Type;
