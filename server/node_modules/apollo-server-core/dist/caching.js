"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function calculateCacheControlHeaders(responses) {
    let lowestMaxAge = Number.MAX_VALUE;
    let publicOrPrivate = 'public';
    for (const response of responses) {
        const cacheControl = response.extensions && response.extensions.cacheControl;
        if (!cacheControl ||
            !cacheControl.hints ||
            cacheControl.hints.length === 0 ||
            cacheControl.version !== 1) {
            if (cacheControl && cacheControl.version !== 1) {
                console.warn('Invalid cacheControl version.');
            }
            return {};
        }
        const rootHints = new Set();
        for (const hint of cacheControl.hints) {
            if (hint.scope && hint.scope.toLowerCase() === 'private') {
                publicOrPrivate = 'private';
            }
            if (hint.maxAge === undefined) {
                continue;
            }
            if (hint.maxAge === 0) {
                return {};
            }
            if (hint.maxAge < lowestMaxAge) {
                lowestMaxAge = hint.maxAge;
            }
            if (hint.path.length === 1) {
                rootHints.add(hint.path[0]);
            }
        }
        if (response.data &&
            Object.keys(response.data).find(rootKey => !rootHints.has(rootKey))) {
            return {};
        }
    }
    return {
        'Cache-Control': `max-age=${lowestMaxAge}, ${publicOrPrivate}`,
    };
}
exports.calculateCacheControlHeaders = calculateCacheControlHeaders;
//# sourceMappingURL=caching.js.map