"use strict";
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
var renderGraphiQL_1 = require("./renderGraphiQL");
function isOptionsFunction(arg) {
    return typeof arg === 'function';
}
function resolveGraphiQLOptions(options) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isOptionsFunction(options)) return [3, 5];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, options.apply(void 0, args)];
                case 2: return [2, _a.sent()];
                case 3:
                    e_1 = _a.sent();
                    throw new Error("Invalid options provided for GraphiQL: " + e_1.message);
                case 4: return [3, 6];
                case 5: return [2, options];
                case 6: return [2];
            }
        });
    });
}
function createGraphiQLParams(query) {
    var queryObject = query || {};
    return {
        query: queryObject.query || '',
        variables: queryObject.variables,
        operationName: queryObject.operationName || '',
    };
}
function createGraphiQLData(params, options) {
    return {
        endpointURL: options.endpointURL,
        subscriptionsEndpoint: options.subscriptionsEndpoint,
        query: params.query || options.query,
        variables: (params.variables && JSON.parse(params.variables)) || options.variables,
        operationName: params.operationName || options.operationName,
        passHeader: options.passHeader,
        editorTheme: options.editorTheme,
        websocketConnectionParams: options.websocketConnectionParams,
        rewriteURL: options.rewriteURL,
    };
}
function resolveGraphiQLString(query, options) {
    if (query === void 0) { query = {}; }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        var graphiqlParams, graphiqlOptions, graphiqlData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    graphiqlParams = createGraphiQLParams(query);
                    return [4, resolveGraphiQLOptions.apply(void 0, [options].concat(args))];
                case 1:
                    graphiqlOptions = _a.sent();
                    graphiqlData = createGraphiQLData(graphiqlParams, graphiqlOptions);
                    return [2, renderGraphiQL_1.renderGraphiQL(graphiqlData)];
            }
        });
    });
}
exports.resolveGraphiQLString = resolveGraphiQLString;
//# sourceMappingURL=resolveGraphiQLString.js.map