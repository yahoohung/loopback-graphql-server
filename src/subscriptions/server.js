const http = require('http');
const https = require('https');
const fs = require('fs');

const { SubscriptionServer } = require('subscriptions-transport-ws');


module.exports = function(app, subscriptionManager, opts) {

  const subscriptionOpts = opts.subscriptionServer || {};

  const disable = subscriptionOpts.disable || false;

  if (disable === true) {
    return;
  }

  const WS_PORT = subscriptionOpts.port || 5000;
  const options = subscriptionOpts.options || {};
  const socketOptions = subscriptionOpts.socketOptions || {};

  let websocketServer;
  if (subscriptionOpts.ssl) {
    const ssl = {
      key: fs.readFileSync(subscriptionOpts.keyPath),
      cert: fs.readFileSync(subscriptionOpts.certPath)
    };
    websocketServer = https.createServer(ssl, (request, response) => {
      response.writeHead(404);
      response.end();
    });
  } else {
    websocketServer = http.createServer((request, response) => {
      response.writeHead(404);
      response.end();
    });
  }

  websocketServer.listen(WS_PORT, () => console.log(
    `Websocket Server is now running on http(s)://localhost:${WS_PORT}`
  ));

  const server = new SubscriptionServer(
    Object.assign({}, {
      subscriptionManager
    }, options),
    Object.assign({}, {
      server: websocketServer,
      path: '/'
    }, socketOptions)
  );

  return server;
};
