import { GraphiQLData } from './renderGraphiQL';
export declare type GraphiQLParams = {
    query?: string;
    variables?: string;
    operationName?: string;
};
export declare function resolveGraphiQLString(query: any, options: GraphiQLData | Function, ...args: any[]): Promise<string>;
