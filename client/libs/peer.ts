import {
  Mesh,
  BoxBufferGeometry,
  MeshBasicMaterial,
  DoubleSide,
  Vector3,
  Quaternion,
  NearestFilter,
  sRGBEncoding,
} from 'three';
import SpriteText from 'three-spritetext';

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
  public mesh: Mesh;

  public name = 'testtesttest';
  public newPosition: Vector3;
  public newQuaternion: Quaternion;
  public nameMesh: SpriteText;

  public static geometry: BoxBufferGeometry;
  public static material: MeshBasicMaterial;

  public static setupBasics = ({ headColor, headDimension }: PeerOptionsType) => {
    if (Peer.geometry && Peer.material) return;

    Peer.geometry = new BoxBufferGeometry(headDimension, headDimension, headDimension);
    Peer.material = new MeshBasicMaterial({ color: headColor, side: DoubleSide });
  };

  constructor(public id: string, public options: PeerOptionsType = defaultPeerOptions) {
    Peer.setupBasics(this.options);

    this.mesh = new Mesh(Peer.geometry, Peer.material);
    this.newPosition = this.mesh.position;
    this.newQuaternion = this.mesh.quaternion;

    this.nameMesh = new SpriteText(this.name, options.headDimension / 3);
    this.nameMesh.position.y += options.headDimension * 1;
    this.nameMesh.backgroundColor = '#00000077';
    this.nameMesh.material.depthTest = false;

    const image = this.nameMesh.material.map;
    if (image) {
      image.minFilter = NearestFilter;
      image.magFilter = NearestFilter;
    }

    this.mesh.add(this.nameMesh);
  }

  update(name: string, position: Vector3, quaternion: Quaternion) {
    this.nameMesh.text = name;
    this.newPosition = position;
    this.newQuaternion = quaternion;
  }

  tick(camPos: Vector3) {
    const { lerpFactor, maxNameDistance } = this.options;

    this.mesh.position.lerp(this.newPosition, lerpFactor);
    this.mesh.quaternion.slerp(this.newQuaternion, lerpFactor);

    this.nameMesh.visible = this.mesh.position.distanceTo(camPos) < maxNameDistance;
  }
}

export { Peer };
