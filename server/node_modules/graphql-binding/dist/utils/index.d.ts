import { GraphQLSchema, GraphQLResolveInfo, GraphQLOutputType } from 'graphql';
import { Operation } from '../types';
export declare function isScalar(t: GraphQLOutputType): boolean;
export declare function getTypeForRootFieldName(rootFieldName: string, operation: Operation, schema: GraphQLSchema): GraphQLOutputType;
export declare function forwardTo(bindingName: string): <PARENT, ARGS, CONTEXT>(parent: PARENT, args: ARGS, context: CONTEXT, info: GraphQLResolveInfo) => any;
export declare function printDocumentFromInfo(info: GraphQLResolveInfo): string;
