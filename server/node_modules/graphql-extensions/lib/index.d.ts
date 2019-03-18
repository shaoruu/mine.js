import { GraphQLSchema, GraphQLField, GraphQLResolveInfo } from 'graphql';
export declare class GraphQLExtension<TContext = any> {
    requestDidStart?(): void;
    parsingDidStart?(): void;
    parsingDidEnd?(): void;
    validationDidStart?(): void;
    validationDidEnd?(): void;
    executionDidStart?(): void;
    willResolveField?(source: any, args: {
        [argName: string]: any;
    }, context: TContext, info: GraphQLResolveInfo): ((result: any) => void) | void;
    executionDidEnd?(): void;
    requestDidEnd?(): void;
    format?(): [string, any] | undefined;
}
export declare class GraphQLExtensionStack<TContext = any> {
    private extensions;
    constructor(extensions: (typeof GraphQLExtension | GraphQLExtension)[]);
    requestDidStart(): void;
    parsingDidStart(): void;
    parsingDidEnd(): void;
    validationDidStart(): void;
    validationDidEnd(): void;
    executionDidStart(): void;
    willResolveField(source: any, args: {
        [argName: string]: any;
    }, context: TContext, info: GraphQLResolveInfo): (result: any) => void;
    executionDidEnd(): void;
    requestDidEnd(): void;
    format(): {};
}
export declare function enableGraphQLExtensions(schema: GraphQLSchema & {
    _extensionsEnabled?: boolean;
}): GraphQLSchema & {
    _extensionsEnabled?: boolean | undefined;
};
export declare type FieldIteratorFn = (fieldDef: GraphQLField<any, any>, typeName: string, fieldName: string) => void;
