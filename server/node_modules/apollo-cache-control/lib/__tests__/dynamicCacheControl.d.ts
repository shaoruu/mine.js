import { GraphQLScalarType, GraphQLFieldResolver, GraphQLTypeResolver, GraphQLIsTypeOfFn } from 'graphql';
export interface GraphQLResolvers {
    [fieldName: string]: (() => any) | GraphQLResolverObject | GraphQLScalarType;
}
export declare type GraphQLResolverObject = {
    [fieldName: string]: GraphQLFieldResolver<any, any> | GraphQLResolverOptions;
};
export interface GraphQLResolverOptions {
    resolve?: GraphQLFieldResolver<any, any>;
    subscribe?: GraphQLFieldResolver<any, any>;
    __resolveType?: GraphQLTypeResolver<any, any>;
    __isTypeOf?: GraphQLIsTypeOfFn<any, any>;
}
