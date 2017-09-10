'use strict';

const _ = require('lodash');
const utils = require('./utils');

/**
 * Inspired by https://www.reindex.io/blog/relay-graphql-pagination-with-mongodb/
 */
module.exports = function buildFilter(model, args) {
  const idName = (model.getIdName && model.getIdName()) ? model.getIdName() : 'id';

  const filter = {
    where: args.where || {}
  };

  sortFilter(filter, args.order, args.before, idName);
  limitFilter(filter, args.before, args.after, null, idName);
  applyPagination(filter, args.first, args.last, args.count);

  return filter;
};

function sortFilter(filter, order, before, idName) {
  const end = utils.getId(before);
  const idSort = idName + (end ? ' DESC' : ' ASC');

  if (!order) {
    filter.order = idSort;
  } else {
    filter.order = _.concat(order, idSort);
  }
}

function limitFilter(filter, before, after, order, idName) {

  const begin = utils.getId(after);
  const end = utils.getId(before);

  if (begin) {
    filter.where[idName] = filter[idName] || {};
    filter.where[idName].gt = begin;
  }
  if (end) {
    filter.where[idName] = filter[idName] || {};
    filter.where[idName].lt = end;
  }
}

function applyPagination(filter, first, last, count) {
  if (first || last) {
    let limit;
    let skip;

    if (first && count > first) {
      limit = first;
    }

    if (last) {
      if (limit && limit > last) {
        skip = limit - last;
        limit -= skip;
      } else if (!limit && count > last) {
        skip = count - last;
      }
    }

    if (skip) {
      filter.skip = skip;
    }

    if (limit) {
      filter.limit = limit;
    }
  }

  return {
    hasNextPage: Boolean(first && count > first),
    hasPreviousPage: Boolean(last && count > last),
  };
}
