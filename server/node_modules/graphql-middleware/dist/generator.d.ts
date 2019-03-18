import { IMiddlewareGeneratorConstructor, IMiddleware, IMiddlewareGenerator } from './types';
import { GraphQLSchema } from 'graphql';
export declare class MiddlewareGenerator<TSource, TContext, TArgs> implements IMiddlewareGenerator<TSource, TContext, TArgs> {
    private generator;
    constructor(generator: IMiddlewareGeneratorConstructor<TSource, TContext, TArgs>);
    generate(schema: GraphQLSchema): IMiddleware<TSource, TContext, TArgs>;
}
