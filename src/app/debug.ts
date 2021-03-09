import { GUI } from 'dat.gui';
import Stats from 'stats.js';
import { AxesHelper, GridHelper } from 'three';

import { Engine } from '..';
import { Helper } from '../utils';

class Debug {
  public engine: Engine;
  public gui: dat.GUI;
  public stats: Stats;
  public dataWrapper: HTMLDivElement;
  public dataEntires: { ele: HTMLParagraphElement; obj: any; attribute: string; name: string }[] = [];

  constructor(engine: Engine) {
    this.engine = engine;

    // dat.gui
    this.gui = new GUI();

    // FPS indicator
    this.stats = new Stats();

    // move dat.gui panel to the top
    const { parentElement } = this.gui.domElement;
    if (parentElement) {
      Helper.applyStyle(parentElement, {
        zIndex: '1000000000',
      });
    }

    engine.on('ready', () => {
      this.makeDOM();
      this.setupAll();
      this.mount();

      const {
        rendering: { scene },
        world: {
          options: { chunkSize, dimension },
        },
      } = this.engine;

      const axesHelper = new AxesHelper(5);
      engine.rendering.scene.add(axesHelper);

      const gridHelper = new GridHelper(2 * chunkSize * dimension, 2 * chunkSize);
      scene.add(gridHelper);
    });
  }

  makeDataEntry = () => {
    const dataEntry = document.createElement('p');
    Helper.applyStyle(dataEntry, {
      margin: '0',
    });
    return dataEntry;
  };

  makeDOM = () => {
    this.dataWrapper = document.createElement('div');
    Helper.applyStyle(this.dataWrapper, {
      position: 'absolute',
      bottom: '0',
      left: '0',
      background: '#00000022',
      color: 'white',
      fontFamily: `'Trebuchet MS', sans-serif`,
      padding: '4px',
      display: 'flex',
      flexDirection: 'column-reverse',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    });
  };

  mount = () => {
    const { domElement } = this.engine.container;
    domElement.appendChild(this.stats.dom);
    domElement.appendChild(this.dataWrapper);
  };

  setupAll = () => {
    // RENDERING
    const { rendering, camera, world } = this.engine;

    const renderingFolder = this.gui.addFolder('rendering');
    renderingFolder
      .add(rendering.options, 'skyDomeOffset', 200, 2000, 10)
      // @ts-ignore
      .onChange((value) => (rendering.sky.material.uniforms.offset.value = value));

    renderingFolder
      .addColor(rendering.options, 'topColor')
      // @ts-ignore
      .onFinishChange((value) => rendering.sky.material.uniforms.topColor.value.set(value));
    renderingFolder
      .addColor(rendering.options, 'bottomColor')
      // @ts-ignore
      .onFinishChange((value) => rendering.sky.material.uniforms.bottomColor.value.set(value));
    renderingFolder
      .addColor(rendering.options, 'clearColor')
      .onFinishChange((value) => rendering.renderer.setClearColor(value));
    renderingFolder
      .addColor(rendering.options, 'directionalLightColor')
      .onFinishChange((value) => rendering.directionalLight.color.set(value));
    renderingFolder
      .addColor(rendering.options, 'ambientLightColor')
      .onFinishChange((value) => rendering.ambientLight.color.set(value));

    renderingFolder.open();

    // WORLD
    this.registerDisplay('chunk', world, 'camChunkPosStr');

    // CAMERA
    this.registerDisplay('position', camera, 'voxelPositionStr');
  };

  tick = () => {
    for (const { ele, name, attribute, obj } of this.dataEntires) {
      const newValue = obj[attribute];
      ele.innerHTML = `${name}: ${newValue}`;
    }
  };

  registerDisplay(name: string, object: any, attribute: string) {
    const wrapper = this.makeDataEntry();
    const newEntry = {
      ele: wrapper,
      obj: object,
      name,
      attribute,
    };
    this.dataEntires.push(newEntry);
    this.dataWrapper.appendChild(wrapper);
  }
}

export { Debug };
