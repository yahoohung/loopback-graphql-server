# graphql-date [![Build Status](https://travis-ci.org/tjmehta/graphql-date.svg)](https://travis-ci.org/tjmehta/graphql-date) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
GraphQL Date Type

# Installation
```bash
npm i --save graphql-date
```

# Usage
```js
var GraphQLDate = require('graphql-date')

// Use graphql-date in your GraphQL objects for Date properties
var fooType = new GraphQLObjectType({
  name: 'Foo',
  description: 'Some foo type',
  fields: {
    created: {
      type: GraphQLDate,
      description: 'Date foo was created'
    }
  }
});

var queryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    foo: {
      type: fooType,
      resolve: function () {
        // ...
      },
    }
  }
})
```

# License
MIT
