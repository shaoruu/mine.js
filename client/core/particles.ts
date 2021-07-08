import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
  Vector3,
  Object3D,
  Vector2,
} from 'three';

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
  impulseFunc: (f: number) => Coords3;
};

type Group = {
  mesh: Points;
  particles: EntityType[];
  update: () => void;
};

const defaultBreakOptions: ParticleOptions = {
  count: 6,
  force: 6,
  timeout: 3000,
  gravity: true,
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

  public material: ShaderMaterial;

  constructor(public engine: Engine, public options: ParticlesOptionsType) {
    engine.on('ready', () => {
      const count = engine.config.registry.countPerSide;

      this.material = new ShaderMaterial({
        uniforms: {
          diffuseTexture: { value: this.engine.registry.atlasUniform.value },
          pointMultiplier: {
            value: (window.innerHeight / (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0))) * PARTICLE_SCALE,
          },
          repeat: {
            value: new Vector2(1 / count, 1 / count),
          },
          sunlightIntensity: engine.world.uSunlightIntensity,
        },
        vertexShader: ParticlesVertexShader,
        fragmentShader: ParticlesFragmentShader,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        vertexColors: true,
      });
    });
  }

  addBreakParticles = (type: number, vCoords: Coords3, options: Partial<ParticleOptions> = {}) => {
    this.sanityCheck();

    const { count, force, gravity, timeout, impulseFunc } = { ...defaultBreakOptions, ...options };

    const [x, y, z] = vCoords;
    const geometry = new BufferGeometry();

    const red = this.engine.world.getRedLight(vCoords) / 15;
    const green = this.engine.world.getGreenLight(vCoords) / 15;
    const blue = this.engine.world.getBlueLight(vCoords) / 15;
    const sun = this.engine.world.getSunlight(vCoords) / 15;

    const particles = [];
    const lights = [];
    const uvs = [];

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
        { gravityMultiplier: gravity ? 1 : 0 },
      );
      entity.body.applyImpulse(impulseFunc(force));
      particles.push(entity);
      uvs.push(typeUVArr[i % typeUVArr.length]);

      // TODO: fix this. this is costly
      lights.push(red, green, blue, sun);
    }

    geometry.setAttribute('uv', new Float32BufferAttribute(Helper.flatten(uvs), 2));
    geometry.setAttribute('lights', new Float32BufferAttribute(lights, 4));
    geometry.attributes.uv.needsUpdate = true;

    const points = new Points(geometry, this.material);
    points.renderOrder = 10000;
    this.engine.rendering.scene.add(points);

    const group = {
      mesh: points,
      particles,
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

  private removeGroup(group) {
    const index = this.groups.indexOf(group);
    if (index > -1) {
      const [group] = this.groups.splice(index, 1);
      this.engine.rendering.scene.remove(group.mesh);
      group.particles.forEach((entity) => {
        this.engine.entities.removeEntity(entity.name);
      });
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
