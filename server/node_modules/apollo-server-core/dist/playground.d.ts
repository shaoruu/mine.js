import { RenderPageOptions as PlaygroundRenderPageOptions, Theme } from '@apollographql/graphql-playground-html/dist/render-playground-page';
export { RenderPageOptions as PlaygroundRenderPageOptions, } from '@apollographql/graphql-playground-html/dist/render-playground-page';
export declare type PlaygroundConfig = Partial<PlaygroundRenderPageOptions> | boolean;
export declare const defaultPlaygroundOptions: {
    version: string;
    settings: {
        'general.betaUpdates': boolean;
        'editor.theme': Theme;
        'editor.reuseHeaders': boolean;
        'tracing.hideTracingResponse': boolean;
        'editor.fontSize': number;
        'editor.fontFamily': string;
        'request.credentials': string;
    };
};
export declare function createPlaygroundOptions(playground?: PlaygroundConfig): PlaygroundRenderPageOptions | undefined;
//# sourceMappingURL=playground.d.ts.map