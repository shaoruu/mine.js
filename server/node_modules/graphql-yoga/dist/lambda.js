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
var apollo_server_lambda_1 = require("apollo-server-lambda");
var fs = require("fs");
var graphql_import_1 = require("graphql-import");
var graphql_playground_middleware_lambda_1 = require("graphql-playground-middleware-lambda");
var graphql_tools_1 = require("graphql-tools");
var graphql_middleware_1 = require("graphql-middleware");
var graphql_deduplicator_1 = require("graphql-deduplicator");
var path = require("path");
var GraphQLServerLambda = /** @class */ (function () {
    function GraphQLServerLambda(props) {
        var _this = this;
        this.middlewareFragmentReplacements = [];
        this.graphqlHandler = function (event, context, callback) {
            function callbackFilter(error, output) {
                var headers = output.headers || {};
                headers['Access-Control-Allow-Origin'] = '*';
                // eslint-disable-next-line no-param-reassign
                output.headers = headers;
                callback(error, output);
            }
            var tracing = function (event) {
                var t = _this.options.tracing;
                if (typeof t === 'boolean') {
                    return t;
                }
                else if (t.mode === 'http-header') {
                    return event.headers && event.headers['x-apollo-tracing'] !== undefined;
                }
                else {
                    return t.mode === 'enabled';
                }
            };
            var formatResponse = function (event) {
                if (!_this.options.deduplicator) {
                    return _this.options.formatResponse;
                }
                return function (response) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    var _a;
                    if (event.headers &&
                        event.headers['X-GraphQL-Deduplicate'] &&
                        response.data &&
                        !response.data.__schema) {
                        response.data = graphql_deduplicator_1.deflate(response.data);
                    }
                    return _this.options.formatResponse
                        ? (_a = _this.options).formatResponse.apply(_a, [response].concat(args)) : response;
                };
            };
            var handler = apollo_server_lambda_1.graphqlLambda(function (event, lambdaContext) { return __awaiter(_this, void 0, void 0, function () {
                var apolloContext, _a, e_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 4, , 5]);
                            if (!(typeof this.context === 'function')) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.context({
                                    event: event,
                                    context: lambdaContext,
                                    fragmentReplacements: this.middlewareFragmentReplacements,
                                })];
                        case 1:
                            _a = _b.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            _a = this.context;
                            _b.label = 3;
                        case 3:
                            apolloContext = _a;
                            return [3 /*break*/, 5];
                        case 4:
                            e_1 = _b.sent();
                            console.error(e_1);
                            throw e_1;
                        case 5:
                            if (typeof this.options.validationRules === 'function') {
                                throw new Error('validationRules as callback is only compatible with Express');
                            }
                            return [2 /*return*/, {
                                    schema: this.executableSchema,
                                    tracing: tracing(event),
                                    context: apolloContext,
                                    cacheControl: this.options.cacheControl,
                                    formatError: this.options.formatError,
                                    logFunction: this.options.logFunction,
                                    rootValue: this.options.rootValue,
                                    validationRules: this.options.validationRules,
                                    fieldResolver: this.options.fieldResolver || graphql_tools_1.defaultMergedResolver,
                                    formatParams: this.options.formatParams,
                                    formatResponse: formatResponse(event),
                                    debug: this.options.debug,
                                }];
                    }
                });
            }); });
            handler(event, context, callbackFilter);
        };
        this.playgroundHandler = function (event, lambdaContext, callback) {
            graphql_playground_middleware_lambda_1.default({
                endpoint: _this.options.endpoint,
            })(event, lambdaContext, callback);
        };
        this.handler = function (event, lambdaContext, callback) {
            if (event.httpMethod === 'GET') {
                _this.playgroundHandler(event, lambdaContext, callback);
            }
            else {
                _this.graphqlHandler(event, lambdaContext, callback);
            }
        };
        var defaultOptions = {
            tracing: { mode: 'http-header' },
            deduplicator: true,
        };
        this.options = __assign({}, defaultOptions, props.options);
        this.context = props.context;
        if (props.schema) {
            this.executableSchema = props.schema;
        }
        else if (props.typeDefs && props.resolvers) {
            var directiveResolvers = props.directiveResolvers, schemaDirectives = props.schemaDirectives, resolverValidationOptions = props.resolverValidationOptions, typeDefs = props.typeDefs, resolvers = props.resolvers;
            // read from .graphql file if path provided
            if (typeDefs.endsWith('graphql')) {
                var schemaPath = path.isAbsolute(typeDefs)
                    ? path.resolve(typeDefs)
                    : path.resolve(typeDefs);
                if (!fs.existsSync(schemaPath)) {
                    throw new Error("No schema found for path: " + schemaPath);
                }
                typeDefs = graphql_import_1.importSchema(schemaPath);
            }
            this.executableSchema = graphql_tools_1.makeExecutableSchema({
                directiveResolvers: directiveResolvers,
                schemaDirectives: schemaDirectives,
                resolverValidationOptions: resolverValidationOptions,
                typeDefs: typeDefs,
                resolvers: resolvers,
            });
        }
        if (props.middlewares) {
            var _a = graphql_middleware_1.applyMiddleware.apply(void 0, [this.executableSchema].concat(props.middlewares)), schema = _a.schema, fragmentReplacements = _a.fragmentReplacements;
            this.executableSchema = schema;
            this.middlewareFragmentReplacements = fragmentReplacements;
        }
    }
    return GraphQLServerLambda;
}());
exports.GraphQLServerLambda = GraphQLServerLambda;
//# sourceMappingURL=lambda.js.map