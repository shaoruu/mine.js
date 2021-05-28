import { Vector3, Quaternion, NearestFilter } from 'three';
import SpriteText from 'three-spritetext';

import { Head } from './head';

type PeerOptionsType = {
  lerpFactor: number;
  headColor: string;
  headDimension: number;
  maxNameDistance: number;
};

const defaultPeerOptions: PeerOptionsType = {
  lerpFactor: 0.6,
  headColor: '#94d0cc',
  headDimension: 0.4,
  maxNameDistance: 50,
};

class Peer {
  public head: Head;

  public name = 'testtesttest';
  public newPosition: Vector3;
  public newQuaternion: Quaternion;
  public nameMesh: SpriteText;

  constructor(public id: string, public options: PeerOptionsType = defaultPeerOptions) {
    const { headDimension } = this.options;

    this.head = new Head({ headDimension });

    this.newPosition = this.head.mesh.position;
    this.newQuaternion = this.head.mesh.quaternion;

    this.nameMesh = new SpriteText(this.name, options.headDimension / 3);
    this.nameMesh.position.y += options.headDimension * 1;
    this.nameMesh.backgroundColor = '#00000077';
    this.nameMesh.material.depthTest = false;

    const image = this.nameMesh.material.map;

    if (image) {
      image.minFilter = NearestFilter;
      image.magFilter = NearestFilter;
    }

    this.head.mesh.add(this.nameMesh);
  }

  update = (name: string, position: Vector3, quaternion: Quaternion) => {
    this.name = name;
    this.nameMesh.text = name;
    this.newPosition = position;
    this.newQuaternion = quaternion;
  };

  tick = (camPos: Vector3) => {
    const { lerpFactor, maxNameDistance } = this.options;

    this.head.mesh.position.lerp(this.newPosition, lerpFactor);
    this.head.mesh.quaternion.slerp(this.newQuaternion, lerpFactor);

    this.nameMesh.visible = this.head.mesh.position.distanceTo(camPos) < maxNameDistance;
  };

  get mesh() {
    return this.head.mesh;
  }
}

export { Peer };
