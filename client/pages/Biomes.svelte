<script lang="ts">
  import ndarray from 'ndarray';
  import { Noise } from 'noisejs';
  import { Pane } from 'tweakpane';
  import createKDTree from 'static-kdtree';

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
    sRGBEncoding,
  } from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  import BiomesVertexShader from '../core/shaders/biomes/vertex.glsl';
  import BiomesFragmentShader from '../core/shaders/biomes/fragment.glsl';

  let el: HTMLCanvasElement;

  function packColor(color: Color) {
    return Math.floor(color.r * 255) + Math.floor(color.g * 255) * 256 + Math.floor(color.b * 255) * 256 ** 2;
  }

  onMount(() => {
    const scene = new Scene();

    const renderer = new WebGLRenderer({ antialias: true, canvas: el });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = sRGBEncoding;

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
    // const SEED = 500 * Math.random();
    const SEED = 189.91792574986545;
    const WIDTH = 300;
    const DIMENSION = 512;
    const RADIUS_SCALE = 1.2;
    const MIN_RADIUS = 0.1;

    console.log('SEED: ', SEED);

    const debugObject = {
      depthColor: '#8e8b99',
      surfaceColor: '#f5ece4',
      center: new Vector3(0, 0, 0),
      displayBiomeCount: false,
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

    const runSample = async () => {
      const heights = ndarray(new Float32Array((DIMENSION + 1) ** 2), [DIMENSION + 1, DIMENSION + 1]);
      const colors = ndarray(new Int32Array((DIMENSION + 1) ** 2), [DIMENSION + 1, DIMENSION + 1]);

      let sum = 0;
      let min = 10;
      let max = -10;
      let count = 0;

      function dist(t1: number, h1: number, w1: number, t2: number, h2: number, w2: number) {
        return Math.sqrt((t1 - t2) ** 2 + (h1 - h2) ** 2 + (w1 - w2) ** 2);
      }

      let bruh = true;

      for (let i = 0; i <= DIMENSION; i++) {
        for (let j = 0; j <= DIMENSION; j++) {
          const p = new Vector3(i, 0, j);

          const temperature = sampleTemperature(p);
          const humidity = sampleHumidity(p);
          const weirdness = sampleWeirdness(p);

          const index = tree.nn([temperature, humidity, weirdness]);
          const closest = biomes[index];
          const nDist = dist(
            closest.temperature,
            closest.humidity,
            closest.weirdness,
            temperature,
            humidity,
            weirdness,
          );

          const radius = Math.max(nDist * RADIUS_SCALE, MIN_RADIUS);

          const nearBiomes = [];
          tree.rnn([temperature, humidity, weirdness], radius, (k: number) => {
            nearBiomes.push(biomes[k]);
          });

          let sumWeights = 0;
          const weightedBiomes = nearBiomes.map((b) => {
            const d = dist(b.temperature, b.humidity, b.weirdness, temperature, humidity, weirdness);
            const weight = (radius ** 2 - d ** 2) ** 2;
            sumWeights += weight;
            return [weight, b];
          });

          let depth = 0;
          if (bruh) {
            console.log(weightedBiomes);
          }

          let base = new Color(0, 0, 0);
          weightedBiomes.forEach(([w, b]) => {
            depth += (b.depth * w) / sumWeights;
            if (!debugObject.displayBiomeCount) {
              if (bruh) {
                console.log(
                  new Color(b.color),
                  w,
                  sumWeights,
                  w / sumWeights,
                  radius,
                  dist(b.temperature, b.humidity, b.weirdness, temperature, humidity, weirdness),
                );
              }
              base.add(new Color(b.color).multiplyScalar(w / sumWeights));
              base.multiplyScalar(0.5);
            }
          });

          if (debugObject.displayBiomeCount) {
            base.r = weightedBiomes.length / biomes.length;
            base.g = weightedBiomes.length / biomes.length;
            base.b = weightedBiomes.length / biomes.length;
          } else {
            // base.multiplyScalar(1 / weightedBiomes.length);
          }

          if (bruh) {
            console.log(base);
            bruh = false;
          }

          // const val = sample(p);

          // sum += val;
          // count += 1;

          // if (val < min) {
          //   min = val;
          // }
          // if (val > max) {
          //   max = val;
          // }

          heights.set(i, j, depth);
          colors.set(i, j, packColor(base));
        }
      }

      console.log('average:', sum / count, '\nmin:', min, '\nmax:', max);

      geometry.setAttribute('height', new Float32BufferAttribute(heights.data, 1));
      geometry.setAttribute('color', new Int32BufferAttribute(colors.data, 1));
    };

    const general = debug.addFolder({ title: 'General' });
    general.addInput(debugObject, 'center').on('change', runSample);
    general.addInput(debugObject, 'displayBiomeCount', { label: 'display biome count' }).on('change', runSample);
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
      folder.addInput(config, 'minValue', { min: -5, max: 5, step: 0.01 });

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
          noiseValue += (v * 1.414 + 0.5) * amplitude;
          frequency *= config.roughness;
          amplitude *= config.persistence;
        }

        noiseValue = Math.max(0, noiseValue - config.minValue);

        return parentValue + noiseValue * config.strength * (config.firstLayerAsMask && parent ? parentValue : 1);
      };
    };

    const biomes = [
      { name: 'A', temperature: 0.3, humidity: 0.3, weirdness: 0.2, color: '#64C9CF', depth: 0.8 },
      { name: 'B', temperature: 0.1, humidity: 0.1, weirdness: 0.1, color: '#986D8E', depth: 0.4 },
      { name: 'C', temperature: 0.1, humidity: 0.2, weirdness: 0.3, color: '#87A8A4', depth: 0.6 },
      { name: 'D', temperature: 0.6, humidity: 0.9, weirdness: 0.4, color: '#FF4C29', depth: 0.2 },
      { name: 'E', temperature: 0.9, humidity: 0.5, weirdness: 0.6, color: '#001E6C', depth: 1.0 },
    ];

    const tree = createKDTree(biomes.map((b) => [b.temperature, b.humidity, b.weirdness]));

    const continents: NoiseConfig = {
      enabled: true,
      seed: SEED,
      scale: 0.005,
      strength: 0.38,
      layers: 5,
      baseRoughness: 0.43,
      roughness: 1.3,
      persistence: 0.54,
      minValue: 0.9,
      center: debugObject.center,
      firstLayerAsMask: false,
    };

    const mountains: NoiseConfig = {
      enabled: true,
      seed: SEED,
      scale: 0.014,
      strength: 0.71,
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
      strength: 0.6,
      layers: 2,
      baseRoughness: 0.4,
      roughness: 1.74,
      persistence: 0.6,
      minValue: 0,
      center: debugObject.center,
      firstLayerAsMask: false,
    };

    const humidity: NoiseConfig = {
      enabled: true,
      seed: SEED * 1.512,
      scale: 0.009,
      strength: 0.6,
      layers: 2,
      baseRoughness: 0.4,
      roughness: 1.74,
      persistence: 0.6,
      minValue: 0,
      center: debugObject.center,
      firstLayerAsMask: false,
    };

    const weirdness: NoiseConfig = {
      enabled: true,
      seed: SEED * 2.812,
      scale: 0.009,
      strength: 0.6,
      layers: 2,
      baseRoughness: 0.4,
      roughness: 1.74,
      persistence: 0.6,
      minValue: 0,
      center: debugObject.center,
      firstLayerAsMask: false,
    };

    const sampleContinents = makeNoiseLayer('Continents', continents);
    const sampleMountains = makeNoiseLayer('Mountains', mountains, sampleContinents);

    const sample = sampleMountains;

    const sampleHumidity = makeNoiseLayer('Humidity', humidity);
    const sampleTemperature = makeNoiseLayer('Temperature', temperature);
    const sampleWeirdness = makeNoiseLayer('Weirdness', weirdness);

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
