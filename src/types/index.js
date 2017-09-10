'use strict';

const { buildTypes } = require('./type');

module.exports = function initTypes(models) {
  return buildTypes(models);
};
