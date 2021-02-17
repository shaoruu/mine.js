import Engine from '..';
import { Chunk } from './chunk';
import { Color3, Color4 } from './types';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Octree } from '@babylonjs/core/Culling/Octrees/octree';
import { AbstractMesh, Engine as BabylonEngine, Material } from '@babylonjs/core';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Mesh as BabylonMesh } from '@babylonjs/core/Meshes/mesh';
import '@babylonjs/core/Meshes/meshBuilder';
export declare type noaMesh = BabylonMesh & {
    _noaContainingChunk: Chunk | null | undefined;
    _isWorldMatrixFrozen: boolean | undefined;
};
export interface IRenderingOptions {
    /** @default false */
    showFPS: boolean;
    /** @default true */
    antiAlias: boolean;
    /** @default [0.8, 0.9, 1, 1] */
    clearColor: Color4;
    /** @default [1, 1, 1] */
    ambientColor: Color3;
    /** @default [1, 1, 1] */
    lightDiffuse: [number, number, number];
    /** @default [1, 1, 1] */
    lightSpecular: Color3;
    /** @default [0.5, 0.5, 0.5] */
    groundLightColor: Color3;
    /** @default true */
    useAO: boolean;
    /** @default [0.93, 0.8, 0.5] */
    AOmultipliers: [number, number, number];
    /** @default 1.0 */
    reverseAOmultiplier: number;
    /** @default true */
    preserveDrawingBuffer: boolean;
}
/**
 * @description Manages all rendering, and the BABYLON scene, materials, etc.
 */
export declare class Rendering {
    constructor(noa: Engine, options: Partial<IRenderingOptions>, canvas: HTMLCanvasElement | WebGLRenderingContext);
    noa: Engine;
    useAO: boolean;
    aoVals: [number, number, number];
    revAoVal: number;
    meshingCutoffTime: number;
    _resizeDebounce: number;
    _engine: BabylonEngine;
    _scene: Scene;
    _octree: Octree<AbstractMesh>;
    _cameraHolder: noaMesh;
    _camera: FreeCamera;
    _camScreen: noaMesh;
    _camScreenMat: Material;
    _camLocBlock: number;
    _light: HemisphericLight;
    _highlightMesh: noaMesh | undefined;
    flatMaterial: any;
    /**
     * The Babylon `scene` object representing the game world.
     */
    getScene: () => Scene;
    /** per-tick listener for rendering-related stuff */
    tick: (dt: number) => void;
    render: (dt: number) => void;
    resize: (e: any) => void;
    /** make or get a mesh for highlighting active voxel */
    getHighlightMesh: () => noaMesh;
    highlightBlockFace(show: false): void;
    highlightBlockFace(show: true, posArr: [number, number, number], normArr: number[]): void;
    /**
     * Add a mesh to the scene's octree setup so that it renders.
     *
     * @param mesh: the mesh to add to the scene
     * @param isStatic: pass in true if mesh never moves (i.e. change octree blocks)
     * @param position: (optional) global position where the mesh should be
     * @param chunk: (optional) chunk to which the mesh is statically bound
     */
    addMeshToScene: (mesh: noaMesh, isStatic?: boolean, pos?: [number, number, number] | undefined, _containingChunk?: any) => void;
    /**
     * Undoes everything `addMeshToScene` does
     */
    removeMeshFromScene: (mesh: noaMesh) => void;
    /**
     * Create a default standardMaterial: flat, nonspecular, fully reflects diffuse and ambient light
     */
    makeStandardMaterial: (name: string) => StandardMaterial;
    prepareChunkForRendering: (chunk: Chunk) => void;
    disposeChunkForRendering: (chunk: Chunk) => void;
    /**
     * change world origin offset, and rebase everything with a position
     */
    _rebaseOrigin: (delta: [number, number, number]) => void;
    /**
     * updates camera position/rotation to match settings from noa.camera
     */
    updateCameraForRender: () => void;
    /** If camera's current location block id has alpha color (e.g. water), apply/remove an effect */
    checkCameraEffect: (id: number) => void;
    debug_SceneCheck: () => string;
    debug_MeshCount: () => void;
}
