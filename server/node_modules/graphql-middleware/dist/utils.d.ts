import { GraphQLObjectType, GraphQLInterfaceType } from 'graphql';
import { IMiddlewareResolver, IMiddlewareWithOptions, IMiddlewareFunction, IMiddlewareGenerator } from './types';
export declare function isMiddlewareResolver<TSource, TContext, TArgs>(obj: any): obj is IMiddlewareResolver<TSource, TContext, TArgs>;
export declare function isMiddlewareWithFragment<TSource, TContext, TArgs>(obj: any): obj is IMiddlewareWithOptions<TSource, TContext, TArgs>;
export declare function isMiddlewareFunction<TSource, TContext, TArgs>(obj: any): obj is IMiddlewareFunction<TSource, TContext, TArgs>;
export declare function isMiddlewareGenerator<TSource, TContext, TArgs>(x: any): x is IMiddlewareGenerator<TSource, TContext, TArgs>;
export declare function isGraphQLObjectType(obj: any): obj is GraphQLObjectType | GraphQLInterfaceType;
