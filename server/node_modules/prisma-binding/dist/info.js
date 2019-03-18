"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
function buildExistsInfo(rootFieldName, schema) {
    var queryType = schema.getQueryType() || undefined;
    var type = queryType.getFields()[rootFieldName].type;
    // make sure that just list types are queried
    if (!graphql_1.isNonNullType(type) || !graphql_1.isListType(type.ofType)) {
        throw new Error("Invalid exist query: " + rootFieldName);
    }
    var fieldNode = {
        kind: 'Field',
        name: { kind: 'Name', value: rootFieldName },
        selectionSet: {
            kind: 'SelectionSet',
            selections: [
                {
                    kind: 'Field',
                    name: { kind: 'Name', value: 'id' },
                },
            ],
        },
    };
    return {
        fieldNodes: [fieldNode],
        fragments: {},
        schema: schema,
        fieldName: rootFieldName,
        returnType: type,
        parentType: queryType,
        path: undefined,
        rootValue: null,
        operation: {
            kind: 'OperationDefinition',
            operation: 'query',
            selectionSet: { kind: 'SelectionSet', selections: [] },
            variableDefinitions: [],
        },
        variableValues: {},
    };
}
exports.buildExistsInfo = buildExistsInfo;
//# sourceMappingURL=info.js.map