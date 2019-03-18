"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const corsMiddleware = require("cors");
const body_parser_1 = require("body-parser");
const graphql_playground_html_1 = require("@apollographql/graphql-playground-html");
const apollo_server_core_1 = require("apollo-server-core");
const accepts = require("accepts");
const typeis = require("type-is");
const expressApollo_1 = require("./expressApollo");
const apollo_upload_server_1 = require("apollo-upload-server");
var apollo_server_core_2 = require("apollo-server-core");
exports.GraphQLExtension = apollo_server_core_2.GraphQLExtension;
const fileUploadMiddleware = (uploadsConfig, server) => (req, res, next) => {
    if (typeis(req, ['multipart/form-data'])) {
        apollo_upload_server_1.processRequest(req, uploadsConfig)
            .then(body => {
            req.body = body;
            next();
        })
            .catch(error => {
            if (error.status && error.expose)
                res.status(error.status);
            next(apollo_server_core_1.formatApolloErrors([error], {
                formatter: server.requestOptions.formatError,
                debug: server.requestOptions.debug,
            }));
        });
    }
    else {
        next();
    }
};
class ApolloServer extends apollo_server_core_1.ApolloServerBase {
    createGraphQLServerOptions(req, res) {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            return _super("graphQLServerOptions").call(this, { req, res });
        });
    }
    supportsSubscriptions() {
        return true;
    }
    supportsUploads() {
        return true;
    }
    applyMiddleware({ app, path, cors, bodyParserConfig, disableHealthCheck, onHealthCheck, }) {
        if (!path)
            path = '/graphql';
        if (!disableHealthCheck) {
            app.use('/.well-known/apollo/server-health', (req, res) => {
                res.type('application/health+json');
                if (onHealthCheck) {
                    onHealthCheck(req)
                        .then(() => {
                        res.json({ status: 'pass' });
                    })
                        .catch(() => {
                        res.status(503).json({ status: 'fail' });
                    });
                }
                else {
                    res.json({ status: 'pass' });
                }
            });
        }
        let uploadsMiddleware;
        if (this.uploadsConfig) {
            uploadsMiddleware = fileUploadMiddleware(this.uploadsConfig, this);
        }
        this.graphqlPath = path;
        if (cors === true) {
            app.use(path, corsMiddleware());
        }
        else if (cors !== false) {
            app.use(path, corsMiddleware(cors));
        }
        if (bodyParserConfig === true) {
            app.use(path, body_parser_1.json());
        }
        else if (bodyParserConfig !== false) {
            app.use(path, body_parser_1.json(bodyParserConfig));
        }
        if (uploadsMiddleware) {
            app.use(path, uploadsMiddleware);
        }
        app.use(path, (req, res, next) => {
            if (this.playgroundOptions && req.method === 'GET') {
                const accept = accepts(req);
                const types = accept.types();
                const prefersHTML = types.find((x) => x === 'text/html' || x === 'application/json') === 'text/html';
                if (prefersHTML) {
                    const playgroundRenderPageOptions = Object.assign({ endpoint: path, subscriptionEndpoint: this.subscriptionsPath }, this.playgroundOptions);
                    res.setHeader('Content-Type', 'text/html');
                    const playground = graphql_playground_html_1.renderPlaygroundPage(playgroundRenderPageOptions);
                    res.write(playground);
                    res.end();
                    next();
                    return;
                }
            }
            return expressApollo_1.graphqlExpress(this.createGraphQLServerOptions.bind(this))(req, res, next);
        });
    }
}
exports.ApolloServer = ApolloServer;
exports.registerServer = () => {
    throw new Error('Please use server.applyMiddleware instead of registerServer. This warning will be removed in the next release');
};
//# sourceMappingURL=ApolloServer.js.map