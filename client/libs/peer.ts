import { Mesh, BoxBufferGeometry, MeshBasicMaterial, DoubleSide, Vector3, Quaternion } from 'three';

type PeerOptionsType = {
  lerpFactor: number;
  headColor: string;
  headDimension: number;
};

const defaultPeerOptions: PeerOptionsType = {
  lerpFactor: 0.6,
  headColor: '#94d0cc',
  headDimension: 0.4,
};

class Peer {
  public mesh: Mesh;

  public newPosition: Vector3;
  public newQuaternion: Quaternion;

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
  }

  update(position: Vector3, quaternion: Quaternion) {
    this.newPosition = position;
    this.newQuaternion = quaternion;
  }

  tick() {
    const { lerpFactor } = this.options;

    this.mesh.position.lerp(this.newPosition, lerpFactor);
    this.mesh.quaternion.slerp(this.newQuaternion, lerpFactor);
  }
}

export { Peer };
