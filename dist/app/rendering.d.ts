import { EventEmitter } from 'events';
import { Scene, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { Sky } from '../libs';
import { Engine } from './engine';
declare type RenderingOptionsType = {
    fogColor: string;
    clearColor: string;
};
declare class Rendering extends EventEmitter {
    engine: Engine;
    scene: Scene;
    renderer: WebGLRenderer;
    composer: EffectComposer;
    sky: Sky;
    options: RenderingOptionsType;
    constructor(engine: Engine, options: RenderingOptionsType);
    adjustRenderer: () => void;
    tick: () => void;
    render: () => void;
    get renderSize(): {
        width: number;
        height: number;
    };
    get aspectRatio(): number;
}
export { Rendering, RenderingOptionsType };
