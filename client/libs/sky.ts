import {
  BackSide,
  BoxBufferGeometry,
  Color,
  Group,
  LinearMipMapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  RepeatWrapping,
  ShaderMaterial,
  SphereGeometry,
  Texture,
} from 'three';

import { Rendering } from '../core';

import SkyFragmentShader from './shaders/sky/fragment.glsl';
import SkyVertexShader from './shaders/sky/vertex.glsl';

type SkyOptionsType = {
  domeOffset: number;
  dimension: number;
  topColor: string;
  bottomColor: string;
  lerpFactor: number;
  starsCount: number;
  moonRadius: number;
  moonColor: string;
  sunColor: string;
};

const defaultSkyOptions: SkyOptionsType = {
  domeOffset: 600,
  dimension: 6000,
  // topColor: '#74B3FF',
  // bottomColor: '#ffffff',
  topColor: '#000',
  bottomColor: '#000',
  lerpFactor: 0.2,
  starsCount: 300,
  moonRadius: 20,
  moonColor: '#e6e2d1',
  sunColor: '#f8ffb5',
};

type SkyBoxSidesType = 'top' | 'front' | 'back' | 'left' | 'right' | 'bottom';

const SKY_BOX_SIDES = ['back', 'front', 'top', 'bottom', 'left', 'right'];

const STAR_COLORS = [
  '#FFFFFF',
  '#FFFFFF',
  '#FFFFFF',
  '#FFFFFF',
  '#FFFFFF',
  '#FFFFFF',
  '#FFFFFF',
  '#FFFFFF',
  '#FFFFFF',
  '#FFFFFF',
  '#8589FF',
  '#FF8585',
];

class Sky {
  public options: SkyOptionsType;

  public shadingGeometry: SphereGeometry;
  public shadingMaterial: ShaderMaterial;
  public shadingMesh: Mesh;

  public boxGeometry: BoxBufferGeometry;
  public boxMaterials: Map<string, MeshBasicMaterial> = new Map();
  public boxMesh: Mesh;

  private newTopColor: Color;
  private newBottomColor: Color;

  private meshGroup = new Group();

  constructor(public rendering: Rendering, options: Partial<SkyOptionsType> = {}) {
    this.options = {
      ...defaultSkyOptions,
      ...options,
    };

    this.createSkyShading();
    this.createSkyBox();

    rendering.scene.add(this.meshGroup);

    this.paint('sides', 'stars');
    this.paint('top', 'stars');
    this.paint('top', 'moon');
    this.paint('bottom', 'sun');
  }

  createSkyShading = () => {
    const { dimension, topColor, bottomColor, domeOffset } = this.options;

    const uniforms = {
      topColor: { value: new Color(topColor) },
      bottomColor: { value: new Color(bottomColor) },
      offset: { value: domeOffset },
      exponent: { value: 0.6 },
    };

    this.shadingGeometry = new SphereGeometry(dimension);
    this.shadingMaterial = new ShaderMaterial({
      uniforms,
      vertexShader: SkyVertexShader,
      fragmentShader: SkyFragmentShader,
      depthWrite: false,
      side: BackSide,
    });

    this.shadingMesh = new Mesh(this.shadingGeometry, this.shadingMaterial);

    this.meshGroup.add(this.shadingMesh);
  };

  createSkyBox = () => {
    const { dimension } = this.options;

    const materials: MeshBasicMaterial[] = [];

    this.boxGeometry = new BoxBufferGeometry(dimension * 0.9, dimension * 0.9, dimension * 0.9);
    for (const face of SKY_BOX_SIDES) {
      const canvasMaterial = this.createCanvasMaterial();
      this.boxMaterials.set(face, canvasMaterial);
      materials.push(canvasMaterial);
    }

    this.boxMesh = new Mesh(this.boxGeometry, materials);

    this.meshGroup.add(this.boxMesh);
  };

