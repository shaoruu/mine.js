"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_binding_1 = require("graphql-binding");
var graphql_1 = require("graphql");
var utils_1 = require("./utils");
var PrismaFlowGenerator = /** @class */ (function (_super) {
    __extends(PrismaFlowGenerator, _super);
    function PrismaFlowGenerator(options) {
        return _super.call(this, options) || this;
    }
    PrismaFlowGenerator.prototype.render = function () {
        return this.compile(templateObject_1 || (templateObject_1 = __makeTemplateObject(["/**\n * @flow\n */\n", "\n\nexport interface Query ", "\n\nexport interface Mutation ", "\n\nexport interface Subscription ", "\n\nexport interface Exists ", "\n\ninterface Prisma {\n  query: Query;\n  mutation: Mutation;\n  subscription: Subscription;\n  exists: Exists;\n  request(query: string, variables?: {[key: string]: any}): Promise<any>;\n  delegate(operation: 'query' | 'mutation', fieldName: string, args: {\n    [key: string]: any;\n}, infoOrQuery?: GraphQLResolveInfo | string, options?: Options): Promise<any>;\ndelegateSubscription(fieldName: string, args?: {\n    [key: string]: any;\n}, infoOrQuery?: GraphQLResolveInfo | string, options?: Options): Promise<AsyncIterator<any>>;\ngetAbstractResolvers(filterSchema?: GraphQLSchema | string): IResolvers;\n}\n\nexport interface BindingConstructor<T> {\n  new(options: BPOType): T\n}\n/**\n * Type Defs\n*/\n\n", "\n\n", "\n\n/**\n * Types\n*/\n\n", ""], ["\\\n/**\n * @flow\n */\n", "\n\nexport interface Query ", "\n\nexport interface Mutation ", "\n\nexport interface Subscription ", "\n\nexport interface Exists ", "\n\ninterface Prisma {\n  query: Query;\n  mutation: Mutation;\n  subscription: Subscription;\n  exists: Exists;\n  request(query: string, variables?: {[key: string]: any}): Promise<any>;\n  delegate(operation: 'query' | 'mutation', fieldName: string, args: {\n    [key: string]: any;\n}, infoOrQuery?: GraphQLResolveInfo | string, options?: Options): Promise<any>;\ndelegateSubscription(fieldName: string, args?: {\n    [key: string]: any;\n}, infoOrQuery?: GraphQLResolveInfo | string, options?: Options): Promise<AsyncIterator<any>>;\ngetAbstractResolvers(filterSchema?: GraphQLSchema | string): IResolvers;\n}\n\nexport interface BindingConstructor<T> {\n  new(options: BPOType): T\n}\n/**\n * Type Defs\n*/\n\n", "\n\n", "\n\n/**\n * Types\n*/\n\n", ""])), this.renderImports(), this.renderQueries(), this.renderMutations(), this.renderSubscriptions(), this.renderExists(), this.renderTypedefs(), this.renderExports(), this.renderTypes());
    };
    PrismaFlowGenerator.prototype.renderImports = function () {
        return "import type { GraphQLResolveInfo, GraphQLSchema } from 'graphql'\nimport type { IResolvers } from 'graphql-tools/dist/Interfaces'\nimport type { Options } from 'graphql-binding'\nimport type { BasePrismaOptions as BPOType } from 'prisma-binding'\nimport { makePrismaBindingClass, BasePrismaOptions } from 'prisma-binding'";
    };
    PrismaFlowGenerator.prototype.renderExports = function () {
        return "const prisma: BindingConstructor<Prisma> = makePrismaBindingClass({typeDefs})\nexport { prisma as Prisma } \n";
    };
    PrismaFlowGenerator.prototype.renderTypedefs = function () {
        return ('const typeDefs = `' + graphql_1.printSchema(this.schema).replace(/`/g, '\\`') + '`');
    };
    PrismaFlowGenerator.prototype.renderExists = function () {
        var queryType = this.schema.getQueryType();
        if (queryType) {
            return "{\n" + utils_1.getExistsFlowTypes(queryType) + "\n}";
        }
        return '{}';
    };
    return PrismaFlowGenerator;
}(graphql_binding_1.FlowGenerator));
exports.PrismaFlowGenerator = PrismaFlowGenerator;
var templateObject_1;
//# sourceMappingURL=PrismaFlowGenerator.js.map