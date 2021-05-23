import {
  BackSide,
  LinearMipMapLinearFilter,
  NearestFilter,
  RepeatWrapping,
  Texture,
  MeshBasicMaterial,
  BoxBufferGeometry,
} from 'three';
import { Mesh, DoubleSide } from 'three';

import { Peer } from './peer';

type HeadOptionsType = {
  headDimension: number;
};

class Head {
  public mesh: Mesh;
  public material: MeshBasicMaterial;
  public geometry: BoxBufferGeometry;

  constructor(public peer: Peer, public options: HeadOptionsType) {
    const { headDimension } = this.options;

    this.geometry = new BoxBufferGeometry(headDimension, headDimension, headDimension);
    this.material = this.createCanvasMaterial();

    this.mesh = new Mesh(this.geometry, this.material);
    this.drawFaces();
  }

  createHead() {}

  createCanvasMaterial = () => {
    const canvas = document.createElement('canvas');
    canvas.height = 512;
    canvas.width = 512;

    const material = new MeshBasicMaterial({
      side: DoubleSide,
      map: new Texture(canvas),
      transparent: true,
      depthWrite: false,
      fog: false,
    });

    material.map.magFilter = NearestFilter;
    material.map.minFilter = LinearMipMapLinearFilter;
    material.map.wrapS = RepeatWrapping;
    material.map.wrapT = RepeatWrapping;
    material.map.needsUpdate = true;
    material.polygonOffset = true;
    material.polygonOffsetFactor = -0.5;

    return material;
  };

  drawFaces = () => {};
}

export { Head };
