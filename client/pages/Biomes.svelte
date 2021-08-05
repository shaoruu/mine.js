<script lang="ts">
  import ndarray from 'ndarray';
  import { Noise } from 'noisejs';
  import { Pane } from 'tweakpane';

  import { onMount } from 'svelte';
  import {
    DoubleSide,
    Float32BufferAttribute,
    Mesh,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Scene,
    ShaderMaterial,
    Vector3,
    Color,
    WebGLRenderer,
    Int32BufferAttribute,
  } from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  import BiomesVertexShader from '../core/shaders/biomes/vertex.glsl';
  import BiomesFragmentShader from '../core/shaders/biomes/fragment.glsl';

  let el: HTMLCanvasElement;

  function packColor(color: Color) {
    return color.r * 255 + color.g * 255 * 256 + color.b * 255 * 256 ** 2;
  }

  onMount(() => {
    const scene = new Scene();

    const renderer = new WebGLRenderer({ antialias: true, canvas: el });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(400, 200, 0);

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = false;

    controls.minDistance = 100;
    controls.maxDistance = 1000;

    controls.maxPolarAngle = Math.PI / 2;

    const debug = new Pane();

    // CONSTANTS
    const SEED = 500 * Math.random();
    const WIDTH = 300;
    const DIMENSION = 512;

    console.log('SEED: ', SEED);

    const debugObject = {
      depthColor: '#8e8b99',
      surfaceColor: '#f5ece4',
      center: new Vector3(0, 0, 0),
    };

    debug.element.style.position = 'fixed';
    debug.element.style.top = '20px';
    debug.element.style.right = '20px';

    // OBJECT CREATION
    const geometry = new PlaneBufferGeometry(WIDTH, WIDTH, DIMENSION, DIMENSION);
    const material = new ShaderMaterial({
      vertexShader: BiomesVertexShader,
      fragmentShader: BiomesFragmentShader,
      side: DoubleSide,
      uniforms: {
        uDepthColor: { value: new Color(debugObject.depthColor) },
        uSurfaceColor: { value: new Color(debugObject.surfaceColor) },
        uColorOffset: { value: 0 },
        uColorMultiplier: { value: 3.7 },
      },
    });
    const plane = new Mesh(geometry, material);

    const runSample = () => {
      const heights = ndarray(new Float32Array((DIMENSION + 1) ** 2), [DIMENSION + 1, DIMENSION + 1]);
      const colors = ndarray(new Int32Array((DIMENSION + 1) ** 2), [DIMENSION + 1, DIMENSION + 1]);

      let sum = 0;
      let count = 0;

      for (let i = 0; i <= DIMENSION; i++) {
        for (let j = 0; j <= DIMENSION; j++) {
          const val = sample(new Vector3(i, 0, j));

          sum += val;
          count += 1;

          heights.set(i, j, val);
          colors.set(i, j, packColor(new Color(1, 1, 1)));
        }
      }

      console.log('average: ', sum / count);

      geometry.setAttribute('height', new Float32BufferAttribute(heights.data, 1));
      geometry.setAttribute('color', new Int32BufferAttribute(colors.data, 1));
    };

    const general = debug.addFolder({ title: 'General' });
    general.addInput(debugObject, 'center').on('change', runSample);
    general
      .addInput(debugObject, 'depthColor', { label: 'depth color' })
      .on('change', () => material.uniforms.uDepthColor.value.set(debugObject.depthColor));
    general
      .addInput(debugObject, 'surfaceColor', { label: 'surface color' })
      .on('change', () => material.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor));

    general.addInput(material.uniforms.uColorOffset, 'value', { label: 'color offset', min: -1, max: 1, step: 0.01 });
    general.addInput(material.uniforms.uColorMultiplier, 'value', {
      label: 'color multiplier',
      min: 0,
      max: 5,
      step: 0.01,
    });

    type NoiseConfig = {
      enabled: boolean;
      seed: number;
      scale: number;
      strength: number;
      layers: number;
      baseRoughness: number;
      roughness: number;
      persistence: number;
      center: Vector3;
      minValue: number;
      firstLayerAsMask: boolean;
    };

    const makeNoiseLayer = (name: string, config: NoiseConfig, parent?: any) => {
      const noise = new Noise(config.seed);

      const folder = debug.addFolder({ title: 'Layer: ' + name, expanded: false });

      folder.addInput(config, 'enabled');
      folder.addInput(config, 'scale', { min: 0, max: 0.1, step: 0.001 });
      folder.addInput(config, 'strength', { min: 0, max: 5, step: 0.01 });
      folder.addInput(config, 'layers', { min: 0, max: 10, step: 1 });
      folder.addInput(config, 'baseRoughness', { min: 0, max: 1, step: 0.01 });
      folder.addInput(config, 'roughness', { min: 0, max: 5, step: 0.01 });
      folder.addInput(config, 'persistence', { min: 0, max: 5, step: 0.01 });
      folder.addInput(config, 'minValue', { min: 0, max: 5, step: 0.01 });

      folder.on('change', runSample);

      if (parent) {
        folder.addInput(config, 'firstLayerAsMask', { label: 'use mask' });
      }

      return (point: Vector3) => {
        const parentValue = parent ? parent(point) : 0;

        if (!config.enabled) {
          return parentValue;
        }

        let noiseValue = 0;
        let frequency = config.baseRoughness;
        let amplitude = 1;

        for (let i = 0; i < config.layers; i++) {
          let p = point
            .clone()
            .multiplyScalar(frequency * config.scale)
            .add(config.center);
          let v = noise.simplex3(p.x, p.y, p.z);
          // todo: this is not 0-1
          noiseValue += (v + 1.0) * 0.5 * amplitude;
          frequency *= config.roughness;
          amplitude *= config.persistence;
        }

        noiseValue = Math.max(0, noiseValue - config.minValue);

        return parentValue + noiseValue * config.strength * (config.firstLayerAsMask && parent ? parentValue : 1);
      };
    };

    const continents: NoiseConfig = {
      enabled: true,
      seed: SEED,
      scale: 0.005,
      strength: 0.6,
      layers: 5,
      baseRoughness: 0.43,
      roughness: 1.96,
      persistence: 0.54,
      minValue: 1.03,
      center: debugObject.center,
      firstLayerAsMask: false,
    };

    const mountains: NoiseConfig = {
      enabled: true,
      seed: SEED,
      scale: 0.014,
      strength: 2.9,
      layers: 5,
      baseRoughness: 0.65,
      roughness: 1.74,
      persistence: 0.54,
      minValue: 0.75,
      center: debugObject.center,
      firstLayerAsMask: true,
    };

    const temperature: NoiseConfig = {
      enabled: true,
      seed: SEED * 0.512,
      scale: 0.009,
      strength: 0.65,
      layers: 2,
      baseRoughness: 0.4,
      roughness: 1.74,
      persistence: 0.6,
      minValue: 0.76,
      center: debugObject.center,
      firstLayerAsMask: true,
    };

    const humidity: NoiseConfig = {
      enabled: true,
      seed: SEED * 1.512,
      scale: 0.009,
      strength: 0.65,
      layers: 2,
      baseRoughness: 0.4,
      roughness: 1.74,
      persistence: 0.6,
      minValue: 0.76,
      center: debugObject.center,
      firstLayerAsMask: true,
    };

    const sampleContinents = makeNoiseLayer('Continents', continents);
    const sampleMountains = makeNoiseLayer('Mountains', mountains, sampleContinents);

    const sample = sampleMountains;

    // const sample = makeNoiseLayer('Humidity', humidity);

    runSample();

    plane.rotation.x = -Math.PI * 0.5;

    scene.add(plane);

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      requestAnimationFrame(animate);

      controls.update();
      renderer.render(scene, camera);

      plane.rotation.z += 0.001;
    }

    animate();

    window.addEventListener('resize', onWindowResize);
  });
