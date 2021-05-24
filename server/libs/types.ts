import { Coords3 } from '../../shared/types';
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

type PlantTextureType = {
  one?: string;
  two?: string;
};

export type TextureType = AllTextureType & ThreeTextureType & SixTextureType & PlantTextureType;

export type BlockType = {
  name: string;
  isEmpty: boolean;
  isSolid: boolean;
  isFluid: boolean;
  isTransparent: boolean;
  isLight: boolean;
  isBlock: boolean;
  lightLevel?: number;
  textures?: TextureType;
  scale: number[];
};

export type GeneratorTypes = 'sin-cos' | 'flat' | 'hilly';

export type VoxelUpdate = {
  voxel: Coords3;
  type: number;
};