  createCanvasMaterial = () => {
    const canvas = document.createElement('canvas');
    canvas.height = 512;
    canvas.width = 512;

    const material = new MeshBasicMaterial({
      side: BackSide,
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

  setTopColor = (color: Color | string) => {
    this.newTopColor = new Color(color);
  };

  setBottomColor = (color: Color | string) => {
    this.newBottomColor = new Color(color);
  };

  paint = (side: SkyBoxSidesType[] | 'all' | 'sides' | string, art: 'sun' | 'moon' | 'stars' | 'clear') => {
    const actualSides = Array.isArray(side)
      ? side
      : side === 'all'
      ? SKY_BOX_SIDES
      : side === 'sides'
      ? ['front', 'back', 'left', 'right']
      : [side];

    for (const face of actualSides) {
      const material = this.boxMaterials.get(face);
      if (!material) continue;

      switch (art) {
        case 'sun':
          this.drawSun(material);
          break;
        case 'moon':
          this.drawMoon(material);
          break;
        case 'stars':
          this.drawStars(material);
          break;
        case 'clear':
          break;
      }

      material.needsUpdate = true;
    }
  };

  drawMoon = (material: MeshBasicMaterial, phase = 1) => {
    const canvas = <HTMLCanvasElement>material.map.image;
    if (!canvas) return;

    const { moonRadius: radius, moonColor } = this.options;
    const color = new Color(moonColor);
    const context = canvas.getContext('2d');

    const x = canvas.width / 2;
    const y = canvas.height / 2;

    // bg glow
    context.beginPath();
    const grd = context.createRadialGradient(
      x + radius / 2,
      y + radius / 2,
      1,
      x + radius / 2,
      y + radius / 2,
      radius * 2,
    );
    grd.addColorStop(0, this.rgba(1, 1, 1, 0.3));
    grd.addColorStop(1, this.rgba(1, 1, 1, 0));
    context.arc(x + radius / 2, y + radius / 2, radius * 2, 0, 2 * Math.PI, false);
    context.fillStyle = grd;
    context.fill();
    context.closePath();

    // clipping region
    context.save();
    context.beginPath();
    context.rect(x, y, radius, radius);
    context.clip();

    // moon bg
    context.beginPath();
    context.rect(x, y, radius, radius);
    context.fillStyle = this.rgba(color.r, color.g, color.b, 1);
    context.fill();

    context.translate(x, y);

    // lighter inside
    context.beginPath();
    context.rect(4, 4, radius - 8, radius - 8);
    context.fillStyle = this.rgba(1, 1, 1, 0.8);
    context.fill();

    // moon phase
    const px = phase * radius * 2 - radius;
    context.beginPath();
    context.rect(px, 0, radius, radius);
    context.fillStyle = this.rgba(0, 0, 0, 0.8);
    context.fill();
    context.beginPath();
    context.rect(2 + px, 2, radius - 4, radius - 4);
    context.fillStyle = this.rgba(0, 0, 0, 0.9);
    context.fill();

    context.restore();
  };

  drawStars = (material: MeshBasicMaterial) => {
    const canvas = <HTMLCanvasElement>material.map.image;
    if (!canvas) return;

    const { starsCount } = this.options;
    const context = canvas.getContext('2d');

    const alpha = context.globalAlpha;
    for (let i = 0; i < starsCount; i++) {
      context.globalAlpha = Math.random() * 1 + 0.5;
      context.beginPath();
      context.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 0.5,
        0,
        2 * Math.PI,
        false,
      );
      context.fillStyle = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
      context.fill();
    }

    context.globalAlpha = alpha;
  };

  drawSun = (material: MeshBasicMaterial, radius = 50) => {
    const canvas = <HTMLCanvasElement>material.map.image;
    if (!canvas) return;

    const { sunColor } = this.options;
    const context = canvas.getContext('2d');

    const color = new Color(sunColor);

    context.save();

    // bg glow
    context.beginPath();
    let x = canvas.width / 2;
    let y = canvas.height / 2;
    const grd = context.createRadialGradient(x, y, 1, x, y, radius * 2);
    grd.addColorStop(0, this.rgba(1, 1, 1, 0.3));
    grd.addColorStop(1, this.rgba(1, 1, 1, 0));
    context.arc(x, y, radius * 2, 0, 2 * Math.PI, false);
    context.fillStyle = grd;
    context.fill();
    context.closePath();

    // outer sun
    context.beginPath();
    x = canvas.width / 2 - radius / 2;
    y = canvas.height / 2 - radius / 2;
    context.rect(x, y, radius, radius);
    context.fillStyle = this.rgba(color.r, color.g, color.b, 1);
    context.fill();
    context.closePath();

    // inner sun
    context.beginPath();
    const r = radius / 1.6;
    x = canvas.width / 2 - r / 2;
    y = canvas.height / 2 - r / 2;
    context.rect(x, y, r, r);
    context.fillStyle = this.rgba(1, 1, 1, 0.5);
    context.fill();
    context.closePath();

    context.restore();
  };

  rgba = (r: number, g: number, b: number, a: number) => {
    return `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
  };

  tick = (delta: number) => {
    const { lerpFactor } = this.options;

    if (this.newTopColor) {
      this.shadingMaterial.uniforms.topColor.value.lerpHSL(this.newTopColor, lerpFactor);
    }

    if (this.newBottomColor) {
      this.shadingMaterial.uniforms.bottomColor.value.lerpHSL(this.newBottomColor, lerpFactor);
    }

    const { threeCamera } = this.rendering.engine.camera;
    this.meshGroup.position.x = threeCamera.position.x;
    this.meshGroup.position.z = threeCamera.position.z;
  };
}

export { Sky };