</script>

<canvas bind:this={el} />

<style>
  :root {
    --tp-base-background-color: hsla(230, 20%, 11%, 1);
    --tp-base-shadow-color: hsla(0, 0%, 0%, 0.2);
    --tp-button-background-color: hsla(230, 10%, 80%, 1);
    --tp-button-background-color-active: hsla(230, 10%, 95%, 1);
    --tp-button-background-color-focus: hsla(230, 10%, 90%, 1);
    --tp-button-background-color-hover: hsla(230, 10%, 85%, 1);
    --tp-button-foreground-color: hsla(230, 20%, 11%, 1);
    --tp-container-background-color: hsla(230, 25%, 16%, 1);
    --tp-container-background-color-active: hsla(230, 25%, 31%, 1);
    --tp-container-background-color-focus: hsla(230, 25%, 26%, 1);
    --tp-container-background-color-hover: hsla(230, 25%, 21%, 1);
    --tp-container-foreground-color: hsla(230, 10%, 80%, 1);
    --tp-groove-foreground-color: hsla(230, 20%, 8%, 1);
    --tp-input-background-color: hsla(230, 20%, 8%, 1);
    --tp-input-background-color-active: hsla(230, 28%, 23%, 1);
    --tp-input-background-color-focus: hsla(230, 28%, 18%, 1);
    --tp-input-background-color-hover: hsla(230, 20%, 13%, 1);
    --tp-input-foreground-color: hsla(230, 10%, 80%, 1);
    --tp-label-foreground-color: hsla(230, 12%, 48%, 1);
    --tp-monitor-background-color: hsla(230, 20%, 8%, 1);
    --tp-monitor-foreground-color: hsla(230, 12%, 48%, 1);
  }

  canvas {
    width: 100vw;
    height: 100vh;
    background: black;
  }
</style>
