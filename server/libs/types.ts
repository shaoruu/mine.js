type AllTextureType = { all?: string };

type ThreeTextureType = { top?: string; side?: string; bottom?: string };

type SixTextureType = {
  px?: string;
  py?: string;
  pz?: string;
  nx?: string;
  ny?: string;
  nz?: string;
};

export type TextureType = AllTextureType & ThreeTextureType & SixTextureType;

export type BlockType = {
  id: number;
  name: string;
  isEmpty: boolean;
  isSolid: boolean;
  isFluid: boolean;
  isTransparent: boolean;
  textures?: TextureType;
};

export type MeshType = {
  positions: Float32Array;
  normals: Float32Array;
  indices: Float32Array;
  uvs: Float32Array;
  aos: Float32Array;
};
