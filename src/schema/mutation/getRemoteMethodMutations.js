'use strict';

const _ = require('lodash');

const {
    mutationWithClientMutationId,
    connectionFromPromisedArray
} = require('graphql-relay');

const promisify = require('promisify-node');

const utils = require('../utils');
const checkAccess = require("../ACLs");

const allowedVerbs = ['post', 'del', 'put', 'patch', 'all'];

module.exports = function getRemoteMethodMutations(model) {
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

                hooks[hookName] = mutationWithClientMutationId({
                    name: hookName,
                    description: method.description,
                    meta: { relation: true },
                    inputFields: acceptingParams,
                    outputFields: {
                        obj: {
                            type: typeObj.type,
                            resolve: o => o
                        },
                    },
                    mutateAndGetPayload: (args, context) => {

                        let modelId = args && args.id;
                        return checkAccess({ accessToken: context.req.accessToken, model: model, method: method, id: modelId })
                            .then(() => {
                                let params = [];
                                let wrap;
                                let ctxOptions;
                                if(model.modelName.toLowerCase() == "user" || model.modelName.toLowerCase() == "useraccount" && method.name == "login"){
                                    ctxOptions = "";
                                }else{
                                    if(context.req.hasOwnProperty('accessToken') && context.req.accessToken != null){
                                        ctxOptions = { injectedAccessToken: { userId: context.req.accessToken.userId } };
                                    } else {
                                        ctxOptions = "";
                                    }
                                }

                                if (Object.keys(acceptingParams).length > 0) {
                                    _.forEach(acceptingParams, (param, name) => {
                                        if (args[name] && Object.keys(args[name]).length > 0) {
                                            if (typeof args[name] === 'string') {
                                                params.push(args[name])
                                            } else {
                                                params.push(_.cloneDeep(args[name]))
                                            }
                                        }
                                    });
    
                                    wrap = promisify(model[method.name](params, ctxOptions));
                                } else {
                                    wrap = promisify(model[method.name](ctxOptions));
                                }


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
                });
            }
        });
    }

    return hooks;
};