import * as express from 'express';
import { GraphQLOptions } from 'apollo-server-core';
import * as GraphiQL from 'apollo-server-module-graphiql';
export interface ExpressGraphQLOptionsFunction {
    (req?: express.Request, res?: express.Response): GraphQLOptions | Promise<GraphQLOptions>;
}
export interface ExpressHandler {
    (req: express.Request, res: express.Response, next: any): void;
}
export declare function graphqlExpress(options: GraphQLOptions | ExpressGraphQLOptionsFunction): ExpressHandler;
export interface ExpressGraphiQLOptionsFunction {
    (req?: express.Request): GraphiQL.GraphiQLData | Promise<GraphiQL.GraphiQLData>;
}
export declare function graphiqlExpress(options: GraphiQL.GraphiQLData | ExpressGraphiQLOptionsFunction): (req: express.Request, res: express.Response, next: any) => void;
