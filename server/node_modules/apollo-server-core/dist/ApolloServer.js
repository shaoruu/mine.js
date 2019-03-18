"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tools_1 = require("graphql-tools");
const graphql_1 = require("graphql");
const apollo_engine_reporting_1 = require("apollo-engine-reporting");
const apollo_server_caching_1 = require("apollo-server-caching");
const apollo_upload_server_1 = require("apollo-upload-server");
const subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
const apollo_server_errors_1 = require("apollo-server-errors");
const formatters_1 = require("./formatters");
const index_1 = require("./index");
const playground_1 = require("./playground");
const NoIntrospection = (context) => ({
    Field(node) {
        if (node.name.value === '__schema' || node.name.value === '__type') {
            context.reportError(new graphql_1.GraphQLError('GraphQL introspection is not allowed by Apollo Server, but the query contained __schema or __type. To enable introspection, pass introspection: true to ApolloServer in production', [node]));
        }
    },
});
class ApolloServerBase {
    constructor(config) {
        this.graphqlPath = '/graphql';
        if (!config)
            throw new Error('ApolloServer requires options.');
        const { context, resolvers, schema, schemaDirectives, typeDefs, introspection, mocks, extensions, engine, subscriptions, uploads, playground } = config, requestOptions = __rest(config, ["context", "resolvers", "schema", "schemaDirectives", "typeDefs", "introspection", "mocks", "extensions", "engine", "subscriptions", "uploads", "playground"]);
        const isDev = process.env.NODE_ENV !== 'production';
        if ((typeof introspection === 'boolean' && !introspection) ||
            (introspection === undefined && !isDev)) {
            const noIntro = [NoIntrospection];
            requestOptions.validationRules = requestOptions.validationRules
                ? requestOptions.validationRules.concat(noIntro)
                : noIntro;
        }
        if (!requestOptions.cache) {
            requestOptions.cache = new apollo_server_caching_1.InMemoryLRUCache();
        }
        if (requestOptions.persistedQueries !== false) {
            if (!requestOptions.persistedQueries) {
                requestOptions.persistedQueries = {
                    cache: requestOptions.cache,
                };
            }
        }
        else {
            delete requestOptions.persistedQueries;
        }
        this.requestOptions = requestOptions;
        this.context = context;
        if (uploads !== false) {
            if (this.supportsUploads()) {
                if (uploads === true || typeof uploads === 'undefined') {
                    this.uploadsConfig = {};
                }
                else {
                    this.uploadsConfig = uploads;
                }
            }
            else if (uploads) {
                throw new Error('This implementation of ApolloServer does not support file uploads because the environmnet cannot accept multi-part forms');
            }
        }
        if (this.uploadsConfig) {
            if (resolvers && !resolvers.Upload) {
                resolvers.Upload = apollo_upload_server_1.GraphQLUpload;
            }
        }
        if (schema) {
            this.schema = schema;
        }
        else {
            if (!typeDefs) {
                throw Error('Apollo Server requires either an existing schema or typeDefs');
            }
            this.schema = graphql_tools_1.makeExecutableSchema({
                typeDefs: this.uploadsConfig
                    ? [
                        index_1.gql `
                scalar Upload
              `,
                    ].concat(typeDefs)
                    : typeDefs,
                schemaDirectives,
                resolvers,
            });
        }
        if (mocks) {
            graphql_tools_1.addMockFunctionsToSchema({
                schema: this.schema,
                preserveResolvers: true,
                mocks: typeof mocks === 'boolean' ? {} : mocks,
            });
        }
        this.extensions = [];
        if (this.requestOptions.formatError) {
            this.extensions.push(() => new formatters_1.FormatErrorExtension(this.requestOptions.formatError, this.requestOptions.debug));
        }
        if (engine || (engine !== false && process.env.ENGINE_API_KEY)) {
            this.engineReportingAgent = new apollo_engine_reporting_1.EngineReportingAgent(engine === true ? {} : engine);
            this.extensions.push(() => this.engineReportingAgent.newExtension());
        }
        if (extensions) {
            this.extensions = [...this.extensions, ...extensions];
        }
        if (subscriptions !== false) {
            if (this.supportsSubscriptions()) {
                if (subscriptions === true || typeof subscriptions === 'undefined') {
                    this.subscriptionServerOptions = {
                        path: this.graphqlPath,
                    };
                }
                else if (typeof subscriptions === 'string') {
                    this.subscriptionServerOptions = { path: subscriptions };
                }
                else {
                    this.subscriptionServerOptions = Object.assign({ path: this.graphqlPath }, subscriptions);
                }
                this.subscriptionsPath = this.subscriptionServerOptions.path;
            }
            else if (subscriptions) {
                throw new Error('This implementation of ApolloServer does not support GraphQL subscriptions.');
            }
        }
        this.playgroundOptions = playground_1.createPlaygroundOptions(playground);
    }
    setGraphQLPath(path) {
        this.graphqlPath = path;
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.subscriptionServer)
                yield this.subscriptionServer.close();
            if (this.engineReportingAgent) {
                this.engineReportingAgent.stop();
                yield this.engineReportingAgent.sendReport();
            }
        });
    }
    installSubscriptionHandlers(server) {
        if (!this.subscriptionServerOptions) {
            if (this.supportsSubscriptions()) {
                throw Error('Subscriptions are disabled, due to subscriptions set to false in the ApolloServer constructor');
            }
            else {
                throw Error('Subscriptions are not supported, choose an integration, such as apollo-server-express that allows persistent connections');
            }
        }
        const { onDisconnect, onConnect, keepAlive, path, } = this.subscriptionServerOptions;
        this.subscriptionServer = subscriptions_transport_ws_1.SubscriptionServer.create({
            schema: this.schema,
            execute: graphql_1.execute,
            subscribe: graphql_1.subscribe,
            onConnect: onConnect
                ? onConnect
                : (connectionParams) => (Object.assign({}, connectionParams)),
            onDisconnect: onDisconnect,
            onOperation: (_, connection) => __awaiter(this, void 0, void 0, function* () {
                connection.formatResponse = (value) => (Object.assign({}, value, { errors: value.errors &&
                        apollo_server_errors_1.formatApolloErrors([...value.errors], {
                            formatter: this.requestOptions.formatError,
                            debug: this.requestOptions.debug,
                        }) }));
                let context = this.context ? this.context : { connection };
                try {
                    context =
                        typeof this.context === 'function'
                            ? yield this.context({ connection })
                            : context;
                }
                catch (e) {
                    throw apollo_server_errors_1.formatApolloErrors([e], {
                        formatter: this.requestOptions.formatError,
                        debug: this.requestOptions.debug,
                    })[0];
                }
                return Object.assign({}, connection, { context });
            }),
            keepAlive,
        }, {
            server,
            path,
        });
    }
    supportsSubscriptions() {
        return false;
    }
    supportsUploads() {
        return false;
    }
    graphQLServerOptions(integrationContextArgument) {
        return __awaiter(this, void 0, void 0, function* () {
            let context = this.context ? this.context : {};
            try {
                context =
                    typeof this.context === 'function'
                        ? yield this.context(integrationContextArgument || {})
                        : context;
            }
            catch (error) {
                context = () => {
                    throw error;
                };
            }
            return Object.assign({ schema: this.schema, extensions: this.extensions, context, persistedQueries: this.requestOptions
                    .persistedQueries, fieldResolver: this.requestOptions.fieldResolver }, this.requestOptions);
        });
    }
}
exports.ApolloServerBase = ApolloServerBase;
//# sourceMappingURL=ApolloServer.js.map