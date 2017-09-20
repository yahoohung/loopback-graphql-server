'use strict';

const graphql = require('graphql-server-express');
const bodyParser = require('body-parser');
const { getSchema } = require('./schema/index');
const { printSchema } = require('graphql/utilities');

const fs = require('fs');

const startSubscriptionServer = require('./subscriptions');

module.exports = function(app, options) {
    let models = [];
    app.models().forEach(function(element) {
        if (element.shared) models.push(element)
    });

    if (models.length >= 1) {

        const schema = getSchema(models, options);

        fs.writeFileSync(
            require('path').join(__dirname, './schema.graphql'),
            printSchema(schema)
        );

        const graphiqlPath = options.graphiqlPath || '/graphiql';
        const path = options.path || '/graphql';

        app.use(path, bodyParser.json(), graphql.graphqlExpress(req => ({
            schema,
            context: {
                app,
                req
            }
        })));

        app.use(graphiqlPath, graphql.graphiqlExpress({
            endpointURL: path
        }));

        // Subscriptions
        //startSubscriptionServer(app, schema, options);
    }
};