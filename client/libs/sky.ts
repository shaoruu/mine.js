import {
  BackSide,
  BoxBufferGeometry,
  Color,
  Group,
  LinearMipMapLinearFilter,
  MathUtils,
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
  speed: number;
  checkInterval: number;
};

const defaultSkyOptions: SkyOptionsType = {
  domeOffset: 0,
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
  speed: 0.08,
  checkInterval: 4000,
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

const SKY_CONFIGS = {
  hours: {
    0: {
      color: {
        top: new Color('#000'),
        bottom: new Color('#000'),
      },
      offset: 200,
    },
    // start of sunrise
    500: {
      color: {
        top: new Color('#7694CF'),
        bottom: new Color('#B0483A'),
      },
      offset: 100,
    },
    // end of sunrise, start of day
    700: {
      color: {
        top: new Color('#73A3FB'),
        bottom: new Color('#B1CCFD'),
      },
      offset: 0,
    },
    // start of sunset
    1700: {
      color: {
        top: new Color('#A57A59'),
        bottom: new Color('#FC5935'),
      },
      offset: 100,
    },
    // end of sunset, back to night
    1900: {
      color: {
        top: new Color('#000'),
        bottom: new Color('#000'),
      },
      offset: 200,
    },
  },
};

class Sky {
  public options: SkyOptionsType;

  public shadingGeometry: SphereGeometry;
  public shadingMaterial: ShaderMaterial;
  public shadingMesh: Mesh;

  public boxGeometry: BoxBufferGeometry;
  public boxMaterials: Map<string, MeshBasicMaterial> = new Map();
  public boxMesh: Mesh;

  public tracker = {
    day: 0,
    time: 0,
    last: 0,
    until: 0,
    initialized: false,
    sunlight: 0.2,
    offset: 0,
  };

  private topColor: Color;
  private bottomColor: Color;
  private newTopColor: Color;
  private newBottomColor: Color;
  private newTime = -1;

  private meshGroup = new Group();

  constructor(public rendering: Rendering, options: Partial<SkyOptionsType> = {}) {
    const { checkInterval } = (this.options = {
      ...defaultSkyOptions,
      ...options,
    });

    this.createSkyShading();
    this.createSkyBox();

    rendering.scene.add(this.meshGroup);

    setInterval(async () => {
      this.newTime = await rendering.engine.network.fetchData('/time');
      console.log(this.newTime, this.tracker.time);
    }, checkInterval);

    rendering.engine.on('focus', async () => {
      this.setTime(await rendering.engine.network.fetchData('/time'));
    });
  }

  init = () => {
    this.paint('sides', 'stars');
    this.paint('top', 'stars');
    this.paint('top', 'moon');
    this.paint('bottom', 'sun');
  };

  createSkyShading = () => {
    const { dimension, topColor, bottomColor, domeOffset } = this.options;

    this.topColor = new Color(topColor);
    this.bottomColor = new Color(bottomColor);

    const uniforms = {
      topColor: { value: this.topColor },
      bottomColor: { value: this.bottomColor },
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

    this.boxGeometry = new BoxBufferGeometry(dimension * 0.9, dimension * 0.9, dimension * 0.9);
    for (const face of SKY_BOX_SIDES) {
      const canvasMaterial = this.createCanvasMaterial();
      this.boxMaterials.set(face, canvasMaterial);
    }

    this.boxMesh = new Mesh(this.boxGeometry, Array.from(this.boxMaterials.values()));

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
          this.clear(material);
          break;
      }

      material.map.needsUpdate = true;
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

  clear = (material: MeshBasicMaterial) => {
    const canvas = <HTMLCanvasElement>material.map.image;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  rgba = (r: number, g: number, b: number, a: number) => {
    return `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
  };

  spin = (rotation: number) => {
    this.boxMesh.rotation.z = rotation;
  };

  setTime = (time: number, sideEffect = true) => {
    this.tracker.time = time % 2400;
    for (let i = 0; i < 2400; i++) {
      this.tick(1 / this.rendering.engine.tickSpeed);
    }

    if (sideEffect)
      this.rendering.engine.network.server.sendEvent({
        type: 'CONFIG',
        json: {
          time: this.tracker.time,
        },
      });
  };

  tick = (delta = 0) => {
    const { tracker } = this;

    if (!tracker.initialized) {
      this.init();
      tracker.initialized = true;
    }

    // add speed to time, and spin box meshes
    const speed = this.rendering.engine.tickSpeed;
    tracker.time += speed * delta;

    // sync with server
    if (this.newTime > 0) {
      tracker.time = (tracker.time + this.newTime) / 2;
      this.newTime = -1;
    }

    tracker.time = tracker.time % 2400;

    this.spin(Math.PI * 2 * (tracker.time / 2400));

    const hour = Math.round(tracker.time / 100) * 100;
    tracker.last = tracker.time;

    if (SKY_CONFIGS.hours[hour]) {
      if (!tracker.until) {
        const { color, offset } = SKY_CONFIGS.hours[hour];
        this.newTopColor = new Color();
        this.newBottomColor = new Color();

        this.newTopColor.copy(color.top);
        this.newBottomColor.copy(color.bottom);

        tracker.offset = offset;
        tracker.until = hour + 100;
      }
    }
    if (tracker.until === hour) tracker.until = 0;

    const sunlightStartTime = 600;
    const sunlightEndTime = 1800;
    const sunlightChangeSpan = 200;

    // turn on sunlight
    if (
      tracker.time >= -sunlightChangeSpan / 2 + sunlightStartTime &&
      tracker.time <= sunlightChangeSpan / 2 + sunlightStartTime
    )
      tracker.sunlight = (tracker.time - (sunlightStartTime - sunlightChangeSpan / 2)) / sunlightChangeSpan;

    // turn off sunlight
    if (
      tracker.time >= -sunlightChangeSpan / 2 + sunlightEndTime &&
      tracker.time <= sunlightChangeSpan / 2 + sunlightEndTime
    )
      tracker.sunlight = Math.max(
        0.2,
        1 - (tracker.time - (sunlightEndTime - sunlightChangeSpan / 2)) / sunlightChangeSpan,
      );

    // lerp sunlight
    const sunlightLerpFactor = 0.008 * speed * delta;
    const { uSunlightIntensity } = this.rendering.engine.world;
    uSunlightIntensity.value = MathUtils.lerp(uSunlightIntensity.value, tracker.sunlight, sunlightLerpFactor);

    const { offset } = this.shadingMaterial.uniforms;
    offset.value = MathUtils.lerp(offset.value, tracker.offset, sunlightLerpFactor);

    // lerp sky colors
    ['top', 'right', 'left', 'front', 'back'].forEach((face) => {
      const mat = this.boxMaterials.get(face);
      if (mat) {
        mat.opacity = MathUtils.lerp(mat.opacity, 1.2 - tracker.sunlight, sunlightLerpFactor);
      }
    });

    const colorLerpFactor = 0.006 * speed * delta;

    if (this.newTopColor) {
      this.topColor.lerp(this.newTopColor, colorLerpFactor);
    }

    if (this.newBottomColor) {
      this.bottomColor.lerp(this.newBottomColor, colorLerpFactor);
      this.rendering.fogNearColor.lerp(this.newBottomColor, colorLerpFactor);
      this.rendering.fogFarColor.lerp(this.newBottomColor, colorLerpFactor);
    }

    // reposition sky box to player position
    const { threeCamera } = this.rendering.engine.camera;
    this.meshGroup.position.x = threeCamera.position.x;
    this.meshGroup.position.z = threeCamera.position.z;
  };
}

export { Sky };
