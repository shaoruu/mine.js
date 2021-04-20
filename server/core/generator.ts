import { Chunk } from './chunk';

type GeneratorTypes = 'sin-cos' | 'flat';

class Generator {
  static generate = (chunk: Chunk, type: GeneratorTypes) => {
    switch (type) {
      case 'sin-cos':
        Generator.sincos(chunk);
        break;
      case 'flat':
        Generator.flat(chunk);
        break;
    }
  };

  static flat = (chunk: Chunk) => {
    // TODO
    const {} = chunk;
  };

  static sincos = (chunk: Chunk) => {
    const {
      voxels,
      min,
      max,
      options: { maxHeight },
      world: { registry },
    } = chunk;

    const [startX, startY, startZ] = min;
    const [endX, endY, endZ] = max;

    let isEmpty = true;

    const types = registry.getTypeMap(['dirt', 'stone', 'grass']);

    function getVoxelAt(vx: number, vy: number, vz: number, types, maxHeight) {
      let blockID = 0;

      if (vy >= maxHeight) return 0;
      if (vy === 0) return types.stone;
      if (vy < 0) return 0;

      const height1 = 5 * Math.sin(vx / 10) + 8 * Math.cos(vz / 20) + 30;
      const height2 = 0;
      if (vy < height1 && vy > height2) {
        blockID = Math.random() > 0.5 ? types.grass : types.stone;
      }

      return blockID;
    }

    for (let vx = startX, lx = 0; vx < endX; ++vx, ++lx) {
      for (let vy = startY, ly = 0; vy < endY; ++vy, ++ly) {
        for (let vz = startZ, lz = 0; vz < endZ; ++vz, ++lz) {
          const voxel = getVoxelAt(vx, vy, vz, types, maxHeight);
          if (voxel) {
            isEmpty = false;
            voxels.set(lx, ly, lz, voxel);
          }
        }
      }
    }

    chunk.isEmpty = isEmpty;
  };
}

export { Generator, GeneratorTypes };
