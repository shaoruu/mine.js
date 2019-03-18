"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var graphql_extensions_1 = require("graphql-extensions");
var apollo_tracing_1 = require("apollo-tracing");
var apollo_cache_control_1 = require("apollo-cache-control");
var LogAction;
(function (LogAction) {
    LogAction[LogAction["request"] = 0] = "request";
    LogAction[LogAction["parse"] = 1] = "parse";
    LogAction[LogAction["validation"] = 2] = "validation";
    LogAction[LogAction["execute"] = 3] = "execute";
})(LogAction = exports.LogAction || (exports.LogAction = {}));
var LogStep;
(function (LogStep) {
    LogStep[LogStep["start"] = 0] = "start";
    LogStep[LogStep["end"] = 1] = "end";
    LogStep[LogStep["status"] = 2] = "status";
})(LogStep = exports.LogStep || (exports.LogStep = {}));
function runQuery(options) {
    return Promise.resolve().then(function () { return doRunQuery(options); });
}
exports.runQuery = runQuery;
function printStackTrace(error) {
    console.error(error.stack);
}
function format(errors, formatter) {
    return errors.map(function (error) {
        if (formatter !== undefined) {
            try {
                return formatter(error);
            }
            catch (err) {
                console.error('Error in formatError function:', err);
                var newError = new Error('Internal server error');
                return graphql_1.formatError(newError);
            }
        }
        else {
            return graphql_1.formatError(error);
        }
    });
}
function doRunQuery(options) {
    var documentAST;
    var logFunction = options.logFunction ||
        function () {
            return null;
        };
    var debugDefault = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
    var debug = options.debug !== undefined ? options.debug : debugDefault;
    logFunction({ action: LogAction.request, step: LogStep.start });
    var context = options.context || {};
    var extensions = [];
    if (options.tracing) {
        extensions.push(apollo_tracing_1.TracingExtension);
    }
    if (options.cacheControl === true) {
        extensions.push(apollo_cache_control_1.CacheControlExtension);
    }
    else if (options.cacheControl) {
        extensions.push(new apollo_cache_control_1.CacheControlExtension(options.cacheControl));
    }
    var extensionStack = extensions.length > 0 && new graphql_extensions_1.GraphQLExtensionStack(extensions);
    if (extensionStack) {
        context._extensionStack = extensionStack;
        graphql_extensions_1.enableGraphQLExtensions(options.schema);
        extensionStack.requestDidStart();
    }
    var qry = typeof options.query === 'string' ? options.query : graphql_1.print(options.query);
    logFunction({
        action: LogAction.request,
        step: LogStep.status,
        key: 'query',
        data: qry,
    });
    logFunction({
        action: LogAction.request,
        step: LogStep.status,
        key: 'variables',
        data: options.variables,
    });
    logFunction({
        action: LogAction.request,
        step: LogStep.status,
        key: 'operationName',
        data: options.operationName,
    });
    if (typeof options.query === 'string') {
        try {
            logFunction({ action: LogAction.parse, step: LogStep.start });
            documentAST = graphql_1.parse(options.query);
            logFunction({ action: LogAction.parse, step: LogStep.end });
        }
        catch (syntaxError) {
            logFunction({ action: LogAction.parse, step: LogStep.end });
            return Promise.resolve({
                errors: format([syntaxError], options.formatError),
            });
        }
    }
    else {
        documentAST = options.query;
    }
    if (options.skipValidation !== true) {
        var rules = graphql_1.specifiedRules;
        if (options.validationRules) {
            rules = rules.concat(options.validationRules);
        }
        logFunction({ action: LogAction.validation, step: LogStep.start });
        var validationErrors = graphql_1.validate(options.schema, documentAST, rules);
        logFunction({ action: LogAction.validation, step: LogStep.end });
        if (validationErrors.length) {
            return Promise.resolve({
                errors: format(validationErrors, options.formatError),
            });
        }
    }
    if (extensionStack) {
        extensionStack.executionDidStart();
    }
    try {
        logFunction({ action: LogAction.execute, step: LogStep.start });
        return Promise.resolve(graphql_1.execute(options.schema, documentAST, options.rootValue, context, options.variables, options.operationName, options.fieldResolver)).then(function (result) {
            logFunction({ action: LogAction.execute, step: LogStep.end });
            logFunction({ action: LogAction.request, step: LogStep.end });
            var response = {
                data: result.data,
            };
            if (result.errors) {
                response.errors = format(result.errors, options.formatError);
                if (debug) {
                    result.errors.map(printStackTrace);
                }
            }
            if (extensionStack) {
                extensionStack.executionDidEnd();
                extensionStack.requestDidEnd();
                response.extensions = extensionStack.format();
            }
            if (options.formatResponse) {
                response = options.formatResponse(response, options);
            }
            return response;
        });
    }
    catch (executionError) {
        logFunction({ action: LogAction.execute, step: LogStep.end });
        logFunction({ action: LogAction.request, step: LogStep.end });
        return Promise.resolve({
            errors: format([executionError], options.formatError),
        });
    }
}
//# sourceMappingURL=runQuery.js.map