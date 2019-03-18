"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var CacheScope;
(function (CacheScope) {
    CacheScope["Public"] = "PUBLIC";
    CacheScope["Private"] = "PRIVATE";
})(CacheScope = exports.CacheScope || (exports.CacheScope = {}));
var CacheControlExtension = /** @class */ (function () {
    function CacheControlExtension(options) {
        if (options === void 0) { options = {}; }
        this.hints = new Map();
        this.defaultMaxAge = options.defaultMaxAge || 0;
    }
    CacheControlExtension.prototype.willResolveField = function (_source, _args, _context, info) {
        var _this = this;
        var hint = {};
        // If this field's resolver returns an object or interface, look for hints
        // on that return type.
        var targetType = graphql_1.getNamedType(info.returnType);
        if (targetType instanceof graphql_1.GraphQLObjectType
            || targetType instanceof graphql_1.GraphQLInterfaceType) {
            if (targetType.astNode) {
                hint = mergeHints(hint, cacheHintFromDirectives(targetType.astNode.directives));
            }
        }
        // If this field is a field on an object, look for hints on the field
        // itself, taking precedence over previously calculated hints.
        var parentType = info.parentType;
        if (parentType instanceof graphql_1.GraphQLObjectType) {
            var fieldDef = parentType.getFields()[info.fieldName];
            if (fieldDef.astNode) {
                hint = mergeHints(hint, cacheHintFromDirectives(fieldDef.astNode.directives));
            }
        }
        // If this resolver returns an object and we haven't seen an explicit maxAge
        // hint, set the maxAge to 0 (uncached) or the default if specified in the
        // constructor.  (Non-object fields by default are assumed to inherit their
        // cacheability from their parents.)
        if (targetType instanceof graphql_1.GraphQLObjectType && hint.maxAge === undefined) {
            hint.maxAge = this.defaultMaxAge;
        }
        if (hint.maxAge !== undefined || hint.scope !== undefined) {
            this.addHint(info.path, hint);
        }
        info.cacheControl = {
            setCacheHint: function (hint) {
                _this.addHint(info.path, hint);
            },
            cacheHint: hint
        };
    };
    CacheControlExtension.prototype.addHint = function (path, hint) {
        var existingCacheHint = this.hints.get(path);
        if (existingCacheHint) {
            this.hints.set(path, mergeHints(existingCacheHint, hint));
        }
        else {
            this.hints.set(path, hint);
        }
    };
    CacheControlExtension.prototype.format = function () {
        return [
            'cacheControl',
            {
                version: 1,
                hints: Array.from(this.hints).map(function (_a) {
                    var path = _a[0], hint = _a[1];
                    return (__assign({ path: graphql_1.responsePathAsArray(path) }, hint));
                })
            }
        ];
    };
    return CacheControlExtension;
}());
exports.CacheControlExtension = CacheControlExtension;
function cacheHintFromDirectives(directives) {
    if (!directives)
        return undefined;
    var cacheControlDirective = directives.find(function (directive) { return directive.name.value === 'cacheControl'; });
    if (!cacheControlDirective)
        return undefined;
    if (!cacheControlDirective.arguments)
        return undefined;
    var maxAgeArgument = cacheControlDirective.arguments.find(function (argument) { return argument.name.value === 'maxAge'; });
    var scopeArgument = cacheControlDirective.arguments.find(function (argument) { return argument.name.value === 'scope'; });
    // TODO: Add proper typechecking of arguments
    return {
        maxAge: maxAgeArgument && maxAgeArgument.value && maxAgeArgument.value.kind === 'IntValue'
            ? parseInt(maxAgeArgument.value.value)
            : undefined,
        scope: scopeArgument && scopeArgument.value && scopeArgument.value.kind === 'EnumValue'
            ? scopeArgument.value.value
            : undefined
    };
}
function mergeHints(hint, otherHint) {
    if (!otherHint)
        return hint;
    return {
        maxAge: otherHint.maxAge !== undefined ? otherHint.maxAge : hint.maxAge,
        scope: otherHint.scope || hint.scope
    };
}
//# sourceMappingURL=index.js.map