export type Coords2 = [x: number, z: number];
export type Coords3 = [x: number, y: number, z: number];

export type TypeMap = { [key: string]: number };

export type MeshType = {
  positions: Float32Array;
  normals: Float32Array;
  indices: Float32Array;
  uvs: Float32Array;
  aos: Float32Array;
  sunlights: Float32Array;
  torchLights: Float32Array;
};
