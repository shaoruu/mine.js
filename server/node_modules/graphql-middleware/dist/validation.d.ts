import { GraphQLSchema } from 'graphql';
import { IMiddleware } from './types';
export declare function validateMiddleware<TSource, TContext, TArgs>(schema: GraphQLSchema, middleware: IMiddleware<TSource, TContext, TArgs>): IMiddleware<TSource, TContext, TArgs>;
export declare class MiddlewareError extends Error {
    constructor(...props: any[]);
}
