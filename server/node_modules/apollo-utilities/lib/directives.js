"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var visitor_1 = require("graphql/language/visitor");
var ts_invariant_1 = require("ts-invariant");
var storeUtils_1 = require("./storeUtils");
function getDirectiveInfoFromField(field, variables) {
    if (field.directives && field.directives.length) {
        var directiveObj_1 = {};
        field.directives.forEach(function (directive) {
            directiveObj_1[directive.name.value] = storeUtils_1.argumentsObjectFromField(directive, variables);
        });
        return directiveObj_1;
    }
    return null;
}
exports.getDirectiveInfoFromField = getDirectiveInfoFromField;
function shouldInclude(selection, variables) {
    if (variables === void 0) { variables = {}; }
    if (!selection.directives) {
        return true;
    }
    var res = true;
    selection.directives.forEach(function (directive) {
        if (directive.name.value !== 'skip' && directive.name.value !== 'include') {
            return;
        }
        var directiveArguments = directive.arguments || [];
        var directiveName = directive.name.value;
        ts_invariant_1.invariant(directiveArguments.length === 1, "Incorrect number of arguments for the @" + directiveName + " directive.");
        var ifArgument = directiveArguments[0];
        ts_invariant_1.invariant(ifArgument.name && ifArgument.name.value === 'if', "Invalid argument for the @" + directiveName + " directive.");
        var ifValue = directiveArguments[0].value;
        var evaledValue = false;
        if (!ifValue || ifValue.kind !== 'BooleanValue') {
            ts_invariant_1.invariant(ifValue.kind === 'Variable', "Argument for the @" + directiveName + " directive must be a variable or a boolean value.");
            evaledValue = variables[ifValue.name.value];
            ts_invariant_1.invariant(evaledValue !== void 0, "Invalid variable referenced in @" + directiveName + " directive.");
        }
        else {
            evaledValue = ifValue.value;
        }
        if (directiveName === 'skip') {
            evaledValue = !evaledValue;
        }
        if (!evaledValue) {
            res = false;
        }
    });
    return res;
}
exports.shouldInclude = shouldInclude;
function getDirectiveNames(doc) {
    var names = [];
    visitor_1.visit(doc, {
        Directive: function (node) {
            names.push(node.name.value);
        },
    });
    return names;
}
exports.getDirectiveNames = getDirectiveNames;
function hasDirectives(names, doc) {
    return getDirectiveNames(doc).some(function (name) { return names.indexOf(name) > -1; });
}
exports.hasDirectives = hasDirectives;
function hasClientExports(document) {
    return (document &&
        hasDirectives(['client'], document) &&
        hasDirectives(['export'], document));
}
exports.hasClientExports = hasClientExports;
//# sourceMappingURL=directives.js.map