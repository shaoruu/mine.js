import {
  BoxGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneBufferGeometry,
  Line,
  BufferGeometry,
  Vector3,
} from 'three';
import { Pane } from 'tweakpane';

// import { AxesHelper, GridHelper, Vector3 } from 'three';

import { Coords3 } from '../libs/types';
import { Helper } from '../utils';

import { Engine } from '.';

type FormatterType = (input: any) => string;

class Debug {
  public gui: Pane;
  public dataWrapper: HTMLDivElement;
  public audioWrapper: HTMLDivElement;
  public dataEntries: {
    ele: HTMLParagraphElement;
    obj: any;
    attribute: string;
    name: string;
    formatter: FormatterType;
  }[] = [];
  public chunkHighlight: Mesh;
  public atlasTest: Mesh;

  public inputOptions = {
    changeRadius: 3,
    minChangeRadius: 1,
    maxChangeRadius: 6,
  };

  public highlights = new Line(
    new BufferGeometry(),
    new MeshBasicMaterial({
      color: 'yellow',
    }),
  );

  public biome = 'Unkonwn';

  public savedSettings: { [key: string]: any } = {};

  constructor(public engine: Engine) {
    // dat.gui
    this.gui = new Pane();

    const {
      world: { chunkSize, dimension, maxHeight },
    } = engine.config;
    const width = chunkSize * dimension;
    this.chunkHighlight = new Mesh(
      new BoxGeometry(width, maxHeight * dimension, width),
      new MeshBasicMaterial({ wireframe: true, side: DoubleSide }),
    );

    // move dat.gui panel to the top
    const parentElement = this.gui.element;
    if (parentElement) {
      parentElement.parentNode.removeChild(parentElement);
    }

    engine.on('ready', () => {
      this.chunkHighlight.visible = false;
      this.highlights.frustumCulled = false;

      engine.rendering.scene.add(this.chunkHighlight);
      engine.rendering.scene.add(this.highlights);
      engine.inputs.bind('j', this.toggle, '*');
    });

    engine.on('assets-loaded', () => {
      this.makeDOM();
      this.setupAll();
      this.setupInputs();
      this.mount();

      // textureTest
      const testBlock = new PlaneBufferGeometry(4, 4);
      const testMat = new MeshBasicMaterial({
        map: this.engine.registry.atlasUniform.value,
        side: DoubleSide,
        transparent: true,
        depthTest: false,
        alphaTest: 0.5,
      });

      this.atlasTest = new Mesh(testBlock, testMat);
      this.atlasTest.position.set(0, 0, -5);
      this.atlasTest.visible = false;
      this.atlasTest.renderOrder = 10000000000;
      this.engine.camera.threeCamera.add(this.atlasTest);
    });
  }

  makeDataEntry = () => {
    const dataEntry = document.createElement('p');
    Helper.applyStyle(dataEntry, {
      fontSize: '13.3333px',
      margin: '0',
    });
    return dataEntry;
  };

  makeDOM = () => {
    this.dataWrapper = document.createElement('div');
    this.dataWrapper.id = 'data-wrapper';
    Helper.applyStyle(this.dataWrapper, {
      position: 'fixed',
      top: '10px',
      left: '10px',
      color: '#eee',
      background: '#00000022',
      padding: '4px',
      display: 'flex',
      flexDirection: 'column-reverse',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    });

    Helper.applyStyle(this.gui.element, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: '1000000000000',
    });

