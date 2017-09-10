
const _ = require('lodash');

const {
	GraphQLObjectType,
  GraphQLInputObjectType,
	GraphQLEnumType,
	GraphQLList,
  GraphQLNonNull
} = require('graphql');

const {
	globalIdField,
	fromGlobalId,
	nodeDefinitions: relayNodeDefinitions,
} = require('graphql-relay');

// const type = require('./type');
let { getType, getConnection } = require('./type');
const { generateTypeDefs } = require('./generateTypeDefs');

/**
 * Singleton Objects
 */
const models = {};
let nodeDefinitions = {};

/**
 * Init
 * @param {*} _models
 */
function init(_models) {
  _.forEach(_models, (model) =>  {
    models[model.modelName] = model;
  });

  generateTypeDefs(models);
  generateNodeDefinitions(models);
}

/**
 * Handle cases where id field name is not 'id'
 * @param {*} type
 */
const processIdField = (name, type) => {

  if (!models[name] || !models[name].getIdName) {
    return;
  }

  const idFieldName = models[name].getIdName();
  const idField = _.find(type.meta.fields, (f, i) => i === idFieldName);

  if (_.isNil(idField)) {
    return;
  }

  if (idFieldName !== 'id') {
    // if (!_.isNil(type.fields.id)) {
    //   type.fields._id = _.clone(type.fields.id);
    // }

    type.meta.fields.id = idField;
  }

  if (idField) {
    type.interfaces = [nodeDefinitions.nodeInterface];
  }
};

function generateFieldArgs(field) {
  const args = {};

  _.forEach(field.meta.args, (arg, argName) => {
    // If doesnt have {generated: false} prop, then it is
    // already built. Hence return it as is.
    if (arg.generated !== false) {
      args[argName] = arg;
      return;
    }

    args[argName] = { type: (arg.required === true) ? new GraphQLNonNull(getType(arg.type)) : getType(arg.type) };
  });

  return args;
}

function generateTypeFields(def) {
  getType = require('./type').getType;
  getConnection = require('./type').getConnection;

  const fields = {};

  _.forEach(def.meta.fields, (field, fieldName) => {

    field = _.clone(field);

    if (field.meta.hidden === true) {
      return;
    }

    field.meta.name = fieldName;
    delete field.generated;

    // If it's an id field, make it a globalId
    if (fieldName === 'id' && def.meta.input !== true) {
      fields.id = globalIdField(def.name, (o) => {
        try {
          const idName = models[def.name].getIdName();
          return o[idName];
        } catch (e) {
          return o.id;
        }
      });
      return;
    }

    if (field.meta.relation === true) {
      field.type = (field.meta.isMany === true) ? getConnection(field.meta.type) : getType(field.meta.type);
    } else if (field.meta.list) {
      // field.type = getConnection(field.meta.type);
      field.type = new GraphQLList(getType(field.meta.type));
    } else {
      field.type = (field.meta.required === true) ? new GraphQLNonNull(getType(field.meta.type)) : getType(field.meta.type);
    }

    // Field arguments
    field.args = generateFieldArgs(field);

    // Is Inpuut Type?
    if (def.meta.input === true) {
      delete field.resolve;
    }

    fields[fieldName] = field;
  });

  return fields;
}

/**
 * Dynamically generate type based on the definition in typeDefs
 * @param {*} name
 * @param {*} def Type definition
 */
function generateType(name, def) {
  // const def = _.find(getTypeDefs(), (o, n) => n === name);

  if (!name || !def) {
    return null;
  }

  // If def doesnt have {generated: false} prop, then it is
  // already a type. Hence return it as is.
  if (def.generated !== false) {
    return def;
  }

  def = _.clone(def);
  processIdField(name, def);

  if (def.meta.category === 'TYPE') {

    def.fields = () => generateTypeFields(def);

    if (def.meta.input === true) {
      return new GraphQLInputObjectType(def);
    }

    return new GraphQLObjectType(def);
  } else if (def.category === 'ENUM') {
    const values = {};
    _.forEach(def.values, (val) => { values[val] = { value: val }; });
    def.values = values;

    return new GraphQLEnumType(def);
  }
}

/**
 *
 * @param {*} models
 */
function generateNodeDefinitions(models) {
  nodeDefinitions = relayNodeDefinitions(
    (globalId, context, { rootValue }) => {
      const { type, id } = fromGlobalId(globalId);
      return models[type].findById(id).then((obj) => {
        obj.__typename = type;
        return Promise.resolve(obj);
      });
    },
    obj => getType(obj.__typename)
  );
}

/**
 *
 */
function getNodeDefinitions() {
  return nodeDefinitions;
}

module.exports = {
  init,
  generateType,
  getNodeDefinitions
};
