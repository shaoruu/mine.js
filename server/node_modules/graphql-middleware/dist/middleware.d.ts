import { GraphQLSchema } from 'graphql';
import { IApplyOptions, IMiddleware, FragmentReplacement, IMiddlewareGenerator, GraphQLSchemaWithFragmentReplacements } from './types';
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
export declare function addMiddlewareToSchema<TSource, TContext, TArgs>(schema: GraphQLSchema, options: IApplyOptions, middleware: IMiddleware<TSource, TContext, TArgs>): {
    schema: GraphQLSchema;
    fragmentReplacements: FragmentReplacement[];
};
/**
 *
 * @param schema
 * @param middlewares
 *
 * Apply middleware to resolvers and return generated schema.
 *
 */
export declare function applyMiddleware<TSource = any, TContext = any, TArgs = any>(schema: GraphQLSchema, ...middlewares: (IMiddleware<TSource, TContext, TArgs> | IMiddlewareGenerator<TSource, TContext, TArgs>)[]): GraphQLSchemaWithFragmentReplacements;
/**
 *
 * @param schema
 * @param middlewares
 *
 * Apply middleware to declared resolvers and return new schema.
 *
 */
export declare function applyMiddlewareToDeclaredResolvers<TSource = any, TContext = any, TArgs = any>(schema: GraphQLSchema, ...middlewares: (IMiddleware<TSource, TContext, TArgs> | IMiddlewareGenerator<TSource, TContext, TArgs>)[]): GraphQLSchemaWithFragmentReplacements;
