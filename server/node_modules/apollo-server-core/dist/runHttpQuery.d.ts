import { default as GraphQLOptions } from './graphqlOptions';
export interface HttpQueryRequest {
    method: string;
    query: Record<string, any>;
    options: GraphQLOptions | Function;
}
export declare class HttpQueryError extends Error {
    statusCode: number;
    isGraphQLError: boolean;
    headers: {
        [key: string]: string;
    };
    constructor(statusCode: number, message: string, isGraphQLError?: boolean, headers?: {
        [key: string]: string;
    });
}
export declare function runHttpQuery(handlerArguments: Array<any>, request: HttpQueryRequest): Promise<string>;
