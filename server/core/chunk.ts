import ndarray from 'ndarray';

import { Coords2 } from '../../shared';

import { World } from '.';

class Chunk {
  public world: World;
  public coords: Coords2;
  public voxels: ndarray;

  constructor({ coords, world }: { coords: Coords2; world: World }) {
    this.world = world;
    this.coords = coords;
  }

  load = () => {
    // load from existing files
  };

  generate = () => {
    // generate terrain, height map, and mesh
  };

  generateHeightMap = () => {
    // generate 2d height map for lighting
  };

  propagate = () => {
    // light propagation
  };

  floodLight = () => {
    // flood light from source
  };

  removeLight = () => {
    // remove light and back-propagate
  };

  update = () => {
    // update a voxel and rebuild mesh
  };

  remesh = () => {
    // rebuild mesh
  };

  save = () => {
    // save to file system
  };
}

export { Chunk };