    this.audioWrapper = document.createElement('div');
    this.audioWrapper.id = 'audio-wrapper';
    Helper.applyStyle(this.audioWrapper, {
      position: 'fixed',
      right: '0',
      bottom: '20px',
      background: '#2C2E43',
      color: '#EEEEEE',
      content: '0',
    });
  };

  mount = () => {
    const { domElement } = this.engine.container;
    domElement.appendChild(this.dataWrapper);
    domElement.appendChild(this.audioWrapper);
    domElement.appendChild(this.gui.element);
  };

  setupAll = () => {
    // RENDERING
    const { registry, player, world, camera, rendering, sounds } = this.engine;

    /* -------------------------------------------------------------------------- */
    /*                              TEMPORARY OPTIONS                             */
    /* -------------------------------------------------------------------------- */
    const sessionFolder = this.gui.addFolder({ title: 'Session (Temporary)', expanded: false });

    // ENGINE
    const engineFolder = sessionFolder.addFolder({ title: 'Engine', expanded: false });
    engineFolder
      .addInput(this.engine, 'tickSpeed', {
        min: 0,
        max: 100,
        step: 0.01,
        label: 'tick speed',
      })
      .on('change', (ev) => this.engine.setTick(ev.value));

    const worldFolder = sessionFolder.addFolder({ title: 'World', expanded: false });
    const worldDebugConfigs = { time: world.sky.tracker.time };
    worldFolder
      .addInput(world.options, 'renderRadius', {
        min: 1,
        max: 20,
        step: 1,
        label: 'render radius',
      })
      .on('change', (ev) => {
        world.updateRenderRadius(ev.value);
      });
    worldFolder.addInput(world.options, 'requestRadius', {
      min: 1,
      max: 20,
      step: 1,
      label: 'request radius',
    });
    worldFolder
      .addInput(worldDebugConfigs, 'time', { min: 0, max: 2400, step: 10, label: 'time value' })
      .on('change', (ev) => world.setTime(ev.value));
    const aoFolder = worldFolder.addFolder({ title: 'AO' });
    aoFolder.addInput(registry.aoUniform, 'value', {
      x: { min: 0, max: 255, step: 1 },
      y: { min: 0, max: 255, step: 1 },
      z: { min: 0, max: 255, step: 1 },
      w: { min: 0, max: 255, step: 1 },
    });

    // PLAYER
    const playerFolder = sessionFolder.addFolder({ title: 'Player', expanded: false });
    playerFolder.addInput(player.options, 'acceleration', {
      min: 0,
      max: 5,
      step: 0.01,
      label: 'acceleration',
    });
    playerFolder.addInput(player.options, 'flyingInertia', { min: 0, max: 5, step: 0.01, label: 'flying inertia' });

    // const cameraFolder = this.gui.addFolder('camera');
    this.registerDisplay('FPS', this, 'fps');
    this.registerDisplay('chunk', world, 'camChunkPosStr');
    this.registerDisplay('chunks loaded', world, 'chunksLoaded');
    this.registerDisplay('position', player, 'voxelPositionStr');
    this.registerDisplay('biome', this, 'biome');
    this.registerDisplay('looking at', player, 'lookBlockStr');
    this.registerDisplay('scene objects', rendering.scene.children, 'length');
    this.registerDisplay('memory used', this, 'memoryUsage');
    this.registerDisplay('time', world.sky.tracker, 'time', (num) => num.toFixed(0));

    // REGISTRY
    const registryFolder = sessionFolder.addFolder({ title: 'Registry', expanded: false });
    registryFolder.addButton({ title: 'Toggle', label: 'atlas' }).on('click', () => {
      this.atlasTest.visible = !this.atlasTest.visible;
    });
    registryFolder.addButton({ title: 'Toggle', label: 'wireframe' }).on('click', () => {
      registry.opaqueChunkMaterial.wireframe = !registry.opaqueChunkMaterial.wireframe;
      registry.transparentChunkMaterials.forEach((m) => (m.wireframe = !m.wireframe));
    });

    // DEBUG
    const debugFolder = sessionFolder.addFolder({ title: 'Debug', expanded: false });
    debugFolder.addButton({ title: 'Toggle', label: 'chunk highlight' }).on('click', () => {
      this.chunkHighlight.visible = !this.chunkHighlight.visible;
    });

    /* -------------------------------------------------------------------------- */
    /*                                SAVED OPTIONS                               */
    /* -------------------------------------------------------------------------- */
    const { config } = this.engine;

    const packs = this.engine.registry.options.packs;
    const packsObject = {};
    packs.forEach((p) => (packsObject[p] = p));

    const saved = this.gui.addFolder({ title: 'Local (Saved)', expanded: true });

    const savedPlayerFolder = saved.addFolder({ title: 'Player', expanded: true });
    const sensitivitySaver = this.registerSaver(
      'sensitivity',
      config.player.sensitivity,
      (val) => (player.controls.sensitivity = val),
    );
    savedPlayerFolder.addInput(this.savedSettings, 'sensitivity', { min: 10, max: 150, step: 1 }).on('change', (ev) => {
      sensitivitySaver(ev.value);
    });

    const fovSaver = this.registerSaver('fov', config.camera.fov, (val) => camera.setFOV(val));
    savedPlayerFolder
      .addInput(this.savedSettings, 'fov', {
        min: 40,
        max: 120,
        step: 1,
        label: 'FOV',
      })
      .on('change', (ev) => fovSaver(ev.value));

    const soundSaver = this.registerSaver('mute', false, (val) => camera.audioListener.setMasterVolume(val ? 0 : 1));
    savedPlayerFolder.addInput(this.savedSettings, 'mute').on('change', (ev) => soundSaver(ev.value));

    const savedRegistryFolder = saved.addFolder({ title: 'Registry', expanded: true });
    const texturePackSaver = this.registerSaver('texturePack', this.engine.registry.texturePack, (val) => {
      registry.setTexturePack(val);
    });
    savedRegistryFolder
      .addInput(this.savedSettings, 'texturePack', {
        options: packsObject,
        label: 'texture pack',
      })
      .on('change', (ev) => {
        texturePackSaver(ev.value);
      });

    /* -------------------------------------------------------------------------- */
    /*                               SOUNDS DISPLAY                               */
    /* -------------------------------------------------------------------------- */
    const createAudioNode = (name) => {
      const node = document.createElement('div');

      Helper.applyStyle(node, {
        padding: '5px 20px',
        textAlign: 'center',
      });

      node.innerHTML = name;

      return node;
    };

    const playing = new Map();

    sounds.on('started', (name) => {
      if (playing.has(name)) return;
      const node = createAudioNode(name);
      this.audioWrapper.appendChild(node);
      playing.set(name, node);
    });

    sounds.on('stopped', (name) => {
      const node = playing.get(name);
      if (node) {
        this.audioWrapper.removeChild(node);
        playing.delete(name);
      }
    });
  };

  setupInputs = () => {
    const { inputs, player, inventory, world, camera } = this.engine;

    const bulkPlace = (type?: number) => {
      return () => {
        const updates = [];

        const t = type === undefined ? inventory.hand : 0;
        const r = this.inputOptions.changeRadius;

        if (!player.targetBlock) return;
        const {
          voxel: [vx, vy, vz],
          rotation,
          yRotation,
        } = player.targetBlock;

        for (let x = -r; x <= r; x++) {
          for (let y = -r; y <= r; y++) {
            for (let z = -r; z <= r; z++) {
              if (x ** 2 + y ** 2 + z ** 2 > r * r) continue;
              if (world.getVoxelByVoxel([vx + x, vy + y, vz + z]) === t) continue;
              updates.push({ target: { voxel: [vx + x, vy + y, vz + z], rotation, yRotation }, type: t });
            }
          }
        }

        world.setManyVoxels(updates);
      };
    };

    inputs.bind('x', bulkPlace(0), 'in-game');
    inputs.bind('z', bulkPlace(), 'in-game');

    inputs.bind(
      '=',
      () =>
        (this.inputOptions.changeRadius = Math.max(
          Math.min(this.inputOptions.changeRadius + 1, this.inputOptions.maxChangeRadius),
          this.inputOptions.minChangeRadius,
        )),
      'in-game',
    );
    inputs.bind(
      '-',
      () =>
        (this.inputOptions.changeRadius = Math.max(
          Math.min(--this.inputOptions.changeRadius - 1, this.inputOptions.maxChangeRadius),
          this.inputOptions.minChangeRadius,
        )),
      'in-game',
    );

    inputs.bind(
      'v',
      () => {
        camera.setZoom(3);
      },
      'in-game',
      {
        occasion: 'keydown',
      },
    );

    inputs.bind(
      'v',
      () => {
        camera.setZoom(1);
      },
      'in-game',
      {
        occasion: 'keyup',
      },
    );
  };

  tick = () => {
    for (const { ele, name, attribute, obj, formatter } of this.dataEntries) {
      const newValue = obj[attribute];
      ele.innerHTML = `${name}: ${formatter(newValue)}`;
    }

    if (this.chunkHighlight.visible) {
      const { camChunkPosStr } = this.engine.world;
      const [cx, cz] = Helper.parseChunkName(camChunkPosStr, ' ');
      const { chunkSize, maxHeight, dimension } = this.engine.world.options;
      this.chunkHighlight.position.set(
        (cx + 0.5) * chunkSize * dimension,
        0.5 * maxHeight * dimension,
        (cz + 0.5) * chunkSize * dimension,
      );
    }
  };

  addHighlights = (points: Coords3[]) => {
    const vectors = [];
    const dimension = this.engine.config.world.dimension;
    points.forEach(([x, y, z]) =>
      vectors.push(new Vector3((x + 0.5) * dimension, (y + 0.5) * dimension, (z + 0.5) * dimension)),
    );
    this.highlights.geometry.setFromPoints(vectors);
  };

  toggle = () => {
    const display = this.dataWrapper.style.display;
    const newDisplay = display === 'none' ? 'inline' : 'none';

    this.dataWrapper.style.display = newDisplay;
    this.gui.element.style.display = newDisplay;
    this.audioWrapper.style.display = newDisplay;
  };

  registerSaver = (name: string, value: any, func?: (value: any) => void) => {
    const key = `mine.js-debug-${name}`;
    const local = localStorage.getItem(key);
    const stored = typeof value === 'number' ? +local : typeof value === 'boolean' ? local === 'true' : local;
    const actualValue = stored || value;

    this.savedSettings[name] = actualValue;

    const saver = (newValue: any) => {
      if (func) func(newValue);
      this.savedSettings[name] = newValue;
      localStorage.setItem(key, newValue);
    };

    saver(actualValue);

    return saver;
  };

  registerDisplay = (name: string, object: any, attribute: string, formatter: FormatterType = (str) => str) => {
    const wrapper = this.makeDataEntry();
    const newEntry = {
      ele: wrapper,
      obj: object,
      name,
      formatter,
      attribute,
    };
    this.dataEntries.push(newEntry);
    this.dataWrapper.insertBefore(wrapper, this.dataWrapper.firstChild);
  };

  calculateFPS = (function () {
    const sampleSize = 60;
    let value = 0;
    const sample = [];
    let index = 0;
    let lastTick = 0;
    let min: number;
    let max: number;

    return function () {
      // if is first tick, just set tick timestamp and return
      if (!lastTick) {
        lastTick = performance.now();
        return 0;
      }
      // calculate necessary values to obtain current tick FPS
      const now = performance.now();
      const delta = (now - lastTick) / 1000;
      const fps = 1 / delta;
      // add to fps samples, current tick fps value
      sample[index] = Math.round(fps);

      // iterate samples to obtain the average
      let average = 0;
      for (let i = 0; i < sample.length; i++) average += sample[i];

      average = Math.round(average / sample.length);

      // set new FPS
      value = average;
      // store current timestamp
      lastTick = now;
      // increase sample index counter, and reset it
      // to 0 if exceded maximum sampleSize limit
      index++;

      if (index === sampleSize) index = 0;

      if (!min || min > value) min = value;
      if (!max || max < value) max = value;

      return `${value} (${min}, ${max})`;
    };
  })();

  get fps() {
    return this.calculateFPS();
  }

  get memoryUsage() {
    // @ts-ignore
    const info = window.performance.memory;
    if (!info) return 'unknown';
    const { usedJSHeapSize, jsHeapSizeLimit } = info;
    return `${Helper.round(usedJSHeapSize / jsHeapSizeLimit, 2)}%`;
  }
}

export { Debug };
