import TWEEN from '@tweenjs/tween.js';
import { BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, Vector3, Object3D, Vector2 } from 'three';

import { EntityType, Coords3 } from '../libs/types';
import { Helper } from '../utils';

import ParticlesFragmentShader from './shaders/particles/fragment.glsl';
import ParticlesVertexShader from './shaders/particles/vertex.glsl';

import { Engine } from '.';

type ParticlesOptionsType = {
  count: number;
};

type ParticleOptions = {
  count: number;
  force: number;
  timeout: number;
  gravity: boolean;
  fadeTimeout: number;
  impulseFunc: (f: number) => Coords3;
};

type Group = {
  mesh: Points;
  particles: EntityType[];
  options: ParticleOptions;
  update: () => void;
};

const defaultBreakOptions: ParticleOptions = {
  count: 6,
  force: 6,
  timeout: 3000,
  gravity: true,
  fadeTimeout: 50,
  impulseFunc: (force) => [
    Math.random() * force - force / 2,
    (Math.random() * force) / 2,
    Math.random() * force - force / 2,
  ],
};

const PARTICLE_SCALE = 0.6;
const MAX_GROUPS = 3;
const MAX_PARTICLES = 100;
class Particles {
  public groups: Group[] = [];

  constructor(public engine: Engine, public options: ParticlesOptionsType) {}

  addBreakParticles = (voxels: { voxel: Coords3; type: number }[], options: Partial<ParticleOptions> = {}) => {
    this.sanityCheck();

    const allOptions = { ...defaultBreakOptions, ...options } as ParticleOptions;
    const { count, force, gravity, timeout, impulseFunc } = allOptions;

    const particles = [];
    const lights = [];
    const uvs = [];

    const geometry = new BufferGeometry();

    voxels.forEach(({ voxel, type }) => {
      if (type === 0) return;

      const [x, y, z] = voxel;

      const red = this.engine.world.getRedLight(voxel) / 15;
      const green = this.engine.world.getGreenLight(voxel) / 15;
      const blue = this.engine.world.getBlueLight(voxel) / 15;
      const sun = this.engine.world.getSunlight(voxel) / 15;

      const typeUVObj = this.engine.registry.getUV(type);
      const typeUVArr = [];

      Object.values(typeUVObj).forEach((uv) => {
        typeUVArr.push(uv[0][uv[1]]);
      });

      for (let i = 0; i < count; i++) {
        const entity = this.engine.entities.addEntity(
          `${i}${Math.floor(Math.random() * 100000)}`,
          { position: new Vector3(x + Math.random(), y + Math.random(), z + Math.random()) } as Object3D,
          [0.1, 0.1, 0.1],
          [0, 0.1, 0],
          false,
          { gravityMultiplier: gravity ? 1 : 0, restitution: 0.3 },
        );
        entity.body.applyImpulse(impulseFunc(force));
        particles.push(entity);
        uvs.push(typeUVArr[i % typeUVArr.length]);

        // TODO: fix this. this is costly
        lights.push(red, green, blue, sun);
      }
    });

    if (particles.length === 0) {
      return;
    }

    geometry.setAttribute('uv', new Float32BufferAttribute(Helper.flatten(uvs), 2));
    geometry.setAttribute('lights', new Float32BufferAttribute(lights, 4));
    geometry.attributes.uv.needsUpdate = true;

    const { countPerSide, textureSize } = this.engine.config.registry;
    const material = new ShaderMaterial({
      uniforms: {
        uTexture: { value: this.engine.registry.atlasUniform.value },
        uPointSize: {
          value: (window.innerHeight / (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0))) * PARTICLE_SCALE,
        },
        uRepeat: {
          value: new Vector2(1 / countPerSide - (0.1 / textureSize) * 2, 1 / countPerSide - (0.1 / textureSize) * 2),
        },
        uScale: {
          value: 1,
        },
        uSunlightIntensity: this.engine.world.uSunlightIntensity,
      },
      vertexShader: ParticlesVertexShader,
      fragmentShader: ParticlesFragmentShader,
      depthTest: true,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
    });

    const points = new Points(geometry, material);
    points.renderOrder = 10000;
    this.engine.rendering.scene.add(points);

    const group = {
      mesh: points,
      particles,
      options: allOptions,
      update: () => {
        this.updatePositions(geometry, particles);
      },
    };

    this.groups.push(group);

    setTimeout(() => {
      this.removeGroup(group);
    }, timeout);
  };

  tick = () => {
    this.groups.forEach((g) => g.update());
  };

  private removeGroup(group: Group, animate = true) {
    const { entities, rendering } = this.engine;

    const index = this.groups.indexOf(group);
    if (index > -1) {
      const [group] = this.groups.splice(index, 1);
      const { mesh, particles, options } = group;

      particles.forEach((entity) => {
        entities.removeEntity(entity.name);
      });

      if (animate) {
        // @ts-ignore
        new TWEEN.Tween(group.mesh.material.uniforms.uScale)
          .to({ value: 0 }, options.fadeTimeout)
          .start()
          .onComplete(() => {
            rendering.scene.remove(mesh);
          });
      } else {
        rendering.scene.remove(mesh);
      }
    }
  }

  private updatePositions = (geometry: BufferGeometry, particles: EntityType[]) => {
    const positions = [];
    for (const particle of particles) {
      const { x, y, z } = particle.object.position;
      positions.push(x, y, z);
    }
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.attributes.position.needsUpdate = true;
  };

  private sanityCheck() {
    if (this.groups.length > MAX_GROUPS) {
      let total = 0;
      this.groups.forEach((g) => (total += g.particles.length));

      if (total > MAX_PARTICLES) {
        this.removeGroup(this.groups[0]);
      }
    }
  }
}

export { Particles, ParticlesOptionsType };
