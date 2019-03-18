"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var GraphQLExtension = /** @class */ (function () {
    function GraphQLExtension() {
    }
    return GraphQLExtension;
}());
exports.GraphQLExtension = GraphQLExtension;
var GraphQLExtensionStack = /** @class */ (function () {
    function GraphQLExtensionStack(extensions) {
        this.extensions = extensions.map(function (extension) {
            return typeof extension === 'function' ? new extension() : extension;
        });
    }
    GraphQLExtensionStack.prototype.requestDidStart = function () {
        for (var _i = 0, _a = this.extensions; _i < _a.length; _i++) {
            var extension = _a[_i];
            if (extension.requestDidStart) {
                extension.requestDidStart();
            }
        }
    };
    GraphQLExtensionStack.prototype.parsingDidStart = function () {
        for (var _i = 0, _a = this.extensions; _i < _a.length; _i++) {
            var extension = _a[_i];
            if (extension.parsingDidStart) {
                extension.parsingDidStart();
            }
        }
    };
    GraphQLExtensionStack.prototype.parsingDidEnd = function () {
        for (var _i = 0, _a = this.extensions; _i < _a.length; _i++) {
            var extension = _a[_i];
            if (extension.parsingDidEnd) {
                extension.parsingDidEnd();
            }
        }
    };
    GraphQLExtensionStack.prototype.validationDidStart = function () {
        for (var _i = 0, _a = this.extensions; _i < _a.length; _i++) {
            var extension = _a[_i];
            if (extension.validationDidStart) {
                extension.validationDidStart();
            }
        }
    };
    GraphQLExtensionStack.prototype.validationDidEnd = function () {
        for (var _i = 0, _a = this.extensions; _i < _a.length; _i++) {
            var extension = _a[_i];
            if (extension.validationDidEnd) {
                extension.validationDidEnd();
            }
        }
    };
    GraphQLExtensionStack.prototype.executionDidStart = function () {
        for (var _i = 0, _a = this.extensions; _i < _a.length; _i++) {
            var extension = _a[_i];
            if (extension.executionDidStart) {
                extension.executionDidStart();
            }
        }
    };
    GraphQLExtensionStack.prototype.willResolveField = function (source, args, context, info) {
        var handlers = this.extensions
            .map(function (extension) { return extension.willResolveField && extension.willResolveField(source, args, context, info); })
            .filter(function (x) { return x; });
        return function (result) {
            for (var _i = 0, handlers_1 = handlers; _i < handlers_1.length; _i++) {
                var handler = handlers_1[_i];
                handler(result);
            }
        };
    };
    GraphQLExtensionStack.prototype.executionDidEnd = function () {
        for (var _i = 0, _a = this.extensions; _i < _a.length; _i++) {
            var extension = _a[_i];
            if (extension.executionDidEnd) {
                extension.executionDidEnd();
            }
        }
    };
    GraphQLExtensionStack.prototype.requestDidEnd = function () {
        for (var _i = 0, _a = this.extensions; _i < _a.length; _i++) {
            var extension = _a[_i];
            if (extension.requestDidEnd) {
                extension.requestDidEnd();
            }
        }
    };
    GraphQLExtensionStack.prototype.format = function () {
        return this.extensions.map(function (extension) { return extension.format && extension.format(); }).filter(function (x) { return x; }).reduce(function (extensions, _a) {
            var key = _a[0], value = _a[1];
            return Object.assign(extensions, (_b = {}, _b[key] = value, _b));
            var _b;
        }, {});
    };
    return GraphQLExtensionStack;
}());
exports.GraphQLExtensionStack = GraphQLExtensionStack;
function enableGraphQLExtensions(schema) {
    if (schema._extensionsEnabled) {
        return schema;
    }
    schema._extensionsEnabled = true;
    forEachField(schema, wrapField);
    return schema;
}
exports.enableGraphQLExtensions = enableGraphQLExtensions;
function wrapField(field) {
    var fieldResolver = field.resolve;
    field.resolve = function (source, args, context, info) {
        var extensionStack = context && context._extensionStack;
        var handler = extensionStack && extensionStack.willResolveField(source, args, context, info);
        // If no resolver has been defined for a field, use the default field resolver
        // (which matches the behavior of graphql-js when there is no explicit resolve function defined).
        // TODO: Find a way to respect custom field resolvers, see https://github.com/graphql/graphql-js/pull/865
        try {
            var result_1 = (fieldResolver || graphql_1.defaultFieldResolver)(source, args, context, info);
            whenResultIsFinished(result_1, function () {
                handler && handler(result_1);
            });
            return result_1;
        }
        catch (error) {
            handler && handler();
            throw error;
        }
    };
}
function whenResultIsFinished(result, callback) {
    if (result === null || typeof result === 'undefined') {
        callback();
    }
    else if (typeof result.then === 'function') {
        result.then(callback, callback);
    }
    else if (Array.isArray(result)) {
        var promises_1 = [];
        result.forEach(function (value) {
            if (value && typeof value.then === 'function') {
                promises_1.push(value);
            }
        });
        if (promises_1.length > 0) {
            Promise.all(promises_1).then(callback, callback);
        }
        else {
            callback();
        }
    }
    else {
        callback();
    }
}
function forEachField(schema, fn) {
    var typeMap = schema.getTypeMap();
    Object.keys(typeMap).forEach(function (typeName) {
        var type = typeMap[typeName];
        if (!graphql_1.getNamedType(type).name.startsWith('__') && type instanceof graphql_1.GraphQLObjectType) {
            var fields_1 = type.getFields();
            Object.keys(fields_1).forEach(function (fieldName) {
                var field = fields_1[fieldName];
                fn(field, typeName, fieldName);
            });
        }
    });
}
//# sourceMappingURL=index.js.map