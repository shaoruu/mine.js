import { IMiddlewareGenerator, IMiddlewareGeneratorConstructor } from './types';
export declare function middleware<TSource = any, TContext = any, TArgs = any>(generator: IMiddlewareGeneratorConstructor<TSource, TContext, TArgs>): IMiddlewareGenerator<TSource, TContext, TArgs>;
