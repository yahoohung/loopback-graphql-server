const SubscriptionManager = require('graphql-subscriptions').SubscriptionManager;
const _ = require('lodash');

module.exports = function(models, schema, pubsub) {

  const setupFunctions = {};

  _.forEach(models, (model) => {

    if (!model.shared) {
      return;
    }

    setupFunctions[model.modelName] = (options, args) => {
      const ret = {};
      ret[_.lowerCase(model.modelName)] = {
          // filter: comment => comment.repository_name === args.repoFullName,
        channelOptions: getOptions(model, options, args)
      };

      return ret;
    };

  });

  return new SubscriptionManager({
    schema,
    pubsub,

    // setupFunctions maps from subscription name to a map of channel names and their filter functions
    // in this case it will subscribe to the commentAddedChannel and re-run the subscription query
    // every time a new comment is posted whose repository name matches args.repoFullName.
    setupFunctions
  });
};

function getOptions(model, options, args) {
  const basicOpts = {
    context: options.context,
    create: (!_.isNil(args.input.create)) ? args.input.create : false,
    update: (!_.isNil(args.input.update)) ? args.input.update : false,
    remove: (!_.isNil(args.input.remove)) ? args.input.remove : false,
    options: (!_.isNil(args.input.options)) ? args.input.options : false,
    clientSubscriptionId: (!_.isNil(args.input.clientSubscriptionId)) ? args.input.clientSubscriptionId : false,
  };

  basicOpts.model = model;

  return basicOpts;
}
