const PubSub = require('./pubsub');
const SubscriptionManager = require('./subscriptionManager');
const SubscriptionServer = require('./server');

module.exports = function startSubscriptionServer(app, schema, options) {
    let models = [];
    app.models().forEach(function(element) {
        if (element.shared) models.push(element)
    });

    const subscriptionManager = SubscriptionManager(models, schema, new PubSub());
    SubscriptionServer(app, subscriptionManager, options);
};