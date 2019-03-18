/// <reference types="node" />
import * as express from 'express';
import { PathParams, RequestHandlerParams } from 'express-serve-static-core';
import { GraphQLSchema } from 'graphql';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { SubscriptionServerOptions, Options, OptionsWithHttps, OptionsWithoutHttps, Props } from './types';
export { MockList } from 'graphql-tools';
export { PubSub, withFilter } from 'graphql-subscriptions';
export { Options, OptionsWithHttps, OptionsWithoutHttps };
export { GraphQLServerLambda } from './lambda';
export declare class GraphQLServer {
    express: express.Application;
    subscriptionServer: SubscriptionServer | null;
    subscriptionServerOptions: SubscriptionServerOptions | null;
    options: Options;
    executableSchema: GraphQLSchema;
    context: any;
    private middlewareFragmentReplacements;
    private middlewares;
    constructor(props: Props);
    use(...handlers: RequestHandlerParams[]): this;
    use(path: PathParams, ...handlers: RequestHandlerParams[]): this;
    get(path: PathParams, ...handlers: RequestHandlerParams[]): this;
    post(path: PathParams, ...handlers: RequestHandlerParams[]): this;
    createHttpServer(options: OptionsWithoutHttps): HttpServer;
    createHttpServer(options: OptionsWithHttps): HttpsServer;
    start(options: Options, callback?: ((options: Options) => void)): Promise<HttpServer | HttpsServer>;
    start(callback?: ((options: Options) => void)): Promise<HttpServer | HttpsServer>;
    private createSubscriptionServer;
}
