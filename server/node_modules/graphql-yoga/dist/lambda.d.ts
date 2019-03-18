import { GraphQLSchema } from 'graphql';
import { LambdaOptions, LambdaProps } from './types';
export declare class GraphQLServerLambda {
    options: LambdaOptions;
    executableSchema: GraphQLSchema;
    protected context: any;
    private middlewareFragmentReplacements;
    constructor(props: LambdaProps);
    graphqlHandler: (event: any, context: any, callback: any) => void;
    playgroundHandler: (event: any, lambdaContext: any, callback: any) => void;
    handler: (event: any, lambdaContext: any, callback: any) => void;
}
