"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tools_1 = require("graphql-tools");
var applicator_1 = require("./applicator");
var validation_1 = require("./validation");
var fragments_1 = require("./fragments");
var utils_1 = require("./utils");
/**
 *
 * @param schema
 * @param options
 * @param middleware
 *
 * Validates middleware and generates resolvers map for provided middleware.
 * Applies middleware to the current schema and returns the modified one.
 *
 */
function addMiddlewareToSchema(schema, options, middleware) {
    var validMiddleware = validation_1.validateMiddleware(schema, middleware);
    var resolvers = applicator_1.generateResolverFromSchemaAndMiddleware(schema, options, validMiddleware);
    var fragmentReplacements = fragments_1.extractFragmentReplacements(resolvers);
    graphql_tools_1.addResolveFunctionsToSchema({
        schema: schema,
        resolvers: resolvers,
        resolverValidationOptions: {
            requireResolversForResolveType: false,
        },
    });
    return { schema: schema, fragmentReplacements: fragmentReplacements };
}
exports.addMiddlewareToSchema = addMiddlewareToSchema;
/**
 *
 * @param schema
 * @param options
 * @param middlewares
 *
 * Generates middleware from middleware generators and applies middleware to
 * resolvers. Returns generated schema with all provided middleware.
 *
 */
function applyMiddlewareWithOptions(schema, options) {
    var middlewares = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        middlewares[_i - 2] = arguments[_i];
    }
    var normalisedMiddlewares = middlewares.map(function (middleware) {
        if (utils_1.isMiddlewareGenerator(middleware)) {
            return middleware.generate(schema);
        }
        else {
            return middleware;
        }
    });
    var schemaWithMiddlewareAndFragmentReplacements = normalisedMiddlewares.reduceRight(function (_a, middleware) {
        var currentSchema = _a.schema, currentFragmentReplacements = _a.fragmentReplacements;
        var _b = addMiddlewareToSchema(currentSchema, options, middleware), newSchema = _b.schema, newFragmentReplacements = _b.fragmentReplacements;
        return {
            schema: newSchema,
            fragmentReplacements: currentFragmentReplacements.concat(newFragmentReplacements),
        };
    }, { schema: schema, fragmentReplacements: [] });
    var schemaWithMiddleware = schemaWithMiddlewareAndFragmentReplacements.schema;
    schemaWithMiddleware.schema =
        schemaWithMiddlewareAndFragmentReplacements.schema;
    schemaWithMiddleware.fragmentReplacements =
        schemaWithMiddlewareAndFragmentReplacements.fragmentReplacements;
    return schemaWithMiddleware;
}
// Exposed functions
/**
 *
 * @param schema
 * @param middlewares
 *
 * Apply middleware to resolvers and return generated schema.
 *
 */
function applyMiddleware(schema) {
    var middlewares = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        middlewares[_i - 1] = arguments[_i];
    }
    return applyMiddlewareWithOptions.apply(void 0, [schema,
        { onlyDeclaredResolvers: false }].concat(middlewares));
}
exports.applyMiddleware = applyMiddleware;
/**
 *
 * @param schema
 * @param middlewares
 *
 * Apply middleware to declared resolvers and return new schema.
 *
 */
function applyMiddlewareToDeclaredResolvers(schema) {
    var middlewares = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        middlewares[_i - 1] = arguments[_i];
    }
    return applyMiddlewareWithOptions.apply(void 0, [schema,
        { onlyDeclaredResolvers: true }].concat(middlewares));
}
exports.applyMiddlewareToDeclaredResolvers = applyMiddlewareToDeclaredResolvers;
//# sourceMappingURL=middleware.js.map