"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var graphql_1 = require("graphql");
var runQuery_1 = require("./runQuery");
var graphqlOptions_1 = require("./graphqlOptions");
var HttpQueryError = (function (_super) {
    __extends(HttpQueryError, _super);
    function HttpQueryError(statusCode, message, isGraphQLError, headers) {
        if (isGraphQLError === void 0) { isGraphQLError = false; }
        var _this = _super.call(this, message) || this;
        _this.name = 'HttpQueryError';
        _this.statusCode = statusCode;
        _this.isGraphQLError = isGraphQLError;
        _this.headers = headers;
        return _this;
    }
    return HttpQueryError;
}(Error));
exports.HttpQueryError = HttpQueryError;
function isQueryOperation(query, operationName) {
    var operationAST = graphql_1.getOperationAST(query, operationName);
    return operationAST.operation === 'query';
}
function runHttpQuery(handlerArguments, request) {
    return __awaiter(this, void 0, void 0, function () {
        var isGetRequest, optionsObject, e_1, formatErrorFn, requestPayload, isBatch, requests, responses, gqlResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isGetRequest = false;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, graphqlOptions_1.resolveGraphqlOptions.apply(void 0, [request.options].concat(handlerArguments))];
                case 2:
                    optionsObject = _a.sent();
                    return [3, 4];
                case 3:
                    e_1 = _a.sent();
                    throw new HttpQueryError(500, e_1.message);
                case 4:
                    formatErrorFn = optionsObject.formatError || graphql_1.formatError;
                    switch (request.method) {
                        case 'POST':
                            if (!request.query || Object.keys(request.query).length === 0) {
                                throw new HttpQueryError(500, 'POST body missing. Did you forget use body-parser middleware?');
                            }
                            requestPayload = request.query;
                            break;
                        case 'GET':
                            if (!request.query || Object.keys(request.query).length === 0) {
                                throw new HttpQueryError(400, 'GET query missing.');
                            }
                            isGetRequest = true;
                            requestPayload = request.query;
                            break;
                        default:
                            throw new HttpQueryError(405, 'Apollo Server supports only GET/POST requests.', false, {
                                Allow: 'GET, POST',
                            });
                    }
                    isBatch = true;
                    if (!Array.isArray(requestPayload)) {
                        isBatch = false;
                        requestPayload = [requestPayload];
                    }
                    requests = requestPayload.map(function (requestParams) {
                        try {
                            var query = requestParams.query;
                            var extensions = requestParams.extensions;
                            if (isGetRequest && extensions) {
                                try {
                                    extensions = JSON.parse(extensions);
                                }
                                catch (error) {
                                    throw new HttpQueryError(400, 'Extensions are invalid JSON.');
                                }
                            }
                            if (query === undefined && extensions && extensions.persistedQuery) {
                                throw new HttpQueryError(200, JSON.stringify({
                                    errors: [
                                        {
                                            message: 'PersistedQueryNotSupported',
                                        },
                                    ],
                                }), true, {
                                    'Content-Type': 'application/json',
                                });
                            }
                            if (isGetRequest) {
                                if (typeof query === 'string') {
                                    query = graphql_1.parse(query);
                                }
                                else if (!query) {
                                    throw new HttpQueryError(400, 'Must provide query string.');
                                }
                                if (!isQueryOperation(query, requestParams.operationName)) {
                                    throw new HttpQueryError(405, "GET supports only query operation", false, {
                                        Allow: 'POST',
                                    });
                                }
                            }
                            var operationName = requestParams.operationName;
                            var variables = requestParams.variables;
                            if (typeof variables === 'string') {
                                try {
                                    variables = JSON.parse(variables);
                                }
                                catch (error) {
                                    throw new HttpQueryError(400, 'Variables are invalid JSON.');
                                }
                            }
                            var context_1 = optionsObject.context || {};
                            if (typeof context_1 === 'function') {
                                context_1 = context_1();
                            }
                            else if (isBatch) {
                                context_1 = Object.assign(Object.create(Object.getPrototypeOf(context_1)), context_1);
                            }
                            var params = {
                                schema: optionsObject.schema,
                                query: query,
                                variables: variables,
                                context: context_1,
                                rootValue: optionsObject.rootValue,
                                operationName: operationName,
                                logFunction: optionsObject.logFunction,
                                validationRules: optionsObject.validationRules,
                                formatError: formatErrorFn,
                                formatResponse: optionsObject.formatResponse,
                                fieldResolver: optionsObject.fieldResolver,
                                debug: optionsObject.debug,
                                tracing: optionsObject.tracing,
                                cacheControl: optionsObject.cacheControl,
                            };
                            if (optionsObject.formatParams) {
                                params = optionsObject.formatParams(params);
                            }
                            return runQuery_1.runQuery(params);
                        }
                        catch (e) {
                            if (e.name === 'HttpQueryError') {
                                return Promise.reject(e);
                            }
                            return Promise.resolve({ errors: [formatErrorFn(e)] });
                        }
                    });
                    return [4, Promise.all(requests)];
                case 5:
                    responses = _a.sent();
                    if (!isBatch) {
                        gqlResponse = responses[0];
                        if (gqlResponse.errors && typeof gqlResponse.data === 'undefined') {
                            throw new HttpQueryError(400, JSON.stringify(gqlResponse), true, {
                                'Content-Type': 'application/json',
                            });
                        }
                        return [2, JSON.stringify(gqlResponse)];
                    }
                    return [2, JSON.stringify(responses)];
            }
        });
    });
}
exports.runHttpQuery = runHttpQuery;
//# sourceMappingURL=runHttpQuery.js.map