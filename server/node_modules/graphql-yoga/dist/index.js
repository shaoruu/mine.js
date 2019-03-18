"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var apollo_server_express_1 = require("apollo-server-express");
var apollo_upload_server_1 = require("apollo-upload-server");
var bodyParser = require("body-parser-graphql");
var cors = require("cors");
var express = require("express");
var fs = require("fs");
var graphql_1 = require("graphql");
var graphql_import_1 = require("graphql-import");
var graphql_deduplicator_1 = require("graphql-deduplicator");
var graphql_playground_middleware_express_1 = require("graphql-playground-middleware-express");
var graphql_tools_1 = require("graphql-tools");
var graphql_middleware_1 = require("graphql-middleware");
var http_1 = require("http");
var https_1 = require("https");
var path = require("path");
var subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
var defaultErrorFormatter_1 = require("./defaultErrorFormatter");
var graphql_tools_2 = require("graphql-tools");
exports.MockList = graphql_tools_2.MockList;
var graphql_subscriptions_1 = require("graphql-subscriptions");
exports.PubSub = graphql_subscriptions_1.PubSub;
exports.withFilter = graphql_subscriptions_1.withFilter;
var lambda_1 = require("./lambda");
exports.GraphQLServerLambda = lambda_1.GraphQLServerLambda;
var GraphQLServer = /** @class */ (function () {
    function GraphQLServer(props) {
        this.subscriptionServerOptions = null;
        this.options = {
            tracing: { mode: 'http-header' },
            port: process.env.PORT || 4000,
            deduplicator: true,
            endpoint: '/',
            subscriptions: '/',
            playground: '/',
            getEndpoint: false,
        };
        this.middlewareFragmentReplacements = [];
        this.middlewares = { use: [], get: [], post: [] };
        this.express = express();
        this.subscriptionServer = null;
        this.context = props.context;
        if (props.schema) {
            this.executableSchema = props.schema;
        }
        else if (props.typeDefs && props.resolvers) {
            var directiveResolvers = props.directiveResolvers, schemaDirectives = props.schemaDirectives, resolvers = props.resolvers, resolverValidationOptions = props.resolverValidationOptions, typeDefs = props.typeDefs, mocks = props.mocks;
            var typeDefsString = mergeTypeDefs(typeDefs);
            var uploadMixin = typeDefsString.includes('scalar Upload')
                ? { Upload: apollo_upload_server_1.GraphQLUpload }
                : {};
            this.executableSchema = graphql_tools_1.makeExecutableSchema({
                directiveResolvers: directiveResolvers,
                schemaDirectives: schemaDirectives,
                typeDefs: typeDefsString,
                resolvers: Array.isArray(resolvers)
                    ? [uploadMixin].concat(resolvers) : [uploadMixin, resolvers],
                resolverValidationOptions: resolverValidationOptions,
            });
            if (mocks) {
                graphql_tools_1.addMockFunctionsToSchema({
                    schema: this.executableSchema,
                    mocks: typeof mocks === 'object' ? mocks : undefined,
                    preserveResolvers: false,
                });
            }
        }
        if (props.middlewares) {
            var _a = graphql_middleware_1.applyMiddleware.apply(void 0, [this.executableSchema].concat(props.middlewares)), schema = _a.schema, fragmentReplacements = _a.fragmentReplacements;
            this.executableSchema = schema;
            this.middlewareFragmentReplacements = fragmentReplacements;
        }
    }
    GraphQLServer.prototype.use = function (path) {
        var handlers = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            handlers[_i - 1] = arguments[_i];
        }
        this.middlewares.use.push({ path: path, handlers: handlers });
        return this;
    };
    GraphQLServer.prototype.get = function (path) {
        var handlers = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            handlers[_i - 1] = arguments[_i];
        }
        this.middlewares.get.push({ path: path, handlers: handlers });
        return this;
    };
    GraphQLServer.prototype.post = function (path) {
        var handlers = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            handlers[_i - 1] = arguments[_i];
        }
        this.middlewares.post.push({ path: path, handlers: handlers });
        return this;
    };
    GraphQLServer.prototype.createHttpServer = function (options) {
        var _this = this;
        var app = this.express;
        this.options = __assign({}, this.options, options);
        if (this.options.subscriptions) {
            this.subscriptionServerOptions =
                typeof this.options.subscriptions === 'string'
                    ? { path: this.options.subscriptions }
                    : __assign({ path: '/' }, this.options.subscriptions);
        }
        var tracing = function (req) {
            var t = _this.options.tracing;
            if (typeof t === 'boolean') {
                return t;
            }
            else if (t.mode === 'http-header') {
                return req.get('x-apollo-tracing') !== undefined;
            }
            else {
                return t.mode === 'enabled';
            }
        };
        var formatResponse = function (req) {
            if (!_this.options.deduplicator) {
                return _this.options.formatResponse;
            }
            return function (response) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var _a;
                if (req.get('X-GraphQL-Deduplicate') &&
                    response.data &&
                    !response.data.__schema) {
                    response.data = graphql_deduplicator_1.deflate(response.data);
                }
                return _this.options.formatResponse
                    ? (_a = _this.options).formatResponse.apply(_a, [response].concat(args)) : response;
            };
        };
        // CORS support
        if (this.options.cors) {
            app.use(cors(this.options.cors));
        }
        else if (this.options.cors !== false) {
            app.use(cors());
        }
        app.post(this.options.endpoint, bodyParser.graphql(this.options.bodyParserOptions));
        if (this.options.uploads) {
            app.post(this.options.endpoint, apollo_upload_server_1.apolloUploadExpress(this.options.uploads));
        }
        else if (this.options.uploads !== false) {
            app.post(this.options.endpoint, apollo_upload_server_1.apolloUploadExpress());
        }
        // All middlewares added before start() was called are applied to
        // the express application here, in the order they were provided
        // (following Queue pattern)
        while (this.middlewares.use.length > 0) {
            var middleware = this.middlewares.use.shift();
            if (middleware.path) {
                app.use.apply(app, [middleware.path].concat(middleware.handlers));
            }
            else {
                app.use.apply(app, middleware.handlers);
            }
        }
        while (this.middlewares.get.length > 0) {
            var middleware = this.middlewares.get.shift();
            if (middleware.path) {
                app.get.apply(app, [middleware.path].concat(middleware.handlers));
            }
        }
        while (this.middlewares.post.length > 0) {
            var middleware = this.middlewares.post.shift();
            if (middleware.path) {
                app.post.apply(app, [middleware.path].concat(middleware.handlers));
            }
        }
        app.post(this.options.endpoint, apollo_server_express_1.graphqlExpress(function (request, response) { return __awaiter(_this, void 0, void 0, function () {
            var context, _a, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        if (!(typeof this.context === 'function')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.context({
                                request: request,
                                response: response,
                                fragmentReplacements: this.middlewareFragmentReplacements,
                            })];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = this.context;
                        _b.label = 3;
                    case 3:
                        context = _a;
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _b.sent();
                        console.error(e_1);
                        throw e_1;
                    case 5: return [2 /*return*/, {
                            schema: this.executableSchema,
                            tracing: tracing(request),
                            cacheControl: this.options.cacheControl,
                            formatError: this.options.formatError || defaultErrorFormatter_1.defaultErrorFormatter,
                            logFunction: this.options.logFunction,
                            rootValue: this.options.rootValue,
                            validationRules: typeof this.options.validationRules === 'function'
                                ? this.options.validationRules(request, response)
                                : this.options.validationRules,
                            fieldResolver: this.options.fieldResolver || graphql_tools_1.defaultMergedResolver,
                            formatParams: this.options.formatParams,
                            formatResponse: formatResponse(request),
                            debug: this.options.debug,
                            context: context,
                        }];
                }
            });
        }); }));
        // Only add GET endpoint if opted in
        if (this.options.getEndpoint) {
            app.get(this.options.getEndpoint === true
                ? this.options.endpoint
                : this.options.getEndpoint, apollo_server_express_1.graphqlExpress(function (request, response) { return __awaiter(_this, void 0, void 0, function () {
                var context, _a, e_2;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 4, , 5]);
                            if (!(typeof this.context === 'function')) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.context({ request: request, response: response })];
                        case 1:
                            _a = _b.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            _a = this.context;
                            _b.label = 3;
                        case 3:
                            context = _a;
                            return [3 /*break*/, 5];
                        case 4:
                            e_2 = _b.sent();
                            console.error(e_2);
                            throw e_2;
                        case 5: return [2 /*return*/, {
                                schema: this.executableSchema,
                                tracing: tracing(request),
                                cacheControl: this.options.cacheControl,
                                formatError: this.options.formatError || defaultErrorFormatter_1.defaultErrorFormatter,
                                logFunction: this.options.logFunction,
                                rootValue: this.options.rootValue,
                                validationRules: this.options.validationRules,
                                fieldResolver: this.options.fieldResolver || graphql_tools_1.defaultMergedResolver,
                                formatParams: this.options.formatParams,
                                formatResponse: this.options.formatResponse,
                                debug: this.options.debug,
                                context: context,
                            }];
                    }
                });
            }); }));
        }
        if (this.options.playground) {
            var playgroundOptions = {
                endpoint: this.options.endpoint,
                subscriptionsEndpoint: this.subscriptionServerOptions
                    ? this.subscriptionServerOptions.path
                    : undefined,
                tabs: this.options.defaultPlaygroundQuery
                    ? [
                        {
                            endpoint: this.options.endpoint,
                            query: this.options.defaultPlaygroundQuery,
                        },
                    ]
                    : undefined,
            };
            app.get(this.options.playground, graphql_playground_middleware_express_1.default(playgroundOptions));
        }
        if (!this.executableSchema) {
            throw new Error('No schema defined');
        }
        var server = this.options.https
            ? https_1.createServer(this.options.https, app)
            : http_1.createServer(app);
        if (this.subscriptionServerOptions) {
            this.createSubscriptionServer(server);
        }
        return server;
    };
    GraphQLServer.prototype.start = function (optionsOrCallback, callback) {
        var _this = this;
        var options = optionsOrCallback && typeof optionsOrCallback === 'function'
            ? {}
            : optionsOrCallback;
        var callbackFunc = callback
            ? callback
            : optionsOrCallback && typeof optionsOrCallback === 'function'
                ? optionsOrCallback
                : function () { return null; };
        var server = this.createHttpServer(options);
        return new Promise(function (resolve, reject) {
            var combinedServer = server;
            combinedServer.listen(_this.options.port, function () {
                callbackFunc(__assign({}, _this.options, { port: combinedServer.address().port }));
                resolve(combinedServer);
            });
        });
    };
    GraphQLServer.prototype.createSubscriptionServer = function (combinedServer) {
        var _this = this;
        this.subscriptionServer = subscriptions_transport_ws_1.SubscriptionServer.create({
            schema: this.executableSchema,
            // TODO remove once `@types/graphql` is fixed for `execute`
            execute: graphql_1.execute,
            subscribe: graphql_1.subscribe,
            onConnect: this.subscriptionServerOptions.onConnect
                ? this.subscriptionServerOptions.onConnect
                : function (connectionParams, webSocket) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                    return [2 /*return*/, (__assign({}, connectionParams))];
                }); }); },
            onDisconnect: this.subscriptionServerOptions.onDisconnect,
            onOperation: function (message, connection, webSocket) { return __awaiter(_this, void 0, void 0, function () {
                var context, _a, e_3;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            // The following should be replaced when SubscriptionServer accepts a formatError
                            // parameter for custom error formatting.
                            // See https://github.com/apollographql/subscriptions-transport-ws/issues/182
                            connection.formatResponse = function (value) { return (__assign({}, value, { errors: value.errors &&
                                    value.errors.map(_this.options.formatError || defaultErrorFormatter_1.defaultErrorFormatter) })); };
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 5, , 6]);
                            if (!(typeof this.context === 'function')) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.context({ connection: connection })];
                        case 2:
                            _a = _b.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            _a = this.context;
                            _b.label = 4;
                        case 4:
                            context = _a;
                            return [3 /*break*/, 6];
                        case 5:
                            e_3 = _b.sent();
                            console.error(e_3);
                            throw e_3;
                        case 6: return [2 /*return*/, __assign({}, connection, { context: context })];
                    }
                });
            }); },
            keepAlive: this.subscriptionServerOptions.keepAlive,
        }, {
            server: combinedServer,
            path: this.subscriptionServerOptions.path,
        });
    };
    return GraphQLServer;
}());
exports.GraphQLServer = GraphQLServer;
function mergeTypeDefs(typeDefs) {
    if (typeof typeDefs === 'string') {
        if (typeDefs.endsWith('graphql')) {
            var schemaPath = path.resolve(typeDefs);
            if (!fs.existsSync(schemaPath)) {
                throw new Error("No schema found for path: " + schemaPath);
            }
            return graphql_import_1.importSchema(schemaPath);
        }
        else {
            return typeDefs;
        }
    }
    if (typeof typeDefs === 'function') {
        typeDefs = typeDefs();
    }
    if (isDocumentNode(typeDefs)) {
        return graphql_1.print(typeDefs);
    }
    if (Array.isArray(typeDefs)) {
        return typeDefs.reduce(function (acc, t) { return acc + '\n' + mergeTypeDefs(t); }, '');
    }
    throw new Error('Typedef is not string, function, DocumentNode or array of previous');
}
function isDocumentNode(node) {
    return node.kind === 'Document';
}
//# sourceMappingURL=index.js.map