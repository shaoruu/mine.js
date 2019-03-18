"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var TracingExtension = /** @class */ (function () {
    function TracingExtension() {
        this.resolverCalls = [];
    }
    TracingExtension.prototype.requestDidStart = function () {
        this.startWallTime = new Date();
        this.startHrTime = process.hrtime();
    };
    TracingExtension.prototype.executionDidStart = function () { };
    TracingExtension.prototype.willResolveField = function (_source, _args, _context, info) {
        var _this = this;
        var resolverCall = {
            path: info.path,
            fieldName: info.fieldName,
            parentType: info.parentType,
            returnType: info.returnType,
            startOffset: process.hrtime(this.startHrTime)
        };
        this.resolverCalls.push(resolverCall);
        return function () {
            resolverCall.endOffset = process.hrtime(_this.startHrTime);
        };
    };
    TracingExtension.prototype.didResolveField = function (_source, _args, _context, info) { };
    TracingExtension.prototype.requestDidEnd = function () {
        this.duration = process.hrtime(this.startHrTime);
        this.endWallTime = new Date();
    };
    TracingExtension.prototype.format = function () {
        // In the event that we are called prior to the initialization of critical
        // date metrics, we'll return undefined to signal that the extension did not
        // format properly.  Any undefined extension results are simply purged by
        // the graphql-extensions module.
        if (typeof this.startWallTime === "undefined" ||
            typeof this.endWallTime === "undefined" ||
            typeof this.duration === "undefined") {
            return;
        }
        return [
            "tracing",
            {
                version: 1,
                startTime: this.startWallTime.toISOString(),
                endTime: this.endWallTime.toISOString(),
                duration: durationHrTimeToNanos(this.duration),
                execution: {
                    resolvers: this.resolverCalls.map(function (resolverCall) {
                        var startOffset = durationHrTimeToNanos(resolverCall.startOffset);
                        var duration = resolverCall.endOffset
                            ? durationHrTimeToNanos(resolverCall.endOffset) - startOffset
                            : 0;
                        return {
                            path: graphql_1.responsePathAsArray(resolverCall.path),
                            parentType: resolverCall.parentType.toString(),
                            fieldName: resolverCall.fieldName,
                            returnType: resolverCall.returnType.toString(),
                            startOffset: startOffset,
                            duration: duration
                        };
                    })
                }
            }
        ];
    };
    return TracingExtension;
}());
exports.TracingExtension = TracingExtension;
// Converts an hrtime array (as returned from process.hrtime) to nanoseconds.
//
// ONLY CALL THIS ON VALUES REPRESENTING DELTAS, NOT ON THE RAW RETURN VALUE
// FROM process.hrtime() WITH NO ARGUMENTS.
//
// The entire point of the hrtime data structure is that the JavaScript Number
// type can't represent all int64 values without loss of precision:
// Number.MAX_SAFE_INTEGER nanoseconds is about 104 days. Calling this function
// on a duration that represents a value less than 104 days is fine. Calling
// this function on an absolute time (which is generally roughly time since
// system boot) is not a good idea.
function durationHrTimeToNanos(hrtime) {
    return hrtime[0] * 1e9 + hrtime[1];
}
//# sourceMappingURL=index.js.map