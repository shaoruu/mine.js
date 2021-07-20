import {
  Object3D,
  Vector3,
  BoxBufferGeometry,
  Mesh,
  LoadingManager,
  MeshBasicMaterial,
  MeshPhongMaterial,
  BoxHelper,
  AmbientLight,
} from 'three';
import { Group, Matrix4, Quaternion } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

import { AABB, Brain, PhysicalType, BodyOptionsType, Coords3, EntityType, createMaterial_ } from '../libs';
import { Entity } from '../libs/entity';
import { Helper } from '../utils';

import { Engine } from './engine';

type EntityPrototype = {
  etype: string;
  brain: string;
  model: {
    material: string;
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
  public entities: Map<string, EntityType> = new Map();

  private updates: [string, string, Coords3, [number, number, number, number], Coords3][] = [];
  private prototypes: Map<string, Entity> = new Map();

  constructor(public engine: Engine, public options: EntitiesOptionsType) {
    engine.on('ready', () => {
      const { prototypes } = this.options;

      const keys = Object.keys(prototypes);

      const manager = new LoadingManager();
      const mtlLoader = new MTLLoader();

      const path = Helper.getServerURL({ path: '/models/', clear: true }).toString();
      mtlLoader.setPath(path);

      engine.rendering.scene.add(new AmbientLight());

      let count = 0;
      const onFinish = (name: string, obj: Object3D) => {
        count++;

        const prototype = new Entity(this, name, obj);

        prototype.mesh.position.set(0, 55, -3);
        const scale = prototypes[name].rigidbody.aabb;
        prototype.mesh.scale.set(...scale);

        const helper = new BoxHelper(prototype.mesh, 0xffff00);
        prototype.mesh.add(helper);

        this.prototypes.set(name.toLowerCase(), prototype);

        if (count === keys.length) {
          engine.emit('entities-loaded');
        }
      };

      const gltfLoader = new GLTFLoader(manager);
      gltfLoader.setPath(path);

      keys.forEach((name) => {
        const {
          model: { object },
        } = prototypes[name];

        gltfLoader.load(object, (obj) => {
          function dumpObject(obj, lines = [], isLast = true, prefix = '') {
            const localPrefix = isLast ? '└─' : '├─';
            lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
            const newPrefix = prefix + (isLast ? '  ' : '│ ');
            const lastNdx = obj.children.length - 1;
            obj.children.forEach((child, ndx) => {
              const isLast = ndx === lastNdx;
              dumpObject(child, lines, isLast, newPrefix);
            });
            return lines;
          }

          console.log(dumpObject(obj.scene).join('\n'));

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
    console.log(this.prototypes);
    return this.prototypes.get(type.toLowerCase()).clone();
  };

  handleServerUpdate = (
    id: string,
    type: string,
    position: Coords3,
    rotation: [number, number, number, number],
    lookAt?: Coords3,
  ) => {
    this.updates.push([id, type, position, rotation, lookAt]);
  };

  updateEntity = (id: string, type: string, position: Coords3, rotation: [...Coords3, number], lookAt?: Coords3) => {
    if (!this.engine.assetsLoaded) return;

    let entity = this.entities.get(id);

    if (!entity) {
      const object = this.getObject(type);

      this.engine.rendering.scene.add(object.mesh);
      object.mesh.scale.multiplyScalar(5);

      entity = {
        type,
        object,
        position,
        rotation,
      };
    } else {
      entity.position = position;
      if (lookAt.length > 0) {
        entity.object.setTarget(new Vector3(...lookAt));
      } else {
        entity.rotation = rotation;
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

    this.entities.forEach((p) => {
      p.object.tick();
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
    this.entities.forEach(({ object, position: [px, py, pz] }) => {
      if (movementLerp) {
        object.mesh.position.lerp(new Vector3(px, py, pz), movementLerpFactor);
      } else {
        object.mesh.position.set(px, py, pz);
      }
    });
  };
}

export { Entities, EntitiesOptionsType };
