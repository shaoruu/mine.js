import { GraphQLSchema } from 'graphql';
import { IApplyOptions, IMiddleware, IResolvers } from './types';
export declare function generateResolverFromSchemaAndMiddleware<TSource, TContext, TArgs>(schema: GraphQLSchema, options: IApplyOptions, middleware: IMiddleware<TSource, TContext, TArgs>): IResolvers;
