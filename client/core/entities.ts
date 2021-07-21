import TWEEN from '@tweenjs/tween.js';
import { Object3D, Vector3, LoadingManager, Mesh, MeshStandardMaterial, MeshBasicMaterial } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { AABB, Brain, PhysicalType, BodyOptionsType, Coords3, EntityType, createMaterial_ } from '../libs';
import { Entity } from '../libs/entity';
import { Helper } from '../utils';

import { Engine } from './engine';

type EntityPrototype = {
  etype: string;
  brain: string;
  model: {
    scale: number;
    object: string;
  };
  rigidbody: {
    aabb: [number, number, number];
    autoStep: boolean;
    friction: number;
    gravityMultiplier: number;
    mass: number;
    restitution: number;
  };
};

type EntitiesOptionsType = {
  movementLerp: boolean;
  movementLerpFactor: number;
  maxEntities: number;
  maxProcessPerFrame: number;
  prototypes?: { [key: string]: EntityPrototype };
};

class Entities {
  public physicals: Map<string, PhysicalType> = new Map();
  public entities: Map<string, Entity> = new Map();

  private updates: [string, string, Coords3, Coords3][] = [];
  private prototypes: Map<string, Entity> = new Map();

  constructor(public engine: Engine, public options: EntitiesOptionsType) {
    engine.on('ready', () => {
      const { prototypes } = this.options;

      const keys = Object.keys(prototypes);

      let count = 0;
      const onFinish = (name: string, obj: Object3D) => {
        count++;

        const entity = new Entity(this, name, obj);

        const {
          rigidbody: { aabb },
          model: { scale },
        } = prototypes[name];

        entity.setPosition([0.5, 53.5, -0.5]);
        entity.prototype.rotateY(Math.PI / 2);
        entity.prototype.scale.set(...aabb);
        entity.prototype.scale.multiplyScalar(scale);

        entity.prototype.children.forEach((child) => {
          const actual = child.children[0] as Mesh;
          const { map } = actual.material as MeshStandardMaterial;
          const overwriteMaterial = new MeshBasicMaterial({ map });
          actual.material = overwriteMaterial;
        });

        this.prototypes.set(name.toLowerCase(), entity);

        if (count === keys.length) {
          engine.emit('entities-loaded');
        }
      };

      const manager = new LoadingManager();
      const gltfLoader = new GLTFLoader(manager);
      gltfLoader.setPath(Helper.getServerURL({ path: '/models/', clear: true }).toString());

      keys.forEach((name) => {
        const {
          model: { object },
        } = prototypes[name];

        gltfLoader.load(object, (obj) => {
          onFinish(name, obj.scene);
        });
      });
    });
  }

  addPhysical = (
    name: string,
    object: Object3D,
    size: [number, number, number],
    offsets: [number, number, number] = [0, 0, 0],
    needsBrain = true,
    options: Partial<BodyOptionsType> = {},
  ) => {
    if (this.physicals.size >= this.options.maxEntities)
      throw new Error(`Failed to add entity, ${name}: max entities reached.`);

    const { physics } = this.engine;

    const { x, y, z } = object.position;
    const [sx, sy, sz] = size;
    const [ox, oy, oz] = offsets;

    const aabb = new AABB([x - sx / 2 - ox, y - sy / 2 - oy, z - sz / 2 - oz], size);
    const rigidBody = physics.core.addBody({ aabb, ...options });

    const brain = needsBrain ? new Brain(rigidBody) : null;

    const newPhysical = {
      name,
      brain,
      object,
      offsets,
      body: rigidBody,
    };

    this.physicals.set(name, newPhysical);

    return newPhysical;
  };

  getObject = (type: string): Entity => {
    return this.prototypes.get(type.toLowerCase()).clone();
  };

  handleServerUpdate = (id: string, type: string, position: Coords3, lookAt?: Coords3) => {
    this.updates.push([id, type, position, lookAt]);
    if (this.updates.length >= this.engine.config.network.maxServerUpdates) {
      this.updates.shift();
    }
  };

  updateEntity = (id: string, type: string, position: Coords3, lookAt?: Coords3) => {
    if (!this.engine.assetsLoaded) return;

    let entity = this.entities.get(id);

    if (!entity) {
      const object = this.getObject(type);
      this.engine.rendering.scene.add(object.mesh);
      entity = object;
    } else {
      entity.setPosition(position);
      if (lookAt.length > 0) {
        entity.setTarget(new Vector3(...lookAt));
      } else {
        entity.setTarget(null);
      }
    }

    this.entities.set(id, entity);

    return entity;
  };

  removePhysical = (name: string) => {
    const entity = this.physicals.get(name);
    if (!entity) return;
    this.engine.physics.core.removeBody(entity.body);
    return this.physicals.delete(name);
  };

  preTick = () => {
    const { maxProcessPerFrame } = this.options;

    this.updates.splice(0, maxProcessPerFrame).forEach((update) => {
      this.updateEntity(...update);
    });

    this.physicals.forEach((entity) => {
      if (entity.brain) {
        entity.brain.tick(this.engine.clock.delta);
      }
    });

    this.prototypes.forEach((p) => {
      // const temp = p.mesh.position.clone();
      // temp.x = Math.sin(performance.now() / 1000);
      // p.setPosition([temp.x, temp.y, temp.z]);
      p.tick();
    });

    this.entities.forEach((p) => {
      p.tick();
    });
  };

  tick = () => {
    const { movementLerp, movementLerpFactor } = this.options;
    this.physicals.forEach(({ object, body, offsets }) => {
      const [px, py, pz] = this.engine.physics.getPositionFromRB(body);
      if (movementLerp) {
        object.position.lerp(new Vector3(px + offsets[0], py + offsets[1], pz + offsets[2]), movementLerpFactor);
      } else {
        object.position.set(px + offsets[0], py + offsets[1], pz + offsets[2]);
      }
    });
  };
}

export { Entities, EntitiesOptionsType };
