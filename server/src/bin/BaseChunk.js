// import * as THREE from 'three'

import Config from "../../../../data/config";
import BaseBlock from "./BaseBlock";
import Helpers from "../../../../utils/helpers";
import Noise from "../../../helpers/Noise";
import Biome from "./BaseBiome";

class BaseChunk {
  constructor(origin, seed) {
    const size = Config.chunk.size,
      dimension = Config.block.dimension,
      height = Config.chunk.height,
      waterLevel = Config.chunk.waterLevel,
      noiseConstant = 10;

    // Member Initialization
    this.origin = origin;
    this.meshGroup = [];
    this.blocks = [];
    this.mesh = null;
    this.grid = new Array(size);
    const maxHeight = height * 4;

    const biome = new Biome(seed);

    const noise = new Noise(seed);

    //ADDING 3D PERLIN NOISE
    for (let x = 0; x < size; x++) {
      this.grid[x] = new Array(size);
      for (let z = 0; z < size; z++) {
        this.grid[x][z] = new Array(maxHeight);
        for (let y = 0; y < height; y++) {
          let block = {
            id: 0
          };
          let density = noise.perlin3(
            (x + origin.x * size) / noiseConstant,
            (z + origin.z * size) / noiseConstant,
            y / noiseConstant
          );
          if (density >= 0) {
            block.id = 1;
          }
          this.grid[x][z][y] = block;
        }
        for (let y = height; y < maxHeight; y++) {
          let block = {
            id: 0
          };
          this.grid[x][z][y] = block;
        }
      }
    }

    //ADDING 2D PERLIN NOISE AND DIRT & GRASS TOP
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        let topBlocks = { top: 2, bottom: 3 };
        if (biome.getBiome(x + origin.x * size, z + origin.z * size) === 2) {
          topBlocks = { top: 12, bottom: 12 };
        }
        const groundHeight = Math.round(
          (noise.perlin2(
            (x + origin.x * size) / noiseConstant,
            (z + origin.z * size) / noiseConstant
          ) +
            1) *
            height
        );
        let top = 0;
        this.grid[x][z].forEach((block, y) => {
          if (block.id === 1) {
            top = y;
          }
        });

        for (let y = top; y < top + groundHeight; y++) {
          this.grid[x][z][y].id = 1;
          if (y === top + groundHeight - 1) {
            this.grid[x][z][y].id = topBlocks.top;
            this.grid[x][z][y].top = true;
          } else if (y - top - groundHeight + 1 > -4) {
            this.grid[x][z][y].id = topBlocks.bottom;
          }
        }
      }
    }

    //ADDING WATER AND SAND
    let waterN = 0;
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        waterN = 0;
        for (let y = 0; y < maxHeight; y++) {
          if (waterN > 0) {
            this.grid[x][z][y].id = 8;
            waterN -= 1;
          }
          if (this.grid[x][z][y].top && y < waterLevel) {
            waterN = waterLevel - y;
            this.grid[x][z][y].id = 3;
            this.grid[x][z][y] = false;
          }
          if (this.grid[x][z][y].top && y === waterLevel) {
            this.grid[x][z][y].id = 12;
          }
        }
      }
    }

    //ADDING DECORATIONS
    const R = 4;
    const treeNoiseMap = new Array(size);
    for (let x = 0; x < size; x++) {
      treeNoiseMap[x] = new Array(size);
      for (let z = 0; z < size; z++) {
        treeNoiseMap[x][z] =
          (noise.simplex2(x + origin.x * size, z + origin.z * size) + 1) / 2;
      }
    }
    for (let x = 2; x < size - 2; x++) {
      for (let z = 2; z < size - 2; z++) {
        let max = 0;
        for (let xn = x - R; xn <= x + R; xn++) {
          for (let zn = z - R; zn <= z + R; zn++) {
            if (xn >= 0 && zn >= 0 && xn < size && zn < size) {
              let e = treeNoiseMap[xn][zn];
              if (e > max) {
                max = e;
              }
            }
          }
        }
        if (treeNoiseMap[x][z] == max) {
          for (let y = 0; y < maxHeight; y++) {
            const block = this.grid[x][z][y];
            if (block.top) {
              const biomeId = biome.getBiome(
                x + origin.x * size,
                z + origin.z * size
              );
              for (let stringCoords in biome.decorations[biomeId]) {
                let coords = stringCoords
                  .substring(1, stringCoords.length - 1)
                  .split(",");
                coords[0] = parseInt(coords[0]);
                coords[1] = parseInt(coords[1]);
                coords[2] = parseInt(coords[2]);
                this.grid[x + coords[0]][z + coords[1]][y + coords[2] + 1].id =
                  biome.decorations[biomeId][stringCoords];
              }
            }
          }
        }
      }
    }

    /**
     * Generate blocks according to chunk grid and setup initial
     * render faces based on the surrounding blocks in the grid.
     */
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        for (let y = 0; y < maxHeight; y++) {
          const gridBlock = this.grid[x][z][y];
          if (gridBlock.id !== 0) {
            const tempBlock = this._getEmptyBlock(
              gridBlock.id,
              this.origin.x * dimension * size + x * dimension,
              y * dimension,
              this.origin.z * dimension * size + z * dimension
            );

            this.blocks.push(tempBlock);

            const specifics = {
              top: y === maxHeight - 1 || this.grid[x][z][y + 1].id === 0,
              bottom: y === 0 || this.grid[x][z][y - 1].id === 0,
              sides: [
                z === size - 1 || this.grid[x][z + 1][y].id === 0,
                x === size - 1 || this.grid[x + 1][z][y].id === 0,
                z === 0 || this.grid[x][z - 1][y].id === 0,
                x === 0 || this.grid[x - 1][z][y].id === 0
              ]
            };

            this.meshGroup.push(...tempBlock.getTotalMesh(specifics));
          }
        }
      }
    }

    // TODO: Wait till all chunks loaded.
    this.mesh = Helpers.mergeMeshes(this.meshGroup);
    this.mesh.name = this.name = Helpers.getChunkTag(origin);
  }

  _getEmptyBlock = (id, x, y, z) => new BaseBlock(id, x, y, z);
}

export default BaseChunk;
