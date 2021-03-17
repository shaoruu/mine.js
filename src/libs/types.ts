import { Object3D } from 'three';

import { AABB } from './aabb';
import { Brain } from './brain';
import { RigidBody } from './rigid-body';

export type BlockMaterialType =
  | string
  | [string, string, string]
  | [string, string, string, string, string, string]
  | null;

export type BlockMaterialUVType = {
  startU: number;
  endU: number;
  startV: number;
  endV: number;
};

export type BlockType = {
  name: string;
  material: BlockMaterialType;
};

export type BodyOptionsType = {
  aabb: AABB;
  mass: number;
  friction: number;
  restitution: number;
  gravityMultiplier: number;
  onCollide: (impacts?: number[]) => void;
  autoStep: boolean;
};

export type Coords3 = [x: number, y: number, z: number];

export type EntityType = {
  body: RigidBody;
  brain: Brain;
  offsets: [number, number, number];
  object: Object3D;
};

export type GeneratorType = 'flat' | 'sin-cos' | '';

export type MeshResultType = {
  positions: Float32Array;
  normals: Float32Array;
  indices: Float32Array;
  uvs: Float32Array;
  aos: Float32Array;
};
