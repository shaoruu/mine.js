import Stats from 'stats.js';
import { Mesh } from 'three';
import { Engine } from './engine';
declare class Debug {
    engine: Engine;
    gui: dat.GUI;
    stats: Stats;
    dataWrapper: HTMLDivElement;
    dataEntires: {
        ele: HTMLParagraphElement;
        obj: any;
        attribute: string;
        name: string;
    }[];
    chunkHighlight: Mesh;
    constructor(engine: Engine);
    makeDataEntry: () => HTMLParagraphElement;
    makeDOM: () => void;
    mount: () => void;
    setupAll: () => void;
    tick: () => void;
    registerDisplay(name: string, object: any, attribute: string): void;
}
export { Debug };
