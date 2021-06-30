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

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type EntityType = {
  body: RigidBody;
  brain: Brain;
  offsets: [number, number, number];
  object: Object3D;
};

export type MeshResultType = {
  positions: Float32Array;
  normals: Float32Array;
  indices: Float32Array;
};

export type ServerMeshType = { subChunk: number; opaque: MeshType; transparent: MeshType };

export type ServerChunkType = {
  x: number;
  z: number;
  meshes: ServerMeshType[];
  voxels: Uint8Array;
  lights: Uint8Array;
  json: { voxel: Coords3; type: number };
};

export type Coords2 = [x: number, z: number];
export type Coords3 = [x: number, y: number, z: number];

export type TypeMap = { [key: string]: number };

export type MeshType = {
  positions: Float32Array;
  indices: Float32Array;
  uvs: Float32Array;
  aos: Float32Array;
  sunlights: Int32Array;
  torchLights: Int32Array;
};

export type MESSAGE_TYPE = 'ERROR' | 'SERVER' | 'PLAYER' | 'INFO';
