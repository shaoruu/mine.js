import { BackSide, Color, Group, MathUtils, Mesh, MeshBasicMaterial, ShaderMaterial, SphereGeometry } from 'three';

import { Rendering } from '../core';

import { BoxSidesType, CanvasBox } from './canvas-box';
import SkyFragmentShader from './shaders/sky/fragment.glsl';
import SkyVertexShader from './shaders/sky/vertex.glsl';

type SkyOptionsType = {
  skyOffset: number;
  voidOffset: number;
  dimension: number;
  topColor: string;
  middleColor: string;
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
  skyOffset: 0,
  voidOffset: 0,
  dimension: 6000,
  // topColor: '#74B3FF',
  // bottomColor: '#ffffff',
  topColor: '#222',
  middleColor: '#222',
  bottomColor: '#222',
  lerpFactor: 0.2,
  starsCount: 300,
  moonRadius: 20,
  moonColor: '#e6e2d1',
  sunColor: '#f8ffb5',
  speed: 0.08,
  checkInterval: 4000,
};

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

const VOID_OFFSET = 1200;

const SKY_CONFIGS = {
  hours: {
    0: {
      color: {
        top: new Color('#000'),
        middle: new Color('#000'),
        bottom: new Color('#000'),
      },
      skyOffset: 200,
      voidOffset: VOID_OFFSET,
    },
    // start of sunrise
    600: {
      color: {
        top: new Color('#7694CF'),
        middle: new Color('#B0483A'),
        bottom: new Color('#222'),
      },
      skyOffset: 100,
      voidOffset: VOID_OFFSET,
    },
    // end of sunrise, start of day
    700: {
      color: {
        top: new Color('#73A3FB'),
        middle: new Color('#B1CCFD'),
        bottom: new Color('#222'),
      },
      skyOffset: 0,
      voidOffset: VOID_OFFSET,
    },
    // start of sunset
    1700: {
      color: {
        top: new Color('#A57A59'),
        middle: new Color('#FC5935'),
        bottom: new Color('#222'),
      },
      skyOffset: 100,
      voidOffset: VOID_OFFSET,
    },
    // end of sunset, back to night
    1800: {
      color: {
        top: new Color('#000'),
        middle: new Color('#000'),
        bottom: new Color('#000'),
      },
      skyOffset: 200,
      voidOffset: VOID_OFFSET,
    },
  },
};

class Sky {
  public options: SkyOptionsType;

  public shadingGeometry: SphereGeometry;
  public shadingMaterial: ShaderMaterial;
  public shadingMesh: Mesh;

  public skyBox: CanvasBox;

  public tracker = {
    day: 0,
    time: 0,
    last: 0,
    until: 0,
    initialized: false,
    sunlight: 0.1,
    skyOffset: 0,
    voidOffset: 0,
  };

