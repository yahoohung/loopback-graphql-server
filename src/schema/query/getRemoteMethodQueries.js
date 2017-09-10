'use strict';

const _ = require('lodash');

const promisify = require('promisify-node');
const checkAccess = require('../ACLs');

const utils = require('../utils');
const db = require('../../db');
const { connectionFromPromisedArray } = require('graphql-relay');
const allowedVerbs = ['get', 'head'];

module.exports = function getRemoteMethodQueries(model, options) {
    const hooks = {};

    if (model.sharedClass && model.sharedClass.methods) {
        model.sharedClass.methods().forEach((method) => {
            if (method.name.indexOf('Stream') === -1 && method.name.indexOf('invoke') === -1) {

                if (!utils.isRemoteMethodAllowed(method, allowedVerbs)) {
                    return;
                }

                // TODO: Add support for static methods
                if (method.isStatic === false) {
                    return;
                }

                const typeObj = utils.getRemoteMethodOutput(method);
                const acceptingParams = utils.getRemoteMethodInput(method, typeObj.list);
                const hookName = utils.getRemoteMethodQueryName(model, method);

                hooks[hookName] = {
                    name: hookName,
                    description: method.description,
                    meta: { relation: true },
                    args: acceptingParams,
                    type: typeObj.type,
                    resolve: (__, args, context, info) => {

                        let params = {};

                        _.forEach(acceptingParams, (param, name) => {
                            if (args[name] && Object.keys(args[name]).length > 0)
                                params = _.merge(params, args[name]);
                        });
                        let modelId = args && args.id;
                        return checkAccess({
                                accessToken: context.req.accessToken,
                                model: model,
                                method: method,
                                id: modelId,
                                ctx: context,
                                options: options
                            })
                            .then(() => {
                                let wrap = promisify(model[method.name](params, ctxOptions));
                                let ctxOptions = { accessToken: context.req.accessToken }

                                if (typeObj.list) {
                                    return connectionFromPromisedArray(wrap, args, model);
                                } else {
                                    return wrap;
                                }


                            })
                            .catch((err) => {
                                throw err;
                            });
                    }
                };
            }
        });
    }

    return hooks;
};