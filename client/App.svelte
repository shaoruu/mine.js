<script lang="ts">
  import { Engine } from './core';

  let domElement: HTMLDivElement;
  let canvas: HTMLCanvasElement;

  const engine = new Engine({
    container: { canvas: canvas, domElement },
  });

  engine.start();
</script>

<main>
  <div bind:this={domElement}>
    <img src="https://i.imgur.com/ro6oLCL.png" id="crosshair" alt="+" />
    <canvas bind:this={canvas} />
  </div>
</main>

<style>
  main {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #crosshair {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    line-height: 20px;
    margin: -10px 0 0 -10px;
    z-index: 99;
    color: white;
    text-shadow: 1px 1px 0px black;
    text-align: center;
  }
</style>
