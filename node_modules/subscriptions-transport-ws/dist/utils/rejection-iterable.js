"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var iterall_1 = require("iterall");
exports.createRejectionIterable = function (error) {
    return _a = {
            next: function () {
                return Promise.reject(error);
            },
            return: function () {
                return Promise.resolve({ done: true, value: undefined });
            },
            throw: function (e) {
                return Promise.reject(e);
            }
        },
        _a[iterall_1.$$asyncIterator] = function () {
            return this;
        },
        _a;
    var _a;
};
//# sourceMappingURL=rejection-iterable.js.map