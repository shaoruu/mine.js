import { GUI } from 'dat.gui';
import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, PlaneBufferGeometry } from 'three';
// import { AxesHelper, GridHelper } from 'three';

import { Helper } from '../utils';

import { Engine } from '.';

type FormatterType = (input: any) => string;

class Debug {
  public gui: dat.GUI;
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

  constructor(public engine: Engine) {
    // dat.gui
    this.gui = new GUI({
      width: 300,
      closed: true,
      hideable: false,
    });

    const {
      world: { chunkSize, dimension, maxHeight },
    } = engine.config;
    const width = chunkSize * dimension;
    this.chunkHighlight = new Mesh(
      new BoxGeometry(width, maxHeight * dimension, width),
      new MeshBasicMaterial({ wireframe: true, side: DoubleSide }),
    );

    // move dat.gui panel to the top
    const { parentElement } = this.gui.domElement;
    if (parentElement) {
      parentElement.parentNode.removeChild(parentElement);
    }

    engine.on('ready', () => {
      this.makeDOM();
      this.setupAll();
      this.setupInputs();
      this.mount();

      this.chunkHighlight.visible = false;
      engine.rendering.scene.add(this.chunkHighlight);
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
      this.atlasTest.position.set(0, 20, 0);
      this.atlasTest.visible = false;
      this.engine.rendering.scene.add(this.atlasTest);
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
      zIndex: '10000',
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

    Helper.applyStyle(this.gui.domElement, {
      zIndex: '10000',
      position: 'absolute',
      top: '0',
      right: '0',
    });
  };

  mount = () => {
    const { domElement } = this.engine.container;
    domElement.appendChild(this.wrapper);
    this.wrapper.appendChild(this.dataWrapper);
    this.wrapper.appendChild(this.gui.domElement);
  };

  setupAll = () => {
    // RENDERING
    const { rendering, registry, player, world, camera } = this.engine;

    // ENGINE
    const engineFolder = this.gui.addFolder('Engine');
    engineFolder
      .add(this.engine, 'tickSpeed', 0, 100, 0.01)
      .onChange((value) => this.engine.setTick(value))
      .name('Tick speed');

    // RENDERING
    const renderingFolder = this.gui.addFolder('Rendering');
    renderingFolder
      .addColor(rendering.options, 'clearColor')
      .onFinishChange((value) => rendering.renderer.setClearColor(value))
      .name('Clear color');

    // WORLD
    const worldFolder = this.gui.addFolder('World');
    const worldDebugConfigs = { time: world.sky.tracker.time };
    worldFolder
      .add(world.options, 'renderRadius', 1, 20, 1)
      .onFinishChange((value) => {
        world.updateRenderRadius(value);
      })
      .name('Render radius');
    worldFolder.add(world.options, 'requestRadius', 1, 20, 1).name('Request radius');
    worldFolder
      .add(worldDebugConfigs, 'time', 0, 2400, 10)
      .onFinishChange((value) => world.setTime(value))
      .name('Time value');
    const aoFolder = worldFolder.addFolder('AO');
    aoFolder.add(registry.aoUniform.value, 'x', 0, 255, 1).name('Level 0');
    aoFolder.add(registry.aoUniform.value, 'y', 0, 255, 1).name('Level 1');
    aoFolder.add(registry.aoUniform.value, 'z', 0, 255, 1).name('Level 2');
    aoFolder.add(registry.aoUniform.value, 'w', 0, 255, 1).name('Level 3');

    // PLAYER
    const playerFolder = this.gui.addFolder('Player');
    playerFolder.add(player.options, 'acceleration', 0, 5, 0.01).name('Acceleration');
    playerFolder.add(player.options, 'flyingInertia', 0, 5, 0.01).name('Flying inertia');

    // CAMERA
    const cameraFolder = this.gui.addFolder('Camera');
    cameraFolder
      .add(camera.threeCamera, 'fov', 40, 120, 0.01)
      .name('FOV')
      .onChange(() => camera.threeCamera.updateProjectionMatrix());

    // const cameraFolder = this.gui.addFolder('camera');
    this.registerDisplay('FPS', this, 'fps');
    this.registerDisplay('position', player, 'voxelPositionStr');
    this.registerDisplay('chunk', world, 'camChunkPosStr');
    this.registerDisplay('looking at', player, 'lookBlockStr');
    this.registerDisplay('time', world.sky.tracker, 'time', (num) => num.toFixed(0));
    this.registerDisplay('memory used', this, 'memoryUsage');

    // REGISTRY
    const registryFolder = this.gui.addFolder('Registry');
    registryFolder.add(
      {
        'Toggle atlas': () => {
          this.atlasTest.visible = !this.atlasTest.visible;
        },
      },
      'Toggle atlas',
    );
    registryFolder.add(
      {
        'Toggle wireframe': () => {
          registry.opaqueChunkMaterial.wireframe = !registry.opaqueChunkMaterial.wireframe;
          registry.transparentChunkMaterials.forEach((m) => (m.wireframe = !m.wireframe));
        },
      },
      'Toggle wireframe',
    );

    // DEBUG
    const debugFolder = this.gui.addFolder('Debug');
    debugFolder.add(
      {
        'Toggle chunk highlight': () => {
          this.chunkHighlight.visible = !this.chunkHighlight.visible;
        },
      },
      'Toggle chunk highlight',
    );
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
