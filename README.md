# A Reply based GraphQL Server for Loopback

## Disclaimer
This is a fork of original [loopback-graphql-server](https://github.com/yahoohung/loopback-graphql-server). It only adds a small feature to that package. Since the original package is unmaintained and the author is not accepting any new pull requests, this package was developed and uploaded here. Use at your own risk.

Combine the powers of GraphQL with the backend of Loopback to automatically generate GraphQL endpoints based on Loopback Schema. 

## Installation

```sh
npm i loopback-graphql-server-with-ids -S
```
Add the loopback-graphql-server component to the `server/component-config.json`: 

```
"loopback-graphql-server": {
  "path": "/graphql",
  "graphiqlPath": "/graphiql",
  "modelMutationGroups": false,
  "modelQueryGroups": true
}
```

Requests will be posted to `path` path. (Default: `/graphql`);

Graphiql is available on `graphiqlPath` path. (Default: `/graphiql`);

## Starter
(https://github.com/yahoohung/loopback-graphql-starter)

## ACL and role mapping
- Auto on/off access control 
- Enable loopback based ACL configuration

## Access token
- Accepts AccessToken for authenticated API calls
- Get access token in operation hooks

## Queries
- `node` query to fetch single entity by ID
- Filter support for `where` with operators(https://loopback.io/doc/en/lb3/Where-filter.html) and `order` filters on queries
- Support for relations and querying related data
- Graphql Connections support for listed data
- Data pagination support by using navtive loopback function (`limit`, `offset`)
- Graphql Pagination (`first`, `last`, `before`, `after`)
- Remote methods integration
- Display total count number 
- Allow to select single level or nested schema

## Mutations
- Single level schema structure
- Maps all `post`, `put`, `patch` and `delete` methods to mutations
- Remote methods integration

## Subscriptions
- Deprecated

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
This is a fork of original [loopback-graphql-server](https://github.com/yahoohung/loopback-graphql-server). This versions adds support for querying the IDs as they appear in database by adding "_id" field in GraphQL's query. The type of the _id is String, but it can be changed by uncommenting a single [line](https://github.com/saubanbinusman/loopback-graphql-server/blob/master/src/types/generateType.js#L120) in the src/types/generateType.js. After doing this, the type of the ID will be determined based on it's type in your loopback model. Comment out Line# 119 after as it won't go well with the above modification.

This repository originally started as a fork of the [loopback-graphql](https://github.com/Tallyb/loopback-graphql) project by [Tallyb](https://github.com/Tallyb) and the [loopback-graphql-relay](https://github.com/BlueEastCode/loopback-graphql-relay) by [BlueEastCode](https://github.com/BlueEastCode). I have fixed many bugs and tested on enterprise environment. This version is ready for production use. 
