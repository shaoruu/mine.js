import { GraphQLSchema, ValidationContext, GraphQLFieldResolver } from 'graphql';
import { LogFunction } from './runQuery';
import { CacheControlExtensionOptions } from 'apollo-cache-control';
export interface GraphQLServerOptions<TContext = any> {
    schema: GraphQLSchema;
    formatError?: Function;
    rootValue?: any;
    context?: TContext;
    logFunction?: LogFunction;
    formatParams?: Function;
    validationRules?: Array<(context: ValidationContext) => any>;
    formatResponse?: Function;
    fieldResolver?: GraphQLFieldResolver<any, TContext>;
    debug?: boolean;
    tracing?: boolean;
    cacheControl?: boolean | CacheControlExtensionOptions;
}
export default GraphQLServerOptions;
export declare function resolveGraphqlOptions(options: GraphQLServerOptions | Function, ...args: any[]): Promise<GraphQLServerOptions>;
