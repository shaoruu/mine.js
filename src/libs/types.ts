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

export type Coords3 = [x: number, y: number, z: number];
export type GeneratorType = 'flat' | 'sin-cos' | '';

export type MeshResultType = {
  positions: Float32Array;
  normals: Float32Array;
  indices: Float32Array;
  uvs: Float32Array;
  aos: Float32Array;
};
