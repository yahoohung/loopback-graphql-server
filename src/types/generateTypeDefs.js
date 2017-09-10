const _ = require('lodash');

const {
  connectionArgs
} = require('graphql-relay');

const GeoPointTypeDefs = require('./GeoPoint');
const { findRelatedOne, findRelatedMany } = require('../db');
const { connectionFromPromisedArray } = require('../db/resolveConnection');

/** * Loopback Types - GraphQL types
        any - JSON
        Array - [JSON]
        Boolean = boolean
        Buffer - not supported
        Date - Date (custom scalar)
        GeoPoint - not supported
        null - not supported
        Number = float
        Object = JSON (custom scalar)
        String - string
    ***/

let types = {};

const SCALARS = {
  any: 'JSON',
  number: 'Float',
  string: 'String',
  boolean: 'Boolean',
  objectid: 'ID',
  date: 'Date',
  object: 'JSON',
  now: 'Date',
  guid: 'ID',
  uuid: 'ID',
  uuidv4: 'ID'
};

function getScalar(type) {
  return SCALARS[type.toLowerCase().trim()];
}

function toTypes(union) {
  return _.map(union, type => (getScalar(type) ? getScalar(type) : type));
}

/**
 * Generates a property definition for a model type
 * @param {*} model
 * @param {*} property
 * @param {*} modelName
 * @param {*} propertyName
 * @param {*} isInputType
 */
function mapProperty(model, property, modelName, propertyName, isInputType = false) {

  // If property is deprecated, ignore it.
  if (property.deprecated) {
    return;
  }

  // Bootstrap basic property object
  types[modelName].meta.fields[propertyName] = {
    generated: false,
    meta: {
      required: property.required,
      hidden: model.definition.settings.hidden && model.definition.settings.hidden.indexOf(propertyName) !== -1
    }
  };
  const currentProperty = types[modelName].meta.fields[propertyName];

  const typeName = `${modelName}_${propertyName}`;
  let propertyType = property.type;

  // Add resolver
  currentProperty.resolve = (obj, args, context) => (_.isNil(obj[propertyName]) ? null : obj[propertyName]);

  // If it's an Array type, map it to JSON Scalar
  if (propertyType.name === 'Array') { // JSON Array
    currentProperty.meta.list = true;
    currentProperty.meta.type = 'JSON';
    currentProperty.meta.scalar = true;
    return;
  }

  // If it's an Array type, map it to JSON Scalar
  if (propertyType.name === 'GeoPoint') { // JSON Array
    currentProperty.meta.type = (isInputType) ? 'GeoPointInput' : 'GeoPoint';
    return;
  }

  // If property.type is an array, its a list type.
  if (_.isArray(property.type)) {
    currentProperty.meta.list = true;
    propertyType = property.type[0];
  }

  // See if this property is a scalar.
  let scalar = getScalar(propertyType.name);

  if (property.defaultFn) {
    scalar = getScalar(property.defaultFn);
  }

  if (scalar) {
    currentProperty.meta.scalar = true;
    currentProperty.meta.type = scalar;

    if (property.enum) { // enum has a dedicated type but no input type is required
      types[typeName] = {
        generated: false,
        name: typeName,
        values: property.enum,
        meta: {
          category: 'ENUM'
        }
      };
      currentProperty.type = typeName;
    }
  }

  // If this property is another Model
  if (propertyType.name === 'ModelConstructor' && property.defaultFn !== 'now') {
    currentProperty.meta.type = (!isInputType) ? propertyType.modelName : `${propertyType.modelName}Input`;
    const union = propertyType.modelName.split('|');

    // type is a union
    if (union.length > 1) { // union type
      types[typeName] = { // creating a new union type
        generated: false,
        name: typeName,
        meta: {
          category: 'UNION'
        },
        values: toTypes(union)
      };
    } else if (propertyType.settings && propertyType.settings.anonymous && propertyType.definition) {
      currentProperty.meta.type = typeName;
      types[typeName] = {
        generated: false,
        name: typeName,
        meta: {
          category: 'TYPE',
          input: isInputType,
          fields: {}
        }
      }; // creating a new type
      _.forEach(propertyType.definition.properties, (p, key) => {
        mapProperty(propertyType, p, typeName, key, isInputType);
      });
    }
  }
}

function isManyRelation(type) {
  switch (type) {
    case 'hasOne':
    case 'embedsOne':
    case 'belongsTo':
      return false;

    case 'hasMany':
    case 'embedsMany':
    case 'referencesMany':
    case 'hasAndBelongsToMany':
      return true;

    default:
      return undefined;
  }
}

/**
 * Maps a relationship as a connection property to a given type
 * @param {*} rel
 * @param {*} modelName
 * @param {*} relName
 */
function mapRelation(rel, modelName, relName) {
  types[modelName].meta.fields[relName] = {
    generated: false,
    meta: {
      relation: true,
      connection: true,
      relationType: rel.type,
      isMany: isManyRelation(rel.type),
      embed: rel.embed,
      type: rel.modelTo.modelName,
      args: Object.assign({
        where: {
          generated: false,
          type: 'JSON'
        },
        order: {
          generated: false,
          type: 'JSON'
        },
      }, connectionArgs),
    },
    resolve: (obj, args, context) => {
      if (isManyRelation(rel.type) === true) {
        return connectionFromPromisedArray(findRelatedMany(rel, obj, args, context), args);
      }

      return findRelatedOne(rel, obj, args, context);
    }
  };
}

/**
 * Generates a definition for a single model type
 * @param {*} model
 */
function mapType(model) {
  types[model.modelName] = {
    generated: false,
    name: model.modelName,
    meta: {
      category: 'TYPE',
      fields: {}
    }
  };

  _.forEach(model.definition.properties, (property, key) => {
    mapProperty(model, property, model.modelName, key);
  });

  _.forEach(sharedRelations(model), (rel) => {
    mapRelation(rel, model.modelName, rel.name);
  });
}

/**
 * Generates a definition for a single model input type
 * @param {*} model
 */
function mapInputType(model) {
  const modelName = `${model.modelName}Input`;

  types[modelName] = {
    generated: false,
    name: modelName,
    meta: {
      category: 'TYPE',
      input: true,
      fields: {}
    }
  };

  _.forEach(model.definition.properties, (property, key) => {
    mapProperty(model, property, modelName, key, true);
  });
}

function sharedRelations(model) {
  return _.pickBy(model.relations, rel => rel.modelTo && rel.modelTo.shared);
}

function getTypeDef(name) {
  return types[name];
}

function getTypeDefs() {
  return types;
}

function getCustomTypeDefs() {
  return GeoPointTypeDefs;
}
/**
 * building all models types & relationships
 */
function generateTypeDefs(models) {

  types = Object.assign({}, types, getCustomTypeDefs());

  _.forEach(models, (model) => {
    mapType(model);
    mapInputType(model);
  });

  return types;
}

module.exports = {
  getTypeDef,
  getTypeDefs,
  generateTypeDefs,
  SCALARS
};
