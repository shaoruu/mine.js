import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry } from 'three';

import SkyFragmentShader from './shaders/sky/fragment.glsl';
import SkyVertexShader from './shaders/sky/vertex.glsl';

type SkyOptionsType = {
  domeOffset: number;
  dimension: number;
  topColor: string;
  bottomColor: string;
};

const defaultSkyOptions: SkyOptionsType = {
  domeOffset: 600,
  dimension: 4000,
  topColor: '#74B3FF',
  bottomColor: '#eeeeee',
};

class Sky {
  public options: SkyOptionsType;

  public geometry: SphereGeometry;
  public material: ShaderMaterial;

  public mesh: Mesh;

  constructor(options: Partial<SkyOptionsType> = {}) {
    const { dimension, topColor, bottomColor, domeOffset } = (this.options = {
      ...defaultSkyOptions,
      ...options,
    });

    const uniforms = {
      topColor: { value: new Color(topColor) },
      bottomColor: { value: new Color(bottomColor) },
      offset: { value: domeOffset },
      exponent: { value: 0.6 },
    };

    this.geometry = new SphereGeometry(dimension);
    this.material = new ShaderMaterial({
      uniforms,
      vertexShader: SkyVertexShader,
      fragmentShader: SkyFragmentShader,
      side: BackSide,
    });

    this.mesh = new Mesh(this.geometry, this.material);
  }
}

export { Sky };