  private topColor: Color;
  private middleColor: Color;
  private bottomColor: Color;
  private newTopColor: Color;
  private newMiddleColor: Color;
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
      if (!rendering.engine.network.connected || rendering.engine.tickSpeed === 0) return;
      const sentTime = Date.now();
      const [, serverReceivedTime] = JSON.parse(await rendering.engine.network.fetchData('/time'));
      const receivedTime = Date.now();
      const offset = serverReceivedTime - (sentTime + receivedTime) / 2;
      this.newTime = this.tracker.time + offset;
    }, checkInterval);
  }

  init = () => {
    this.paint('sides', 'stars');
    this.paint('top', 'stars');
    this.paint('top', 'moon');
    this.paint('bottom', 'sun');
  };

  createSkyShading = () => {
    const { dimension, topColor, middleColor, bottomColor, skyOffset, voidOffset } = this.options;

    this.topColor = new Color(topColor);
    this.middleColor = new Color(middleColor);
    this.bottomColor = new Color(bottomColor);

    const uniforms = {
      topColor: { value: this.topColor },
      middleColor: { value: this.middleColor },
      bottomColor: { value: this.bottomColor },
      skyOffset: { value: skyOffset },
      voidOffset: { value: voidOffset },
      exponent: { value: 0.6 },
      exponent2: { value: 1.2 },
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
    this.shadingMesh.frustumCulled = false;

    this.meshGroup.add(this.shadingMesh);
  };

  createSkyBox = () => {
    const { dimension } = this.options;

    this.skyBox = new CanvasBox({ dimension: dimension * 0.9, side: BackSide, width: 512 });
    this.skyBox.boxMaterials.forEach((m) => (m.depthWrite = false));

    const { mesh } = this.skyBox;

    mesh.frustumCulled = false;
    mesh.renderOrder = -1;

    this.meshGroup.add(mesh);
  };

  setTopColor = (color: Color | string) => {
    this.newTopColor = new Color(color);
  };

  setBottomColor = (color: Color | string) => {
    this.newBottomColor = new Color(color);
  };

  paint = (side: BoxSidesType[] | BoxSidesType, art: 'sun' | 'moon' | 'stars' | 'clear') => {
    const { skyBox } = this;

    switch (art) {
      case 'sun':
        skyBox.paint(side, this.drawSun);
        break;
      case 'moon':
        skyBox.paint(side, this.drawMoon);
        break;
      case 'stars':
        skyBox.paint(side, this.drawStars);
        break;
      case 'clear':
        skyBox.paint(side, this.clear);
        break;
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
    context.arc(x, y, radius * 3, 0, 2 * Math.PI, false);
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

  spin = (rotation: number, isFastForward: boolean) => {
    this.skyBox.mesh.rotation.z = isFastForward
      ? rotation
      : MathUtils.lerp(this.skyBox.mesh.rotation.z, rotation, this.options.lerpFactor);
  };

  tick = (delta = 0, isFastForward = false, overwrittenTick = 0.1) => {
    const { tracker } = this;

    if (!tracker.initialized) {
      this.init();
      tracker.initialized = true;
    }

    // add speed to time, and spin box meshes
    const speed = isFastForward ? overwrittenTick : this.rendering.engine.tickSpeed;
    tracker.time += speed * delta;

    // sync with server
    if (this.newTime > 0) {
      tracker.time = (tracker.time + this.newTime) / 2;
      this.newTime = -1;
    }

    tracker.time = tracker.time % 2400;

    this.spin(Math.PI * 2 * (tracker.time / 2400), isFastForward);

    const hour = Math.round(tracker.time / 100) * 100;
    tracker.last = tracker.time;

    if (SKY_CONFIGS.hours[hour]) {
      if (!tracker.until) {
        const { color, skyOffset, voidOffset } = SKY_CONFIGS.hours[hour];
        this.newTopColor = new Color();
        this.newMiddleColor = new Color();
        this.newBottomColor = new Color();

        this.newTopColor.copy(color.top);
        this.newMiddleColor.copy(color.middle);
        this.newBottomColor.copy(color.bottom);

        tracker.skyOffset = skyOffset;
        tracker.voidOffset = voidOffset;
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
        0.1,
        1 - (tracker.time - (sunlightEndTime - sunlightChangeSpan / 2)) / sunlightChangeSpan,
      );

    // lerp sunlight
    const sunlightLerpFactor = 0.008 * speed * delta;
    const { uSunlightIntensity } = this.rendering.engine.world;
    uSunlightIntensity.value = MathUtils.lerp(uSunlightIntensity.value, tracker.sunlight, sunlightLerpFactor);

    const cloudColor = this.rendering.engine.world.clouds.material.uniforms.uCloudColor.value;
    const cloudColorHSL = cloudColor.getHSL({});
    cloudColor.setHSL(cloudColorHSL.h, cloudColorHSL.s, MathUtils.clamp(uSunlightIntensity.value, 0, 1));

    const { skyOffset, voidOffset } = this.shadingMaterial.uniforms;
    skyOffset.value = MathUtils.lerp(skyOffset.value, tracker.skyOffset, sunlightLerpFactor);
    voidOffset.value = MathUtils.lerp(voidOffset.value, tracker.voidOffset, sunlightLerpFactor);

    // lerp sky colors
    ['top', 'right', 'left', 'front', 'back'].forEach((face) => {
      const mat = this.skyBox.boxMaterials.get(face);
      if (mat) {
        mat.opacity = MathUtils.lerp(mat.opacity, 1.2 - tracker.sunlight, sunlightLerpFactor);
      }
    });

    const colorLerpFactor = 0.006 * speed * delta;

    if (this.newTopColor) {
      this.topColor.lerp(this.newTopColor, colorLerpFactor);
    }

    if (this.newMiddleColor) {
      this.middleColor.lerp(this.newMiddleColor, colorLerpFactor);
      this.rendering.fogNearColor.lerp(this.newMiddleColor, colorLerpFactor);
      this.rendering.fogFarColor.lerp(this.newMiddleColor, colorLerpFactor);
    }

    // reposition sky box to player position
    const { object } = this.rendering.engine.player.controls;
    this.meshGroup.position.x = object.position.x;
    this.meshGroup.position.z = object.position.z;
  };
}

export { Sky };
