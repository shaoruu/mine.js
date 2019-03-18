"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var generator_1 = require("./generator");
// Type checkers
function isMiddlewareResolver(obj) {
    return (typeof obj === 'function' ||
        (typeof obj === 'object' && obj.then !== undefined));
}
exports.isMiddlewareResolver = isMiddlewareResolver;
function isMiddlewareWithFragment(obj) {
    return ((typeof obj.fragment === 'string' || typeof obj.fragments === 'object') &&
        isMiddlewareResolver(obj.resolve));
}
exports.isMiddlewareWithFragment = isMiddlewareWithFragment;
function isMiddlewareFunction(obj) {
    return isMiddlewareWithFragment(obj) || isMiddlewareResolver(obj);
}
exports.isMiddlewareFunction = isMiddlewareFunction;
function isMiddlewareGenerator(x) {
    return x instanceof generator_1.MiddlewareGenerator;
}
exports.isMiddlewareGenerator = isMiddlewareGenerator;
function isGraphQLObjectType(obj) {
    return obj instanceof graphql_1.GraphQLObjectType || obj instanceof graphql_1.GraphQLInterfaceType;
}
exports.isGraphQLObjectType = isGraphQLObjectType;
//# sourceMappingURL=utils.js.map