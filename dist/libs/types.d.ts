import { Object3D } from 'three';
import { AABB } from './aabb';
import { Brain } from './brain';
import { RigidBody } from './rigid-body';
export declare type BlockMaterialType = string | [string, string, string] | [string, string, string, string, string, string] | null;
export declare type BlockMaterialUVType = {
    startU: number;
    endU: number;
    startV: number;
    endV: number;
};
export declare type BlockType = {
    name: string;
    material: BlockMaterialType;
};
export declare type BodyOptionsType = {
    aabb: AABB;
    mass: number;
    friction: number;
    restitution: number;
    gravityMultiplier: number;
    onCollide: (impacts?: number[]) => void;
    autoStep: boolean;
};
export declare type Coords2 = [x: number, z: number];
export declare type Coords3 = [x: number, y: number, z: number];
export declare type EntityType = {
    body: RigidBody;
    brain: Brain;
    offsets: [number, number, number];
    object: Object3D;
};
export declare type GeneratorType = 'flat' | 'sin-cos' | '';
export declare type MeshResultType = {
    positions: Float32Array;
    normals: Float32Array;
    indices: Float32Array;
    uvs: Float32Array;
    aos: Float32Array;
};
