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
