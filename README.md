# Relay GraphQL Server for Loopback

Combine the powers of GraphQL with the backend of Loopback to automatically generate GraphQL endpoints based on Loopback Schema. 

## Installation

```sh
npm i loopback-graphql-server -S
```
Add the loopback-graphql-server component to the `server/component-config.json`: 

```
"loopback-graphql-server": {
  "path": "/graphql",
  "graphiqlPath": "/graphiql",
  "subscriptionServer": {
    "disable": true,
    "port": 5000,
    "options": {},
    "socketOptions": {}
  },
  "modelMutationGroups": false,
  "modelQueryGroups": true
}
```

Requests will be posted to `path` path. (Default: `/graphql`);

Graphiql is available on `graphiqlPath` path. (Default: `/graphiql`);

GraphQL subscription Server can be customised by passing `subscriptionServer` configuration. More information can be found at (https://github.com/apollographql/subscriptions-transport-ws#subscriptionserver) or (https://facebook.github.io/relay/docs/subscriptions.html)

## ACL and role mapping
- Auto on/off access control 
- Enable loopback based ACL configuration

### Access token
- Accepts AccessToken for authenticated API calls
- Get access token in operation hooks

## Queries
- Relay Specification: `node` query to fetch single entity by ID
- Filter support for `where` with operators(https://loopback.io/doc/en/lb3/Where-filter.html) and `order` filters on queries
- Support for relations and querying related data
- Relay Connections support for listed data
- Data pagination support by using navtive loopback function (`limit`, `offset`)
- Relay Pagination (`first`, `last`, `before`, `after`)
- Remote methods integration
- Display total count number 
- Allow to select single level or nested schema

## Mutations
- Single level schema structure
- Maps all `post`, `put`, `patch` and `delete` methods to mutations
- Remote methods integration

## Subscriptions
- `create`, `update` and `remove` events of all shared models.

## Other Features
### Loopback Types
- [x] Any
- [x] Array
- [x] Boolean
- [ ] Buffer
- [x] Date
- [x] GeoPoint
- [x] Null
- [x] Number
- [x] Object
- [x] String

### Loopback Relations
- [x] BelongsTo
- [x] HasOne
- [x] HasMany
- [ ] HasManyThrough
- [x] HasAndBelongsToMany
- [ ] Polymorphic
- [x] EmbedsOne
- [x] EmbedsMany
- [x] ReferencesMany

### Todo
- [ ] File uploads

## Inspiration
This repository originally started as a fork of the [loopback-graphql](https://github.com/Tallyb/loopback-graphql) project by [Tallyb](https://github.com/Tallyb) and the [loopback-graphql-relay](https://github.com/BlueEastCode/loopback-graphql-relay) by [BlueEastCode](https://github.com/BlueEastCode). I have fixed many bugs and tested on enterprise environment. This version is ready for production use. 