<script lang="ts">
  import { onMount } from 'svelte';
  import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  let el: HTMLCanvasElement;

  onMount(() => {
    const scene = new Scene();

    const renderer = new WebGLRenderer({ antialias: true, canvas: el });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(400, 200, 0);

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = false;

    controls.minDistance = 100;
    controls.maxDistance = 500;

    controls.maxPolarAngle = Math.PI / 2;

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
  canvas {
    width: 100vw;
    height: 100vh;
    background: black;
  }
</style>
