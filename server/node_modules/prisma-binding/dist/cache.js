"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_import_1 = require("graphql-import");
var graphql_tools_1 = require("graphql-tools");
var typeDefsCache = {};
var remoteSchemaCache = {};
function getCachedTypeDefs(schemaPath, disableCache) {
    if (disableCache === void 0) { disableCache = false; }
    if (typeDefsCache[schemaPath]) {
        return typeDefsCache[schemaPath];
    }
    var schema = graphql_import_1.importSchema(schemaPath);
    if (!disableCache) {
        typeDefsCache[schemaPath] = schema;
    }
    return schema;
}
exports.getCachedTypeDefs = getCachedTypeDefs;
function getCachedRemoteSchema(endpoint, typeDefs, link, disableCache) {
    if (disableCache === void 0) { disableCache = false; }
    if (remoteSchemaCache[endpoint]) {
        return remoteSchemaCache[endpoint];
    }
    var remoteSchema = graphql_tools_1.makeRemoteExecutableSchema({
        link: link,
        schema: typeDefs,
    });
    if (!disableCache) {
        remoteSchemaCache[endpoint] = remoteSchema;
    }
    return remoteSchema;
}
exports.getCachedRemoteSchema = getCachedRemoteSchema;
//# sourceMappingURL=cache.js.map