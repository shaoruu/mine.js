/// <reference types="node" />
import { Server as HttpServer } from 'http';
import { GraphQLServerOptions as GraphQLOptions } from './graphqlOptions';
import { Config, SubscriptionServerOptions, FileUploadOptions } from './types';
import { PlaygroundRenderPageOptions } from './playground';
export declare class ApolloServerBase {
    subscriptionsPath?: string;
    graphqlPath: string;
    requestOptions: Partial<GraphQLOptions<any>>;
    private schema;
    private context?;
    private engineReportingAgent?;
    private extensions;
    protected subscriptionServerOptions?: SubscriptionServerOptions;
    protected uploadsConfig?: FileUploadOptions;
    private subscriptionServer?;
    protected playgroundOptions?: PlaygroundRenderPageOptions;
    constructor(config: Config);
    setGraphQLPath(path: string): void;
    stop(): Promise<void>;
    installSubscriptionHandlers(server: HttpServer): void;
    protected supportsSubscriptions(): boolean;
    protected supportsUploads(): boolean;
    protected graphQLServerOptions(integrationContextArgument?: Record<string, any>): Promise<GraphQLOptions<Record<string, any> | (() => Record<string, any> | Promise<Record<string, any>>)>>;
}
//# sourceMappingURL=ApolloServer.d.ts.map