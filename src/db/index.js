'use strict';

const _ = require('lodash');
const waterfall = require('async/waterfall');

const buildFilter = require('./buildFilter');

function getCount(model, obj, args, context) {
    return model.count(args.where);
}

function getFirst(model, obj, args) {
    const idName = (model.getIdName && model.getIdName()) ? model.getIdName() : 'id';

    return model.findOne({
            order: idName + (args.before ? ' DESC' : ' ASC'),
            where: args.where
        })
        .then(res => (res || {}));
}

function findOne(model, obj, args, context) {
    const id = obj ? obj[model.getIdName()] : args.id;
    return (id) ? model.findById(id) : null;
}

function getList(model, obj, args) {
    return model.find(buildFilter(model, args));
}

function findAll(model, obj, args, context) {
    const response = {
        args,
        count: undefined,
        first: undefined,
        list: undefined,
    };
    return getCount(model, obj, args, undefined)
        .then((count) => {
            response.count = count;
            return getFirst(model, obj, args);
        })
        .then((first) => {
            response.first = first;
            return getList(model, obj, Object.assign({}, args, { count: response.count }));
        })
        .then((list) => {
            response.list = list;
            return response;
        });
}

function findAllRelated(model, obj, method, args, context) {
    const response = {
        args,
        count: undefined,
        first: undefined,
        list: undefined,
    };

    return new Promise((resolve, reject) => {
        waterfall([
            function(callback) {
                obj[`__count__${method}`](args.where, callback);
            },
            function(count, callback) {
                response.count = count;

                const idName = (model.getIdName && model.getIdName()) ? model.getIdName() : 'id';
                obj[`__findOne__${method}`]({
                    order: idName + (args.before ? ' DESC' : ' ASC'),
                    where: args.where
                }, callback);
            },
            function(first, callback) {
                response.first = first;
                obj[`__get__${method}`](buildFilter(model, Object.assign({}, args, { count: response.count })), callback);
            }
        ], (err, list) => {

            if (err) {
                return reject(err);
            }
            response.list = list;
            return resolve(response);
        });

    });
}

function findAllViaThrough(rel, obj, args, context) {
    const response = {
        args,
        count: undefined,
        first: undefined,
        list: undefined,
    };

    return new Promise((resolve, reject) => {
        waterfall([
            function(callback) {
                obj[`__count__${rel.name}`](args.where, callback);
            },
            function(count, callback) {
                response.count = count;

                const idName = (rel.modelTo.getIdName && rel.modelTo.getIdName()) ? rel.modelTo.getIdName() : 'id';
                obj[`__findOne__${rel.name}`]({
                    order: idName + (args.before ? ' DESC' : ' ASC'),
                    where: args.where
                }, callback);
            },
            function(first, callback) {
                response.first = first;
                obj[`__get__${rel.name}`](buildFilter(rel.modelTo, Object.assign({}, args, { count: response.count })), callback);
            }
        ], (err, list) => {

            if (err) {
                return reject(err);
            }
            response.list = list;
            return resolve(response);
        });

    });
}

function findRelatedMany(rel, obj, args, context) {
    if (_.isArray(obj[rel.keyFrom])) {
        return [];
    }

    if (rel.modelThrough) {
        return findAllViaThrough(rel, obj, args, context);
    }

    args.where = {
        [rel.keyTo]: obj[rel.keyFrom],
    };

    return findAll(rel.modelTo, obj, args, context);
}

function findRelatedOne(rel, obj, args, context) {
    if (_.isArray(obj[rel.keyFrom])) {
        return Promise.resolve([]);
    }
    args = {
        [rel.keyTo]: obj[rel.keyFrom]
    };
    return findOne(rel.modelTo, null, args, context);
}

module.exports = {
    findAll,
    findOne,
    findRelatedMany,
    findRelatedOne,
    findAllRelated
};