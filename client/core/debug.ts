import {
  BoxGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneBufferGeometry,
  Group,
  BoxBufferGeometry,
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
  public wrapper: HTMLDivElement;
  public dataWrapper: HTMLDivElement;
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
      this.makeDOM();
      this.setupAll();
      this.setupInputs();
      this.mount();

      this.chunkHighlight.visible = false;
      this.highlights.frustumCulled = false;

      engine.rendering.scene.add(this.chunkHighlight);
      engine.rendering.scene.add(this.highlights);
      engine.inputs.bind('j', this.toggle, '*');
    });

    engine.on('world-ready', () => {
      // textureTest
      const testBlock = new PlaneBufferGeometry(4, 4);
      const testMat = new MeshBasicMaterial({
        map: this.engine.registry.atlasUniform.value,
        side: DoubleSide,
        transparent: true,
        alphaTest: 0.5,
      });
      this.atlasTest = new Mesh(testBlock, testMat);
      this.atlasTest.position.set(0, 0, -5);
      this.atlasTest.visible = false;
      this.engine.camera.threeCamera.add(this.atlasTest);
    });
  }

  makeDataEntry = () => {
    const dataEntry = document.createElement('p');
    Helper.applyStyle(dataEntry, {
      fontSize: '16px',
      margin: '0',
    });
    return dataEntry;
  };

  makeDOM = () => {
    this.wrapper = document.createElement('div');
    Helper.applyStyle(this.wrapper, {
      top: '0',
      width: '100%',
      position: 'fixed',
      zIndex: '10000000',
    });

    this.dataWrapper = document.createElement('div');
    Helper.applyStyle(this.dataWrapper, {
      position: 'absolute',
      top: '0',
      left: '0',
      background: '#00000022',
      color: 'white',
      padding: '4px',
      display: 'flex',
      flexDirection: 'column-reverse',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    });

    Helper.applyStyle(this.gui.element, {
      position: 'absolute',
      top: '0',
      right: '20px',
    });
  };

  mount = () => {
    const { domElement } = this.engine.container;
    domElement.appendChild(this.wrapper);
    this.wrapper.appendChild(this.dataWrapper);
    this.wrapper.appendChild(this.gui.element);
  };

  setupAll = () => {
    // RENDERING
    const { registry, player, world, camera } = this.engine;

    // ENGINE
    const engineFolder = this.gui.addFolder({ title: 'Engine', expanded: false });
    engineFolder
      .addInput(this.engine, 'tickSpeed', {
        min: 0,
        max: 100,
        step: 0.01,
        label: 'tick speed',
      })
      .on('change', (ev) => this.engine.setTick(ev.value));

    const worldFolder = this.gui.addFolder({ title: 'World', expanded: false });
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
    const playerFolder = this.gui.addFolder({ title: 'Player', expanded: false });
    playerFolder.addInput(player.options, 'acceleration', {
      min: 0,
      max: 5,
      step: 0.01,
      label: 'acceleration',
    });
    playerFolder.addInput(player.options, 'flyingInertia', { min: 0, max: 5, step: 0.01, label: 'flying inertia' });

    // CAMERA
    const cameraFolder = this.gui.addFolder({ title: 'Camera' });
    cameraFolder
      .addInput(camera.threeCamera, 'fov', {
        min: 40,
        max: 120,
        step: 0.01,
        label: 'FOV',
      })
      .on('change', () => camera.threeCamera.updateProjectionMatrix());

    // const cameraFolder = this.gui.addFolder('camera');
    this.registerDisplay('FPS', this, 'fps');
    this.registerDisplay('chunk', world, 'camChunkPosStr');
    this.registerDisplay('chunks loaded', world, 'chunksLoaded');
    this.registerDisplay('position', player, 'voxelPositionStr');
    this.registerDisplay('looking at', player, 'lookBlockStr');
    this.registerDisplay('memory used', this, 'memoryUsage');
    this.registerDisplay('time', world.sky.tracker, 'time', (num) => num.toFixed(0));

    // REGISTRY
    const registryFolder = this.gui.addFolder({ title: 'Registry', expanded: false });
    registryFolder.addButton({ title: 'Toggle', label: 'atlas' }).on('click', () => {
      this.atlasTest.visible = !this.atlasTest.visible;
    });
    registryFolder.addButton({ title: 'Toggle', label: 'wireframe' }).on('click', () => {
      registry.opaqueChunkMaterial.wireframe = !registry.opaqueChunkMaterial.wireframe;
      registry.transparentChunkMaterials.forEach((m) => (m.wireframe = !m.wireframe));
    });

    // DEBUG
    const debugFolder = this.gui.addFolder({ title: 'Debug', expanded: false });
    debugFolder.addButton({ title: 'Toggle', label: 'chunk highlight' }).on('click', () => {
      this.chunkHighlight.visible = !this.chunkHighlight.visible;
    });
  };

  setupInputs = () => {
    const { inputs, player, inventory, world, camera } = this.engine;

    const bulkPlace = (type?: number) => {
      return () => {
        const updates = [];

        const t = type === undefined ? inventory.hand : 0;
        const r = this.inputOptions.changeRadius;

        if (!player.lookBlock) return;
        const [vx, vy, vz] = player.lookBlock;

        for (let x = -r; x <= r; x++) {
          for (let y = -r; y <= r; y++) {
            for (let z = -r; z <= r; z++) {
              if (x ** 2 + y ** 2 + z ** 2 > r * r) continue;
              if (world.getVoxelByVoxel([vx + x, vy + y, vz + z]) === t) continue;
              updates.push({ voxel: [vx + x, vy + y, vz + z], type: t });
            }
          }
        }

        world.setManyVoxels(updates);
      };
    };

    inputs.bind('x', bulkPlace(0), 'in-game');
    inputs.bind('z', bulkPlace(), 'in-game');

    inputs.bind(
      'r',
      () => {
        camera.threeCamera.zoom = 3;
        camera.threeCamera.updateProjectionMatrix();
      },
      'in-game',
      {
        occasion: 'keydown',
      },
    );

    inputs.bind(
      'r',
      () => {
        camera.threeCamera.zoom = 1;
        camera.threeCamera.updateProjectionMatrix();
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
    const { display } = this.wrapper.style;
    this.wrapper.style.display = display === 'none' ? 'inline' : 'none';
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
