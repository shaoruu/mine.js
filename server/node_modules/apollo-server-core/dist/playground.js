"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const playgroundVersion = '1.7.2';
exports.defaultPlaygroundOptions = {
    version: playgroundVersion,
    settings: {
        'general.betaUpdates': false,
        'editor.theme': 'dark',
        'editor.reuseHeaders': true,
        'tracing.hideTracingResponse': true,
        'editor.fontSize': 14,
        'editor.fontFamily': `'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace`,
        'request.credentials': 'omit',
    },
};
function createPlaygroundOptions(playground = {}) {
    const isDev = process.env.NODE_ENV !== 'production';
    const enabled = typeof playground === 'boolean' ? playground : isDev;
    if (!enabled) {
        return undefined;
    }
    const playgroundOverrides = typeof playground === 'boolean' ? {} : playground || {};
    const playgroundOptions = Object.assign({}, exports.defaultPlaygroundOptions, playgroundOverrides, { settings: Object.assign({}, exports.defaultPlaygroundOptions.settings, playgroundOverrides.settings) });
    return playgroundOptions;
}
exports.createPlaygroundOptions = createPlaygroundOptions;
//# sourceMappingURL=playground.js.map