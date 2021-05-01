import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry } from 'three';

import { Rendering } from '../core';

import SkyFragmentShader from './shaders/sky/fragment.glsl';
import SkyVertexShader from './shaders/sky/vertex.glsl';

type SkyOptionsType = {
  domeOffset: number;
  dimension: number;
  topColor: string;
  bottomColor: string;
  lerpFactor: number;
};

const defaultSkyOptions: SkyOptionsType = {
  domeOffset: 600,
  dimension: 4000,
  // topColor: '#74B3FF',
  // bottomColor: '#ffffff',
  topColor: '#000',
  bottomColor: '#000',
  lerpFactor: 0.2,
};

class Sky {
  public options: SkyOptionsType;

  public geometry: SphereGeometry;
  public material: ShaderMaterial;

  public mesh: Mesh;

  private newTopColor: Color;
  private newBottomColor: Color;

  constructor(public rendering: Rendering, options: Partial<SkyOptionsType> = {}) {
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

    rendering.scene.add(this.mesh);
  }

  setTopColor = (color: Color | string) => {
    this.newTopColor = new Color(color);
  };

  setBottomColor = (color: Color | string) => {
    this.newBottomColor = new Color(color);
  };

  tick = (delta: number) => {
    const { lerpFactor } = this.options;

    if (this.newTopColor) {
      this.material.uniforms.topColor.value.lerpHSL(this.newTopColor, lerpFactor);
    }

    if (this.newBottomColor) {
      this.material.uniforms.bottomColor.value.lerpHSL(this.newBottomColor, lerpFactor);
    }
  };
}

export { Sky };
