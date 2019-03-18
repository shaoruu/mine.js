"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GRAPHIQL_VERSION = '0.11.11';
var SUBSCRIPTIONS_TRANSPORT_VERSION = '0.9.9';
function safeSerialize(data) {
    return data ? JSON.stringify(data).replace(/\//g, '\\/') : null;
}
function renderGraphiQL(data) {
    var endpointURL = data.endpointURL;
    var endpointWs = endpointURL.startsWith('ws://') || endpointURL.startsWith('wss://');
    var subscriptionsEndpoint = data.subscriptionsEndpoint;
    var usingHttp = !endpointWs;
    var usingWs = endpointWs || !!subscriptionsEndpoint;
    var endpointURLWs = usingWs && (endpointWs ? endpointURL : subscriptionsEndpoint);
    var queryString = data.query;
    var variablesString = data.variables
        ? JSON.stringify(data.variables, null, 2)
        : null;
    var resultString = null;
    var operationName = data.operationName;
    var passHeader = data.passHeader ? data.passHeader : '';
    var editorTheme = data.editorTheme;
    var usingEditorTheme = !!editorTheme;
    var websocketConnectionParams = data.websocketConnectionParams || null;
    var rewriteURL = !!data.rewriteURL;
    return "\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\" />\n  <title>GraphiQL</title>\n  <meta name=\"robots\" content=\"noindex\" />\n  <style>\n    html, body {\n      height: 100%;\n      margin: 0;\n      overflow: hidden;\n      width: 100%;\n    }\n  </style>\n  <link href=\"//unpkg.com/graphiql@" + GRAPHIQL_VERSION + "/graphiql.css\" rel=\"stylesheet\" />\n  <script src=\"//unpkg.com/react@15.6.1/dist/react.min.js\"></script>\n  <script src=\"//unpkg.com/react-dom@15.6.1/dist/react-dom.min.js\"></script>\n  <script src=\"//unpkg.com/graphiql@" + GRAPHIQL_VERSION + "/graphiql.min.js\"></script>\n  " + (usingEditorTheme
        ? "<link href=\"//cdn.jsdelivr.net/npm/codemirror@5/theme/" + editorTheme + ".min.css\" rel=\"stylesheet\" />"
        : '') + "\n  " + (usingHttp
        ? "<script src=\"//cdn.jsdelivr.net/fetch/2.0.1/fetch.min.js\"></script>"
        : '') + "\n  " + (usingWs
        ? "<script src=\"//unpkg.com/subscriptions-transport-ws@" + SUBSCRIPTIONS_TRANSPORT_VERSION + "/browser/client.js\"></script>"
        : '') + "\n  " + (usingWs && usingHttp
        ? '<script src="//unpkg.com/graphiql-subscriptions-fetcher@0.0.2/browser/client.js"></script>'
        : '') + "\n\n</head>\n<body>\n  <script>\n    // Collect the URL parameters\n    var parameters = {};\n    window.location.search.substr(1).split('&').forEach(function (entry) {\n      var eq = entry.indexOf('=');\n      if (eq >= 0) {\n        parameters[decodeURIComponent(entry.slice(0, eq))] =\n          decodeURIComponent(entry.slice(eq + 1));\n      }\n    });\n    // Produce a Location query string from a parameter object.\n    function locationQuery(params, location) {\n      return (location ? location: '') + '?' + Object.keys(params).map(function (key) {\n        return encodeURIComponent(key) + '=' +\n          encodeURIComponent(params[key]);\n      }).join('&');\n    }\n    // Derive a fetch URL from the current URL, sans the GraphQL parameters.\n    var graphqlParamNames = {\n      query: true,\n      variables: true,\n      operationName: true\n    };\n    var otherParams = {};\n    for (var k in parameters) {\n      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {\n        otherParams[k] = parameters[k];\n      }\n    }\n\n    " + (usingWs
        ? "\n    var subscriptionsClient = new window.SubscriptionsTransportWs.SubscriptionClient('" + endpointURLWs + "', {\n      reconnect: true" + (websocketConnectionParams
            ? ",\n      connectionParams: " + JSON.stringify(websocketConnectionParams)
            : '') + "\n    });\n\n    var graphQLWSFetcher = subscriptionsClient.request.bind(subscriptionsClient);\n    "
        : '') + "\n\n    " + (usingHttp
        ? "\n      // We don't use safe-serialize for location, because it's not client input.\n      var fetchURL = locationQuery(otherParams, '" + endpointURL + "');\n\n      // Defines a GraphQL fetcher using the fetch API.\n      function graphQLHttpFetcher(graphQLParams) {\n          return fetch(fetchURL, {\n            method: 'post',\n            headers: {\n              'Accept': 'application/json',\n              'Content-Type': 'application/json',\n              " + passHeader + "\n            },\n            body: JSON.stringify(graphQLParams),\n            credentials: 'same-origin',\n          }).then(function (response) {\n            return response.text();\n          }).then(function (responseBody) {\n            try {\n              return JSON.parse(responseBody);\n            } catch (error) {\n              return responseBody;\n            }\n          });\n      }\n    "
        : '') + "\n\n    " + (usingWs && usingHttp
        ? "\n      var fetcher =\n        window.GraphiQLSubscriptionsFetcher.graphQLFetcher(subscriptionsClient, graphQLHttpFetcher);\n    "
        : "\n      var fetcher = " + (usingWs ? 'graphQLWSFetcher' : 'graphQLHttpFetcher') + ";\n    ") + "\n\n    // When the query and variables string is edited, update the URL bar so\n    // that it can be easily shared.\n    function onEditQuery(newQuery) {\n      parameters.query = newQuery;\n      " + (rewriteURL ? 'updateURL();' : '') + "\n    }\n    function onEditVariables(newVariables) {\n      parameters.variables = newVariables;\n      " + (rewriteURL ? 'updateURL();' : '') + "\n    }\n    function onEditOperationName(newOperationName) {\n      parameters.operationName = newOperationName;\n      " + (rewriteURL ? 'updateURL();' : '') + "\n    }\n    function updateURL() {\n      var cleanParams = Object.keys(parameters).filter(function(v) {\n        return parameters[v];\n      }).reduce(function(old, v) {\n        old[v] = parameters[v];\n        return old;\n      }, {});\n\n      history.replaceState(null, null, locationQuery(cleanParams) + window.location.hash);\n    }\n    // Render <GraphiQL /> into the body.\n    ReactDOM.render(\n      React.createElement(GraphiQL, {\n        fetcher: fetcher,\n        onEditQuery: onEditQuery,\n        onEditVariables: onEditVariables,\n        onEditOperationName: onEditOperationName,\n        query: " + safeSerialize(queryString) + ",\n        response: " + safeSerialize(resultString) + ",\n        variables: " + safeSerialize(variablesString) + ",\n        operationName: " + safeSerialize(operationName) + ",\n        editorTheme: " + safeSerialize(editorTheme) + ",\n        websocketConnectionParams: " + safeSerialize(websocketConnectionParams) + ",\n      }),\n      document.body\n    );\n  </script>\n</body>\n</html>";
}
exports.renderGraphiQL = renderGraphiQL;
//# sourceMappingURL=renderGraphiQL.js.map