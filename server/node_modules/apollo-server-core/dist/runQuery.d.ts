import { GraphQLSchema, GraphQLFieldResolver, DocumentNode, GraphQLError, ValidationContext } from 'graphql';
import { CacheControlExtensionOptions } from 'apollo-cache-control';
export interface GraphQLResponse {
    data?: object;
    errors?: Array<GraphQLError & object>;
    extensions?: object;
}
export declare enum LogAction {
    request = 0,
    parse = 1,
    validation = 2,
    execute = 3,
}
export declare enum LogStep {
    start = 0,
    end = 1,
    status = 2,
}
export interface LogMessage {
    action: LogAction;
    step: LogStep;
    key?: string;
    data?: Object;
}
export interface LogFunction {
    (message: LogMessage): any;
}
export interface QueryOptions {
    schema: GraphQLSchema;
    query: string | DocumentNode;
    rootValue?: any;
    context?: any;
    variables?: {
        [key: string]: any;
    };
    operationName?: string;
    logFunction?: LogFunction;
    validationRules?: Array<(context: ValidationContext) => any>;
    fieldResolver?: GraphQLFieldResolver<any, any>;
    formatError?: Function;
    formatResponse?: Function;
    debug?: boolean;
    tracing?: boolean;
    cacheControl?: boolean | CacheControlExtensionOptions;
    skipValidation?: boolean;
}
export declare function runQuery(options: QueryOptions): Promise<GraphQLResponse>;
