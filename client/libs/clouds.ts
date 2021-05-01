import ndarray from 'ndarray';
import { BufferGeometry, Color, Float32BufferAttribute, Group, Int8BufferAttribute, Mesh, ShaderMaterial } from 'three';
import pool from 'typedarray-pool';

import { Rendering } from '../core';
import { Helper } from '../utils';

import CloudsFragmentShader from './shaders/clouds/fragment.glsl';
import CloudsVertexShader from './shaders/clouds/vertex.glsl';
import { simpleCull } from './simple-cull';

import workerSrc from '!raw-loader!./workers/generate-clouds.worker';

type CloudsOptionsType = {
  seed: number;
  scale: number;
  width: number;
  height: number;
  count: number;
  worldHeight: number;
  dimension: number;
  threshold: number;
  speed: number;
  lerpFactor: number;
  fogFarFactor: number;
  color: string;
  alpha: number;
};

const defaultCloudsOptions: CloudsOptionsType = {
  seed: 1024,
  scale: 0.03, // the lower value, the fatter the clouds
  width: 6,
  height: 1,
  count: 32, // grid size
  worldHeight: 800,
  dimension: 60,
  threshold: 0.25,
  speed: 16,
  lerpFactor: 0.7,
  fogFarFactor: 5,
  color: '#fff',
  alpha: 0.75,
};

class Clouds {
  public array: ndarray;
  public meshes: Mesh[] = [];
  public material: ShaderMaterial;

  private cloudOffsetCount = 0;
  private initialized = false;
  private cloudGroup = new Group();

  constructor(public rendering: Rendering, public options: Partial<CloudsOptionsType> = {}) {
    const { worldHeight, fogFarFactor, color, alpha } = (this.options = {
      ...defaultCloudsOptions,
      ...options,
    });

    this.material = new ShaderMaterial({
      opacity: 0.2,
      alphaTest: 0.3,
      transparent: true,
      vertexShader: CloudsVertexShader,
      fragmentShader: CloudsFragmentShader,
      uniforms: {
        ...rendering.fogUniforms,
        uFogNear: {
          value: worldHeight,
        },
        uFogFar: {
          value: worldHeight * fogFarFactor,
        },
        uCloudColor: {
          value: new Color(color),
        },
        uCloudAlpha: {
          value: alpha,
        },
      },
    });

    this.initialize();
  }

  initialize = async () => {
    const { count } = this.options;

    for (let i = 0; i < count; i++) {
      await this.makeRow(i);
    }

    this.rendering.scene.add(this.cloudGroup);

    this.initialized = true;
  };

  tick = (delta: number) => {
    if (!this.initialized) return;

    const { speed, lerpFactor, width, count, dimension } = this.options;

    this.meshes.forEach((mesh) => {
      const newPosition = mesh.position.clone();

      newPosition.z -= speed * delta;
      mesh.position.lerp(newPosition, lerpFactor);

      if (mesh.position.z <= -(width * count * dimension) / 2) {
        this.meshes.shift();
        this.cloudGroup.remove(mesh);
        this.makeRow(this.cloudOffsetCount);
      }
    });

    const { threeCamera } = this.rendering.engine.camera;
    this.cloudGroup.position.x = threeCamera.position.x;
    this.cloudGroup.position.z = threeCamera.position.z;
  };

  makeRow = async (zOffset: number) => {
    const { width, height, scale, threshold, worldHeight, count, seed, dimension } = this.options;

    const totalWidth = count * width;
    const paddedTotalWidth = count * width + 2;
    const array = ndarray(pool.mallocUint8(paddedTotalWidth * height * (width + 2)), [
      paddedTotalWidth,
      height,
      width + 2,
    ]);

    const buffer = (<Uint8Array>array.data).buffer.slice(0);

    const generator = Helper.loadWorker(workerSrc);
    generator.postMessage(
      {
        data: buffer,
        configs: {
          seed,
          scale,
          threshold,
          min: [0, 0, zOffset * width],
          max: [paddedTotalWidth, height, (zOffset + 1) * width + 2],
          stride: array.stride,
        },
      },
      [buffer],
    );

    await new Promise<void>((resolve) => {
      generator.onmessage = async (e) => {
        const newBuffer = new Uint8Array(e.data);
        array.data = newBuffer;

        const { positions, indices, normals } = await simpleCull(array, {
          dimension,
          min: [1, 0, 1],
          max: [paddedTotalWidth - 1, height, width + 1],
          realMin: [0, 0, 0],
          realMax: [paddedTotalWidth, height, width + 2],
        });

        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new Int8BufferAttribute(normals, 3));
        geometry.setIndex(Array.from(indices));

        const mesh = new Mesh(geometry, this.material);

        const previousMesh = this.meshes[this.meshes.length - 1];
        const x = (-totalWidth / 2) * dimension;
        const z = previousMesh
          ? previousMesh.position.z + width * dimension
          : (zOffset * width - totalWidth / 2) * dimension;
        mesh.position.set(x, worldHeight, z);

        this.meshes.push(mesh);
        this.cloudGroup.add(mesh);

        resolve();
      };
    });

    this.cloudOffsetCount++;
  };
}

export { Clouds };
