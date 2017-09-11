const PubSub = require('./pubsub');
const SubscriptionManager = require('./subscriptionManager');
const SubscriptionServer = require('./server');

module.exports = function startSubscriptionServer(app, schema, options) {
    const models = app.models();
    const subscriptionManager = SubscriptionManager(models, schema, new PubSub());
    SubscriptionServer(app, subscriptionManager, options);
};